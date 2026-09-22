import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { env } from './env';

/**
 * Configuración del Pool de conexiones.
 * Prioriza DATABASE_URL (formato típico de NeonDB / proveedores cloud),
 * y cae a variables individuales si no está definida.
 */
function buildPoolConfig(): PoolConfig {
  if (env.databaseUrl) {
    return {
      connectionString: env.databaseUrl,
      ssl: env.databaseUrl.includes('sslmode=require') || env.db.ssl
        ? { rejectUnauthorized: false }
        : undefined,
    };
  }

  return {
    host: env.db.host,
    port: env.db.port,
    database: env.db.name,
    user: env.db.user,
    password: env.db.password,
    ssl: env.db.ssl ? { rejectUnauthorized: false } : undefined,
  };
}

// Pool único compartido por toda la aplicación.
export const pool = new Pool(buildPoolConfig());

pool.on('error', (err) => {
  // Errores en clientes inactivos del pool (ej. conexión cerrada por el servidor).
  // Se registran pero no deben tumbar el proceso.
  console.error('[DB] Error inesperado en el pool de PostgreSQL:', err.message);
});

/**
 * Helper centralizado para ejecutar queries parametrizadas.
 * Mantiene toda la comunicación SQL en una sola función auditable
 * y facilita instrumentación (logs, métricas) en un solo lugar.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

/**
 * Verifica la conectividad con la base de datos al arrancar el servidor.
 */
export async function checkDatabaseConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
}
