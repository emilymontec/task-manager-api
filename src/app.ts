import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import routes from './api/routes';
import { errorHandler, notFoundHandler } from './api/middlewares/errorHandler.middleware';
import { swaggerSpec } from './config/swagger';
import { env } from './config/env';

/**
 * Crea y configura la instancia de Express. Separada de server.ts para
 * poder importar `app` en tests de integración sin levantar un puerto real.
 */
export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  }

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', env: env.nodeEnv });
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/docs.json', (_req, res) => res.json(swaggerSpec));

  app.use('/', routes);

  // 404 para rutas no definidas y manejador de errores centralizado, en ese orden.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
