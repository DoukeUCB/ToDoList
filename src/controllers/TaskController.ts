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

export class TaskController {
  private readonly service: TaskService;

  constructor(service: TaskService) {
    this.service = service;
  }

  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.session.userId!;
      const tasks = await this.service.listByUser(userId);
      res.json(tasks);
    } catch (e) { next(e); }
  }

  async get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = req.session.userId!;
      
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
      
      const task = await this.service.get(id);
      if (!task) return res.status(404).json({ message: 'Task not found' });
      
      if (task.userId && task.userId !== userId) {
        return res.status(403).json({ message: 'No tienes permisos para acceder a esta tarea' });
      }
      
      res.json(task);
    } catch (e) { next(e); }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { title, description, category, startDate, endDate } = req.body;
      const userId = req.session.userId!;
      
      if (!title) return res.status(400).json({ message: 'title required' });
      if (!category) return res.status(400).json({ message: 'category required' });
      const created = await this.service.create({ title, description, userId, category, startDate, endDate });
      res.status(201).json(created);
    } catch (e) { next(e); }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const updates = req.body;
      const existing = await this.service.get(id);
      if (!existing) throw new Error('Task not found');
      const updated = await this.service.update(id, updates);
      res.json(updated);
    } catch (e) { next(e); }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const existing = await this.service.get(id);
      if (!existing) throw new Error('Task not found');
      await this.service.delete(id);
      res.status(204).send();
    } catch (e) { next(e); }
  }
}
