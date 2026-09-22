import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import { env } from './env';

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
  apis: [path.join(__dirname, '../api/routes/*.ts'), path.join(__dirname, '../api/routes/*.js')],
};

export const swaggerSpec = swaggerJSDoc(options);
