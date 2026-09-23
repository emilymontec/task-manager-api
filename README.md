# Task Manager API

API RESTful para gestión de tareas personales, con registro, inicio de sesión y autenticación JWT. Construida con **Node.js**, **Express** y **TypeScript**, persistiendo en **PostgreSQL** (probado contra **NeonDB**).

## Arquitectura

El proyecto está organizado en capas, cada una con una responsabilidad única:

```
src/
├── api/
│   ├── routes/         # Definición de endpoints + documentación Swagger (JSDoc)
│   └── middlewares/     # auth, validate, validateUuidParam, errorHandler
├── controllers/          # Traducen HTTP <-> llamadas a servicios
├── services/             # Reglas de negocio (auth.service, task.service)
├── persistence/          # Única capa que conoce SQL (user.repository, task.repository)
├── schemas/              # Esquemas AJV/JSONSchema para validar entradas
├── config/                # env (Singleton), database (pool pg), swagger
├── types/                 # Tipos de dominio compartidos
├── utils/                 # errors, jwt, password (bcrypt)
├── app.ts                 # Construye la app de Express (sin levantar el puerto)
└── server.ts               # Punto de entrada: conecta a la BD y levanta el servidor
```

**Flujo de una petición:** `routes` → `middlewares` (auth/validate) → `controller` → `service` (reglas de negocio) → `repository` (SQL) → `PostgreSQL`.

### Decisiones de diseño relevantes

- **Regla de propiedad de tareas aplicada dos veces**: el `service` verifica explícitamente que la tarea pertenezca al usuario (lanzando `NotFoundError` si no), y además cada query del `repository` filtra por `user_id`. Redundante a propósito: aunque un desarrollador olvide la verificación en el service, el filtro en la capa SQL sigue impidiendo el acceso cruzado entre usuarios.
- **404 en vez de 403 para tareas ajenas**: si un usuario pide una tarea de otro, la API responde `404 Not Found` en lugar de `403 Forbidden`, para no confirmar que el recurso existe.
- **Mensaje de login uniforme**: "Credenciales inválidas" se usa tanto si el email no existe como si la contraseña es incorrecta, para no permitir enumerar emails registrados.

## Requisitos previos

- Node.js 18+
- Una base de datos PostgreSQL (se recomienda [NeonDB](https://neon.tech), tiene capa gratuita)

## Instalación local

```bash
npm install
```

## Configuración del `.env`

Copia el archivo de ejemplo y complétalo:

```bash
cp .env.example .env
```

Variables principales:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default `3000`) |
| `DATABASE_URL` | Cadena de conexión completa de PostgreSQL/NeonDB (recomendado) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL` | Alternativa a `DATABASE_URL`, si prefieres variables sueltas |
| `JWT_SECRET` | Secreto para firmar los JWT (obligatorio, usa un valor largo y aleatorio) |
| `JWT_EXPIRES_IN` | Expiración del token (ej. `1d`, `12h`) |
| `BCRYPT_SALT_ROUNDS` | Rondas de sal de bcrypt (default `10`) |

## Preparar la base de datos

Ejecuta el script de migración incluido contra tu base de datos. **Sin necesidad de `psql`**:

```bash
npm run migrate
```

Esto ejecutará `migrations/001_init.sql` usando Node.js + pg, creando:
- Tabla `users` (id, name, email, password_hash, created_at, updated_at)
- Enum `task_status` ('pendiente', 'en curso', 'completada')
- Tabla `tasks` (id, titulo, descripcion, fecha_vencimiento, estado, user_id, created_at, updated_at)
- Índices en `user_id`, `email` para queries rápidas

**Alternativa (si usas NeonDB):**
- Puedes ejecutar el SQL directamente desde la **web console de Neon**:
  1. Abre tu proyecto en https://console.neon.tech
  2. Navega a "SQL Editor"
  3. Copia el contenido de `migrations/001_init.sql` y pégalo
  4. Ejecuta

## Ejecutar el proyecto

```bash
# Modo desarrollo (hot reload con nodemon + ts-node)
npm run dev

# Compilar a JavaScript
npm run build

# Ejecutar la versión compilada
npm start

# Solo verificar tipos, sin emitir archivos
npm run typecheck
```

El servidor arranca en `http://localhost:3000` (o el `PORT` configurado).

## Documentación de la API

Con el servidor corriendo:

- **Swagger UI**: `http://localhost:3000/docs`
- **Especificación OpenAPI (JSON)**: `http://localhost:3000/docs.json`
- **Health check**: `GET /health`

## Endpoints

### Autenticación

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/auth/register` | Registra un usuario (`name`, `email`, `password`) | No |
| POST | `/auth/login` | Inicia sesión, devuelve `{ user, token }` | No |

### Tareas (requieren `Authorization: Bearer <token>`)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/tasks` | Crea una tarea |
| GET | `/tasks` | Lista las tareas del usuario autenticado |
| GET | `/tasks/:id` | Obtiene una tarea propia por id |
| PUT | `/tasks/:id` | Actualiza una tarea propia |
| DELETE | `/tasks/:id` | Elimina una tarea propia |

Campos de una tarea: `id`, `titulo`, `descripcion`, `fecha_vencimiento` (`AAAA-MM-DD`), `estado` (`pendiente` \| `en curso` \| `completada`).

### Ejemplo rápido con `curl`

```bash
# Registro
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana Pérez","email":"ana@example.com","password":"SecretPass123"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"SecretPass123"}' | jq -r .token)

# Crear tarea
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"titulo":"Terminar prueba técnica","fecha_vencimiento":"2026-09-30"}'

# Listar tareas
curl http://localhost:3000/tasks -H "Authorization: Bearer $TOKEN"
```

## Manejo de errores

Todas las respuestas de error siguen el formato:

```json
{ "error": { "message": "...", "details": [ /* opcional, ej. errores de validación */ ] } }
```

Errores de dominio (`AppError` y subclases en `src/utils/errors.ts`):

| Clase | Código | Uso |
|---|---|---|
| `ValidationError` | 400 | Body o parámetros inválidos |
| `AuthenticationError` | 401 | Token ausente/ inválido, credenciales incorrectas |
| `AuthorizationError` | 403 | (Reservado; no usado actualmente porque el ownership se resuelve como 404) |
| `NotFoundError` | 404 | Tarea u otro recurso inexistente / ajeno |
| `ConflictError` | 409 | Email ya registrado |

Cualquier error no controlado se responde como `500`, sin exponer detalles internos salvo en `NODE_ENV=development`.

## Deseables no implementados

Pruebas automatizadas y despliegue quedaron fuera del alcance de esta entrega por el plazo disponible; ver `DEVELOPMENT_LOG.md` para más detalle.
