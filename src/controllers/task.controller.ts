import { Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import { AuthenticationError } from '../utils/errors';
import { CreateTaskInput, UpdateTaskInput } from '../types/domain';

/**
 * Extrae el id del usuario autenticado desde req.user (adjuntado por
 * authMiddleware). Si faltara por alguna razón, se trata como un fallo
 * de autenticación en vez de asumir un valor.
 */
function getUserId(req: Request): string {
  if (!req.user) {
    throw new AuthenticationError();
  }
  return req.user.sub;
}

export const TaskController = {
  /** POST /tasks */
  async create(req: Request, res: Response): Promise<void> {
    const userId = getUserId(req);
    const task = await TaskService.createTask(userId, req.body as CreateTaskInput);
    res.status(201).json({ task });
  },

  /** GET /tasks */
  async list(req: Request, res: Response): Promise<void> {
    const userId = getUserId(req);
    const tasks = await TaskService.listTasks(userId);
    res.status(200).json({ tasks });
  },

  /** GET /tasks/:id */
  async getById(req: Request, res: Response): Promise<void> {
    const userId = getUserId(req);
    const task = await TaskService.getTaskById(userId, req.params.id);
    res.status(200).json({ task });
  },

  /** PUT /tasks/:id */
  async update(req: Request, res: Response): Promise<void> {
    const userId = getUserId(req);
    const task = await TaskService.updateTask(userId, req.params.id, req.body as UpdateTaskInput);
    res.status(200).json({ task });
  },

  /** DELETE /tasks/:id */
  async remove(req: Request, res: Response): Promise<void> {
    const userId = getUserId(req);
    await TaskService.deleteTask(userId, req.params.id);
    res.status(204).send();
  },
};
