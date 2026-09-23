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
 * Errores lanzados por `express.json()` (body-parser) cuando el cuerpo de
 * la petición no es JSON válido. Vienen como SyntaxError pero ya traen su
 * propio `status`/`statusCode` (400) y `type: 'entity.parse.failed'` —
 * hay que reconocerlos explícitamente porque no son instancias de AppError.
 */
interface BodyParserSyntaxError extends SyntaxError {
  status?: number;
  statusCode?: number;
  type?: string;
  body?: string;
}

function isBodyParserJsonError(err: unknown): err is BodyParserSyntaxError {
  return (
    err instanceof SyntaxError &&
    (err as BodyParserSyntaxError).type === 'entity.parse.failed'
  );
}

/**
 * errorHandler
 * Middleware de error de Express (4 argumentos). Es el único lugar de la
 * aplicación que decide el formato de respuesta ante un error:
 * - AppError (y subclases): errores esperados de negocio -> su propio statusCode.
 * - Errores de parseo de body-parser (JSON malformado): 400, mensaje claro.
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
  const isJsonParseError = !isAppError && isBodyParserJsonError(err);

  let statusCode = 500;
  let message = 'Error interno del servidor';

  if (isAppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (isJsonParseError) {
    statusCode = 400;
    message = 'El cuerpo de la petición no es JSON válido (revisa comas, comillas o llaves)';
  }

  const isHandledClientError = isAppError || isJsonParseError;
  if (!isHandledClientError) {
    // Errores no controlados (500 reales): se registran con el stack completo.
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
