import { query } from '../config/database';
import { User } from '../types/domain';

/**
 * UserRepository
 * Única capa que conoce el detalle SQL relacionado con `users`.
 * Los servicios nunca escriben SQL directamente: dependen de este repositorio.
 */
export const UserRepository = {
  async findByEmail(email: string): Promise<User | null> {
    const result = await query<User>(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    return result.rows[0] ?? null;
  },

  async findById(id: string): Promise<User | null> {
    const result = await query<User>(
      'SELECT * FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    return result.rows[0] ?? null;
  },

  async create(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    const result = await query<User>(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.name, data.email, data.passwordHash]
    );
    return result.rows[0];
  },
};
