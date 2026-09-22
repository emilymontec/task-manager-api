import bcrypt from 'bcrypt';
import { env } from '../config/env';

/**
 * Genera el hash seguro de una contraseña en texto plano.
 * La contraseña original nunca se persiste ni se registra en logs.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, env.bcryptSaltRounds);
}

/**
 * Compara una contraseña en texto plano contra su hash almacenado.
 */
export async function comparePassword(
  plainPassword: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
