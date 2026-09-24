# Bitácora de Desarrollo

## Resumen del proceso

El esqueleto completo de la API (estructura en capas, autenticación JWT,
CRUD de tareas, validación con AJV, manejo de errores centralizado y
documentación Swagger) se generó con asistencia de IA (Claude) a partir
del enunciado de la prueba. A partir de ahí se hicieron pruebas manuales
propias (Postman y terminal) que revelaron varios errores reales del
código generado, los cuales se diagnosticaron y corrigieron de forma
iterativa junto con la IA.

## Uso de Asistentes de IA

### Prompt utilizado

#### Inicial

```
Eres un desarrollador senior especializado en backend con TypeScript

Desarrolla una API RESTful robusta y bien organizada que demuestre
habilidad para escribir código limpio, estructurado y seguro, aplicando
prácticas de desarrollo backend con TypeScript. La API permitirá a los
usuarios registrarse, iniciar sesión y administrar sus propias tareas personales.

Arquitectura General Básica (en capas):
Estructura el proyecto en carpetas que separen claramente las responsabilidades:
src/api — Definición de rutas (routes) y middlewares.
src/controllers — Lógica principal que atiende las peticiones.
src/services — Lógicas de negocio más complejas o reutilizables.
src/persistence — Comunicación con la base de datos.
En caso de ser necesario, añadir otras carpetas (utils, config, etc.).

Gestión de Configuración
Utilizar un archivo .env para gestionar variables de entorno (puerto, datos
de conexión, etc.). Se debe incluir un archivo .env.example en el repositorio.
Para la gestión de variables dentro de la aplicación, se sugiere un patrón
Singleton que las cargue una sola vez y las ponga disponibles donde se necesiten.

Arquitectura Tecnológica:
Node.js
Express.js
TypeScript
PostgreSQL (NeonDB)

Módulos:
Registro
Inicio de sesión
Administración de tareas personales
```

#### Prompts de seguimiento (a raíz de errores encontrados en pruebas propias)

- "¿Alternativa de realizar migración? No puedo instalar psql (mi equipo no
  soporta psql)" → derivó en el script `src/scripts/migrate.ts`.
- Reporte del error `TSError: TS2339: Property 'user' does not exist on
  type 'Request'` al ejecutar `npm run dev`.
- "No aparece las operaciones en Swagger y revisa error en pruebas manuales
  (en postman y en terminal aparecen errores diferentes)
  [se inserta log de consola con el `SyntaxError` de `body-parser`] +
  captura de pantalla de "No operations defined in spec!" en Swagger.
- "Persiste error 500" + stack trace completo:
`column "estado" is of type task_status but expression is of type text`.

### Qué se aceptó y por qué

- **Estructura en capas** (`api/controllers/services/persistence`):
  cumple la arquitectura solicitada y separa responsabilidades con
  claridad.
- **Patrón repositorio** (`src/persistence/`): aísla el SQL en un solo
  lugar por entidad, lo que facilita cambiar de motor de BD o testear
  los servicios con mocks.
- **Filtrado por `user_id` en cada query de tareas**, no solo en el
  service: defensa en profundidad ante un futuro descuido en la capa de
  negocio.
- **`asyncHandler`** para envolver controladores async: evita repetir
  `try/catch` en cada uno y garantiza que las promesas rechazadas
  lleguen al `errorHandler`.
- **AJV con `JSONSchemaType<T>`**: los esquemas quedan ligados al tipo
  TypeScript de entrada, así un cambio en el tipo sin actualizar el
  esquema (o viceversa) produce un error de compilación.
- **Singleton `Env`**: centraliza la lectura y validación de variables
  de entorno en un único punto, con fallo temprano si falta una
  variable crítica (`JWT_SECRET`).

### Qué se rechazó o modificó

- **Migración con `psql`**: se reemplazó por un script propio
  (`src/scripts/migrate.ts`, ejecutable con `npm run migrate`) que corre
  el SQL de `migrations/001_init.sql` usando la librería `pg` ya
  incluida en el proyecto, evitando instalar el cliente de PostgreSQL
  completo solo para correr una migración.
- **`ts-node` no reconocía `req.user`** (`TS2339`): por defecto,
  `ts-node` solo compila los archivos alcanzables por `import` desde el
  punto de entrada, e ignora archivos `.d.ts` de augmentación global
  (`src/types/express.d.ts`) si nada los importa explícitamente. Se
  corrigió agregando `"ts-node": { "files": true }` en `tsconfig.json`
  para que respete el `include` del proyecto, igual que hace `tsc`.
- **Swagger UI en blanco ("No operations defined in spec!")**: en
  Windows, `path.join()` genera rutas con `\`, pero la librería `glob`
  que usa `swagger-jsdoc` internamente necesita `/` para que el patrón
  encuentre archivos — con `\` falla en silencio, sin lanzar error. Se
  normalizaron los paths del glob a forward-slash en
  `src/config/swagger.ts`.
- **`helmet()` bloqueaba el JS/CSS inline de Swagger UI**: la política
  CSP por defecto de `helmet` impide scripts y estilos inline, por lo
  que la página de `/docs` cargaba (200 OK) pero quedaba en blanco. Se
  configuró `contentSecurityPolicy` para permitir `'unsafe-inline'`
  solo en `script-src`/`style-src`, manteniendo el resto de las
  protecciones de `helmet`.
- **JSON malformado devolvía 500 en vez de 400**: `express.json()`
  (`body-parser`) sí detecta un JSON inválido (por ejemplo, una coma
  sobrante) y lo marca con `statusCode: 400`, pero el `errorHandler`
  original solo reconocía instancias de `AppError`; cualquier otro
  error caía al `500` genérico. Se agregó una detección explícita de
  errores `SyntaxError` con `type: 'entity.parse.failed'` para
  responder `400` con un mensaje claro.
- **`INSERT`/`UPDATE` de tareas fallaban con `estado`** (`column
  "estado" is of type task_status but expression is of type text`): el
  driver `pg` envía los parámetros como texto plano, y PostgreSQL no
  puede convertir automáticamente texto a un tipo `enum` dentro de una
  consulta parametrizada. Se agregó el cast explícito `::task_status` en
  el `INSERT` (`task.repository.ts`) y, para el `UPDATE` dinámico, se
  añadió el cast solo cuando el campo actualizado es `estado`.

### Verificación realizada

Durante la generación inicial:

- `npm run typecheck` — sin errores de tipos.
- `npm run build` — compila sin errores.
- Prueba de humo automatizada: `/health`, `/docs.json`, validación AJV
  en `/auth/register` con datos inválidos (devuelve 400 con detalles
  por campo), y acceso sin token a `/tasks` (devuelve 401).

Tras cada corrección, verificación dirigida al bug específico:

- Reproducción exacta del error `TS2339` con `ts-node` antes/después del
  fix de `tsconfig.json`.
- Reproducción exacta del JSON malformado reportado (con la coma
  sobrante) contra el servidor compilado, confirmando `400` con mensaje
  claro en vez de `500`.
- **Prueba end-to-end contra una instancia real de PostgreSQL**
  (instalada específicamente para esta verificación): registro → login
  → `POST /tasks` con `estado: "completada"` (el caso exacto que fallaba)
  → `201`; `POST /tasks` sin `estado` (usa el default `pendiente`) →
  `201`; `PUT /tasks/:id` cambiando `estado` a `"en curso"` → `200`.
- Confirmación de que `swagger-jsdoc` encuentra las 4 rutas y sus 7
  operaciones tras normalizar el glob.

Pruebas manuales propias:

- Pruebas de endpoints en Postman (autenticación, CRUD de tareas).
- Pruebas de operaciones en Swagger UI.

### Decisiones tomadas sin asistencia de IA

1. **NeonDB (PostgreSQL cloud) vs. PostgreSQL local**
   Facilita el despliegue en Render, es gratis durante desarrollo, 
   evita problemas OS-específicos y simula entorno de producción real.

2. **Script Node.js para migraciones (sin psql)**
   Evita instalación de dependencias pesadas, es multiplataforma, 
   reutilizable en CI/CD, se convierte en auto-migrations en producción.

3. **Aislar SQL en repositorios + filtrado doble por user_id**
   Defiende en profundidad (seguridad), mantenibilidad, testabilidad y 
   práctica estándar en fintech/healthtech.

4. **404 en vez de 403 para tareas ajenas**
   No revela información sobre recursos existentes, previene enumeración
   de IDs.

## Retos y Soluciones

- **Vulnerabilidades reportadas por `npm install`**
  (`8 vulnerabilities:   3 moderate, 3 high, 2 critical`): resuelto con
  `npm audit fix --force`
  (`found 0 vulnerabilities`).
  > Nota: `--force` puede subir dependencias a versiones mayores con
  > cambios incompatibles. Vale la pena revisar el `git diff` de
  > `package.json`/`package-lock.json` después de correrlo y volver a
  > correr `npm run typecheck` + `npm run build` para confirmar que
  > nada se rompió. Se realizó verificación de nuevo tras este cambio
  > y sigue   > compilando y pasando las pruebas end-to-end.
- **"No operations defined in spec!" en Swagger**: incompatibilidad de
  separador de rutas (`\` vs `/`) entre `path.join()` en Windows y la
  librería `glob` usada por `swagger-jsdoc`. Se normalizaron las rutas a
  `/` explícitamente.
- **`req.user` no reconocido por `ts-node`** (`TS2339`) al correr
  `npm run dev`, aunque `npm run build` compilaba sin problema: causado
  por el comportamiento por defecto de `ts-node`, que no carga
  declaraciones globales (`.d.ts`) no importadas explícitamente. Se
  corrigió con `"ts-node": { "files": true }`.
- **Error 500 real al crear/actualizar tareas con `estado`**: el mensaje
  de Postgres (`column "estado" is of type task_status but expression
  is of type text`) señaló directamente la causa — faltaba el cast
  explícito del parámetro al tipo `enum` en las consultas
  parametrizadas.
