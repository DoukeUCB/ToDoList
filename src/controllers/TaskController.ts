import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/TaskService';

interface AuthenticatedRequest extends Request {
  session: Request['session'] & {
    userId?: number;
    user?: {
      id: number;
      name: string;
      userName: string;
      mail: string;
    };
  };
}

const service = new TaskService();

export class TaskController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.session.userId!; // El middleware requireAuth garantiza que existe
      const tasks = await service.listByUser(userId);
      res.json(tasks);
    } catch (e) { next(e); }
  }

  static async get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = req.session.userId!;
      
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
      
      const task = await service.get(id);
      if (!task) return res.status(404).json({ message: 'Task not found' });
      
      // Verificar que la tarea pertenece al usuario logueado (o no tiene usuario asignado aún)
      if (task.userId && task.userId !== userId) {
        return res.status(403).json({ message: 'No tienes permisos para acceder a esta tarea' });
      }
      
      res.json(task);
    } catch (e) { next(e); }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { title, description, category, startDate, endDate } = req.body;
      const userId = req.session.userId!;
      
      if (!title) return res.status(400).json({ message: 'title required' });
      if (!category) return res.status(400).json({ message: 'category required' });
      const created = await service.create({ title, description, userId, category, startDate, endDate });
      res.status(201).json(created);
    } catch (e) { next(e); }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = req.session.userId!;
      
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
      
      const existing = await service.get(id);
      if (!existing) return res.status(404).json({ message: 'Task not found' });
      
      // Verificar que la tarea pertenece al usuario logueado (o no tiene usuario asignado aún)
      if (existing.userId && existing.userId !== userId) {
        return res.status(403).json({ message: 'No tienes permisos para modificar esta tarea' });
      }
      
      const updates = req.body;
      // Si la tarea no tenía usuario asignado, asignarle el usuario actual
      if (!existing.userId) {
        updates.userId = userId;
      }
      
      const updated = await service.update(id, updates);
      res.json(updated);
    } catch (e) { next(e); }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = req.session.userId!;
      
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
      
      const existing = await service.get(id);
      if (!existing) return res.status(404).json({ message: 'Task not found' });
      
      // Verificar que la tarea pertenece al usuario logueado (o no tiene usuario asignado aún)
      if (existing.userId && existing.userId !== userId) {
        return res.status(403).json({ message: 'No tienes permisos para eliminar esta tarea' });
      }
      
      await service.delete(id);
      res.status(204).send();
    } catch (e) { next(e); }
  }
}
