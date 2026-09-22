import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticationError } from './errors';

export interface JwtPayload {
  sub: string; // id del usuario
  email: string;
}

/**
 * Genera un JWT firmado para el usuario autenticado.
 */
export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwt.expiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwt.secret, options);
}

/**
 * Verifica y decodifica un JWT. Lanza AuthenticationError si el token
 * es inválido, está mal formado o expiró, unificando el manejo de
 * errores de la librería jsonwebtoken en un único tipo de error de dominio.
 */
export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.jwt.secret) as JwtPayload;
  } catch {
    throw new AuthenticationError('Token inválido o expirado');
  }
}
