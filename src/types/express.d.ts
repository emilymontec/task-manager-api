import { JwtPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      /** Payload del JWT, adjuntado por authMiddleware tras verificar el token. */
      user?: JwtPayload;
    }
  }
}

export {};
