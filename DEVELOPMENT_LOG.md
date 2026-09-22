# Bitácora de Desarrollo

## Resumen del proceso

El esqueleto completo de la API (estructura en capas, autenticación JWT,
CRUD de tareas, validación con AJV, manejo de errores centralizado y
documentación Swagger) se generó con asistencia de IA (Claude) a partir
del enunciado de la prueba.

## Uso de Asistentes de IA

### Prompt utilizado

#### Inicial:
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


### Qué se aceptó y por qué

- **carpeta base**: continene los archivos base del proyecto,
cumpliendo arquitectura solicitada junto con la respeciva configuración


- **Patrón repositorio** (`src/persistence/`): permite aislar el SQL en
un solo   lugar por entidad, lo que facilita cambiar de motor de BD o
testear los   servicios con mocks.
- **Filtrado por `user_id` en cada query de tareas**, no solo en service:
defensa en profundidad ante futuros descuidos en la capa de negocio.
- **`asyncHandler`** envuelve controladores async: evita repetir `try/catch`
en cada uno y garantiza que las promesas rechazadas lleguen al `errorHandler`.
- **AJV con `JSONSchemaType<T>`**: los esquemas quedan ligados al tipo
TypeScript de entrada, así un cambio en el tipo sin actualizar el esquema
(o viceversa) produce un error de compilación.

### Qué se rechazó o modificó



### Verificación realizada

Durante la generación se verificó automáticamente:

- `npm run typecheck` — sin errores de tipos.
- `npm run build` — compila sin errores.
- Prueba de humo manual: `/health`, `/docs.json`, validación AJV en
  `/auth/register` con datos inválidos (devuelve 400 con detalles por
  campo), y acceso sin token a `/tasks` (devuelve 401).

Durante la realización de pruebas manuales:

- 

*(Tú debes añadir aquí: pruebas manuales contra una base de datos
PostgreSQL real —registro, login, CRUD completo de tareas, intento de
acceder a la tarea de otro usuario— y cualquier caso borde que hayas
probado tú mismo.)*

### Decisiones tomadas sin asistencia de IA



## Retos y Soluciones

- advertencia de paquetes criticos con `npm install`
(8 vulnerabilities (3 moderate, 3 high, 2 critical)),
resuelto con `npm audit fix --force` (found 0 vulnerabilities)


