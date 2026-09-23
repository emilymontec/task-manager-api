import { query } from '../config/database';
import { CreateTaskInput, Task, UpdateTaskInput } from '../types/domain';

/**
 * TaskRepository
 * Toda consulta SQL relacionada con `tasks` vive aquí. Cada método que
 * afecta una tarea concreta filtra también por `user_id`, como segunda
 * barrera de seguridad además de la verificación explícita en el servicio.
 */
export const TaskRepository = {
  async create(userId: string, data: CreateTaskInput): Promise<Task> {
    const result = await query<Task>(
      `INSERT INTO tasks (titulo, descripcion, fecha_vencimiento, estado, user_id)
       VALUES ($1, $2, $3, COALESCE($4::task_status, 'pendiente'::task_status), $5)
       RETURNING *`,
      [
        data.titulo,
        data.descripcion ?? null,
        data.fecha_vencimiento ?? null,
        data.estado ?? null,
        userId,
      ]
    );
    return result.rows[0];
  },

  async findAllByUser(userId: string): Promise<Task[]> {
    const result = await query<Task>(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },

  async findByIdAndUser(id: string, userId: string): Promise<Task | null> {
    const result = await query<Task>(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2 LIMIT 1',
      [id, userId]
    );
    return result.rows[0] ?? null;
  },

  async update(id: string, userId: string, data: UpdateTaskInput): Promise<Task | null> {
    // Construcción dinámica pero segura (parametrizada) del UPDATE,
    // para no sobrescribir campos que el cliente no envió.
    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        // `estado` es un enum en PostgreSQL: el driver `pg` envía los
        // parámetros como texto, así que sin el cast explícito Postgres
        // rechaza el UPDATE con "column is of type task_status but
        // expression is of type text".
        const cast = key === 'estado' ? '::task_status' : '';
        fields.push(`${key} = $${index}${cast}`);
        values.push(value);
        index += 1;
      }
    }

    if (fields.length === 0) {
      return this.findByIdAndUser(id, userId);
    }

    fields.push(`updated_at = now()`);
    values.push(id, userId);

    const result = await query<Task>(
      `UPDATE tasks SET ${fields.join(', ')}
       WHERE id = $${index} AND user_id = $${index + 1}
       RETURNING *`,
      values
    );
    return result.rows[0] ?? null;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  },
};
