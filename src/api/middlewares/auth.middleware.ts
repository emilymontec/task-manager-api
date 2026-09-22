import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../../utils/jwt';
import { AuthenticationError } from '../../utils/errors';

/**
 * authMiddleware
 * Lee el token desde la cabecera `Authorization: Bearer <token>`,
 * lo verifica y, si es válido, adjunta el payload decodificado en
 * `req.user` para que los controladores sepan quién hace la petición.
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new AuthenticationError('Token no proporcionado');
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw new AuthenticationError('Token no proporcionado');
  }

  req.user = verifyToken(token);
  next();
}
