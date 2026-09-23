import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import { env } from './env';

/**
 * Convierte una ruta con separadores del SO (p. ej. backslash en Windows)
 * a forward-slash. La librería `glob` que usa swagger-jsdoc internamente
 * espera patrones con '/', incluso en Windows: si se le pasa una ruta con
 * '\', simplemente no encuentra coincidencias (falla en silencio, sin
 * error) y el resultado es "No operations defined in spec!".
 */
function toPosixGlob(...segments: string[]): string {
  return path.join(...segments).split(path.sep).join('/');
}

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Manager API',
      version: '1.0.0',
      description:
        'API RESTful para gestión de tareas personales con autenticación JWT.',
    },
    servers: [{ url: `http://localhost:${env.port}`, description: 'Servidor local' }],
    security: [{ bearerAuth: [] }],
  },
  // Rutas donde swagger-jsdoc buscará los bloques @openapi.
  apis: [
    toPosixGlob(__dirname, '../api/routes/*.ts'),
    toPosixGlob(__dirname, '../api/routes/*.js'),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
