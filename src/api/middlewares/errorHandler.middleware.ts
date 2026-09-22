import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/errors';
import { env } from '../../config/env';

interface ErrorResponseBody {
  error: {
    message: string;
    details?: unknown;
    stack?: string;
  };
}

/**
 * errorHandler
 * Middleware de error de Express (4 argumentos). Es el único lugar de la
 * aplicación que decide el formato de respuesta ante un error:
 * - AppError (y subclases): errores esperados de negocio -> su propio statusCode.
 * - Cualquier otro error: se trata como 500 y no se filtran detalles internos
 *   al cliente (solo se exponen en modo development).
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const message = isAppError ? err.message : 'Error interno del servidor';

  if (!isAppError) {
    // Errores no controlados: se registran con el stack completo para depuración.
    console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  }

  const body: ErrorResponseBody = { error: { message } };
  if (isAppError && err.details) {
    body.error.details = err.details;
  }
  if (env.nodeEnv === 'development' && err instanceof Error) {
    body.error.stack = err.stack;
  }

  res.status(statusCode).json(body);
}

/**
 * notFoundHandler
 * Captura cualquier ruta no definida (404 genérico), antes del errorHandler.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: { message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` } });
}

/**
 * asyncHandler
 * Envuelve controladores async para que cualquier rechazo de promesa
 * llegue automáticamente a errorHandler vía next(), sin necesidad de
 * try/catch repetido en cada controlador.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
