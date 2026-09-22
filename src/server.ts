import { createApp } from './app';
import { env } from './config/env';
import { checkDatabaseConnection } from './config/database';

async function bootstrap(): Promise<void> {
  try {
    await checkDatabaseConnection();
    console.log('[DB] Conexión a PostgreSQL establecida correctamente.');
  } catch (error) {
    console.error('[DB] No fue posible conectar a la base de datos:', error);
    process.exit(1);
  }

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${env.port}`);
    console.log(`📚 Documentación Swagger en http://localhost:${env.port}/docs`);
  });
}

bootstrap();
