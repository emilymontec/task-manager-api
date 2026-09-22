import fs from 'fs';
import path from 'path';
import { pool } from '../config/database';

/**
 * Script de migración: ejecuta 001_init.sql contra PostgreSQL.
 * Úsalo así: npx ts-node src/scripts/migrate.ts
 */
async function migrate(): Promise<void> {
  try {
    const sqlPath = path.join(__dirname, '../../migrations/001_init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('[Migrate] Conectando a la base de datos...');
    const client = await pool.connect();

    try {
      console.log('[Migrate] Ejecutando migrations...');
      await client.query(sql);
      console.log('✅ Migración completada exitosamente.');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error durante la migración:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
