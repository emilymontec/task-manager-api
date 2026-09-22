import { Router } from 'express';
import { TaskController } from '../../controllers/task.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { validateUuidParam } from '../middlewares/validateUuidParam.middleware';
import { asyncHandler } from '../middlewares/errorHandler.middleware';
import { createTaskSchema, updateTaskSchema } from '../../schemas/task.schema';

const router = Router();

// Todas las rutas de tareas requieren un usuario autenticado.
router.use(authMiddleware);

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         titulo: { type: string }
 *         descripcion: { type: string, nullable: true }
 *         fecha_vencimiento: { type: string, format: date, nullable: true }
 *         estado: { type: string, enum: [pendiente, "en curso", completada] }
 *         user_id: { type: string, format: uuid }
 *         created_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *     CreateTaskInput:
 *       type: object
 *       required: [titulo]
 *       properties:
 *         titulo: { type: string }
 *         descripcion: { type: string }
 *         fecha_vencimiento: { type: string, format: date }
 *         estado: { type: string, enum: [pendiente, "en curso", completada] }
 *     UpdateTaskInput:
 *       type: object
 *       properties:
 *         titulo: { type: string }
 *         descripcion: { type: string }
 *         fecha_vencimiento: { type: string, format: date }
 *         estado: { type: string, enum: [pendiente, "en curso", completada] }
 */

/**
 * @openapi
 * /tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Crea una nueva tarea del usuario autenticado
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateTaskInput' }
 *     responses:
 *       201:
 *         description: Tarea creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task: { $ref: '#/components/schemas/Task' }
 *       401: { description: No autenticado }
 *   get:
 *     tags: [Tasks]
 *     summary: Lista las tareas del usuario autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de tareas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Task' }
 *       401: { description: No autenticado }
 */
router.post('/', validate(createTaskSchema), asyncHandler(TaskController.create));
router.get('/', asyncHandler(TaskController.list));

/**
 * @openapi
 * /tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Obtiene una tarea por id (solo el dueño puede acceder)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tarea encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task: { $ref: '#/components/schemas/Task' }
 *       404: { description: Tarea no encontrada }
 *   put:
 *     tags: [Tasks]
 *     summary: Actualiza una tarea propia
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateTaskInput' }
 *     responses:
 *       200:
 *         description: Tarea actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task: { $ref: '#/components/schemas/Task' }
 *       404: { description: Tarea no encontrada }
 *   delete:
 *     tags: [Tasks]
 *     summary: Elimina una tarea propia
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Tarea eliminada }
 *       404: { description: Tarea no encontrada }
 */
router.get('/:id', validateUuidParam('id'), asyncHandler(TaskController.getById));
router.put(
  '/:id',
  validateUuidParam('id'),
  validate(updateTaskSchema),
  asyncHandler(TaskController.update)
);
router.delete('/:id', validateUuidParam('id'), asyncHandler(TaskController.remove));

export default router;
