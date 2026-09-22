/**
 * Error base de la aplicación. Todos los errores "conocidos" (esperados)
 * extienden de esta clase, lo que permite al middleware de manejo de
 * errores diferenciarlos de errores de programación/inesperados.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 400 - Datos de entrada inválidos (fallo de validación de esquema). */
export class ValidationError extends AppError {
  constructor(message = 'Los datos enviados no son válidos', details?: unknown) {
    super(message, 400, details);
  }
}

/** 401 - Credenciales ausentes, inválidas o token inválido/expirado. */
export class AuthenticationError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401);
  }
}

/** 403 - Usuario autenticado pero sin permisos sobre el recurso. */
export class AuthorizationError extends AppError {
  constructor(message = 'No tienes permisos para realizar esta acción') {
    super(message, 403);
  }
}

/** 404 - Recurso no encontrado. */
export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

/** 409 - Conflicto con el estado actual del recurso (ej. email duplicado). */
export class ConflictError extends AppError {
  constructor(message = 'El recurso ya existe') {
    super(message, 409);
  }
}
