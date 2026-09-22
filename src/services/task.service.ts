import { TaskRepository } from '../persistence/task.repository';
import { NotFoundError } from '../utils/errors';
import { CreateTaskInput, Task, UpdateTaskInput } from '../types/domain';

/**
 * TaskService
 * Contiene las reglas de negocio de las tareas. En particular, centraliza
 * la regla "una tarea solo es visible/editable por su dueño": cualquier
 * tarea que no pertenezca al userId se trata como si no existiera (404),
 * en vez de revelar con un 403 que el recurso existe pero es de otro usuario.
 */
export const TaskService = {
  async createTask(userId: string, input: CreateTaskInput): Promise<Task> {
    return TaskRepository.create(userId, input);
  },

  async listTasks(userId: string): Promise<Task[]> {
    return TaskRepository.findAllByUser(userId);
  },

  async getTaskById(userId: string, taskId: string): Promise<Task> {
    const task = await TaskRepository.findByIdAndUser(taskId, userId);
    if (!task) {
      throw new NotFoundError('Tarea no encontrada');
    }
    return task;
  },

  async updateTask(userId: string, taskId: string, input: UpdateTaskInput): Promise<Task> {
    // Verifica primero la pertenencia para poder lanzar 404 de forma
    // consistente antes de intentar el UPDATE.
    await this.getTaskById(userId, taskId);
    const updated = await TaskRepository.update(taskId, userId, input);
    if (!updated) {
      throw new NotFoundError('Tarea no encontrada');
    }
    return updated;
  },

  async deleteTask(userId: string, taskId: string): Promise<void> {
    const deleted = await TaskRepository.delete(taskId, userId);
    if (!deleted) {
      throw new NotFoundError('Tarea no encontrada');
    }
  },
};
