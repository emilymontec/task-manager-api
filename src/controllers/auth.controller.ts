import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginInput, RegisterInput } from '../types/domain';

export const AuthController = {
  /**
   * POST /auth/register
   * Registra un nuevo usuario y devuelve sus datos junto con un JWT,
   * para que quede autenticado inmediatamente tras registrarse.
   */
  async register(req: Request, res: Response): Promise<void> {
    const input = req.body as RegisterInput;
    const { user, token } = await AuthService.register(input);
    res.status(201).json({ user, token });
  },

  /**
   * POST /auth/login
   * Verifica credenciales y devuelve un JWT si son correctas.
   */
  async login(req: Request, res: Response): Promise<void> {
    const input = req.body as LoginInput;
    const { user, token } = await AuthService.login(input);
    res.status(200).json({ user, token });
  },
};
