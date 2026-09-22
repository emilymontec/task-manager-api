import { NextFunction, Request, Response } from 'express';
import Ajv, { AnySchema } from 'ajv';
import addFormats from 'ajv-formats';
import { ValidationError } from '../../utils/errors';

// Instancia única de AJV para toda la app (compilar esquemas es costoso;
// se reutiliza el mismo validador para cada request).
const ajv = new Ajv({ allErrors: true, removeAdditional: false });
addFormats(ajv);

/**
 * validate
 * Middleware factory: recibe un JSON Schema y devuelve un middleware que
 * valida `req.body` contra él. Si falla, lanza ValidationError (400) con
 * el detalle de los errores de AJV, que el errorHandler central formatea.
 */
export function validate(schema: AnySchema) {
  const validateFn = ajv.compile(schema);

  return (req: Request, _res: Response, next: NextFunction): void => {
    const valid = validateFn(req.body);
    if (!valid) {
      const details = (validateFn.errors ?? []).map((err) => ({
        field: err.instancePath || err.params?.missingProperty || '(body)',
        message: err.message,
      }));
      throw new ValidationError('Los datos enviados no son válidos', details);
    }
    next();
  };
}
