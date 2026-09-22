import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string | undefined;
  db: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: boolean;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  bcryptSaltRounds: number;
}

/**
 * Carga y valida una variable de entorno requerida.
 * Lanza un error temprano (fail-fast) si falta una variable crítica,
 * en lugar de fallar silenciosamente más adelante en tiempo de ejecución.
 */
function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`[Config] Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

/**
 * Env
 *
 * Implementa el patrón Singleton: las variables de entorno se leen y
 * validan una única vez, en el primer acceso a `Env.getInstance()`.
 * El resto de la aplicación consume siempre la misma instancia,
 * evitando relecturas de `process.env` dispersas por el código y
 * centralizando la validación de configuración.
 */
class Env {
  private static instance: Env;
  public readonly config: EnvConfig;

  private constructor() {
    this.config = {
      port: Number(process.env.PORT ?? 3000),
      nodeEnv: process.env.NODE_ENV ?? 'development',
      databaseUrl: process.env.DATABASE_URL,
      db: {
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        name: process.env.DB_NAME ?? 'task_manager',
        user: process.env.DB_USER ?? 'postgres',
        password: process.env.DB_PASSWORD ?? '',
        ssl: (process.env.DB_SSL ?? 'false').toLowerCase() === 'true',
      },
      jwt: {
        secret: required('JWT_SECRET'),
        expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
      },
      bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
    };

    // Si no hay DATABASE_URL, las variables sueltas de DB son obligatorias.
    if (!this.config.databaseUrl) {
      required('DB_HOST', this.config.db.host);
      required('DB_NAME', this.config.db.name);
      required('DB_USER', this.config.db.user);
    }
  }

  public static getInstance(): Env {
    if (!Env.instance) {
      Env.instance = new Env();
    }
    return Env.instance;
  }
}

export const env = Env.getInstance().config;
