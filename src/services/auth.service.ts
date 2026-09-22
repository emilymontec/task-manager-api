import { UserRepository } from '../persistence/user.repository';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { ConflictError, AuthenticationError } from '../utils/errors';
import { LoginInput, RegisterInput, SafeUser } from '../types/domain';

/**
 * Quita el hash de contraseña antes de devolver el usuario al cliente.
 */
function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export const AuthService = {
  async register(input: RegisterInput): Promise<{ user: SafeUser; token: string }> {
    const existing = await UserRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('Ya existe una cuenta registrada con este email');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await UserRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    const token = signToken({ sub: user.id, email: user.email });
    return { user: toSafeUser(user), token };
  },

  async login(input: LoginInput): Promise<{ user: SafeUser; token: string }> {
    const user = await UserRepository.findByEmail(input.email);
    // Mensaje idéntico exista o no el usuario: evita filtrar por enumeración
    // de emails si las credenciales son incorrectas.
    if (!user) {
      throw new AuthenticationError('Credenciales inválidas');
    }

    const isValidPassword = await comparePassword(input.password, user.password_hash);
    if (!isValidPassword) {
      throw new AuthenticationError('Credenciales inválidas');
    }

    const token = signToken({ sub: user.id, email: user.email });
    return { user: toSafeUser(user), token };
  },
};
