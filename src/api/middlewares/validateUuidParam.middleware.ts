import { NextFunction, Request, Response } from 'express';
import { ValidationError } from '../../utils/errors';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * validateUuidParam
 * Evita que un id con formato inválido llegue hasta PostgreSQL (donde
 * produciría un error 22P02 "invalid input syntax for type uuid" y
 * terminaría como un 500 genérico). En su lugar, responde 400 de forma
 * temprana y clara.
 */
export function validateUuidParam(paramName: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.params[paramName];
    if (!UUID_REGEX.test(value)) {
      throw new ValidationError(`El parámetro '${paramName}' debe ser un UUID válido`);
    }
    next();
  };
}
