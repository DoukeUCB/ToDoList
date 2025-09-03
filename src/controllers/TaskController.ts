import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/TaskService';

const service = new TaskService();

export class TaskController {
  static async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const tasks = await service.list();
      res.json(tasks);
    } catch (e) { next(e); }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
      const task = await service.get(id);
      if (!task) return res.status(404).json({ message: 'Task not found' });
      res.json(task);
    } catch (e) { next(e); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
   try {
        const { title, description, category } = req.body; // extraer category
        if (!title) return res.status(400).json({ message: 'title required' });
        if (!category) return res.status(400).json({ message: 'category required' }); // opcional, pero recomendable
        const created = await service.create({ title, description, category }); // enviar category
        res.status(201).json(created);
    } catch (e) {
        next(e);
    }
  }

  


  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
      const updates = req.body;
      const existing = await service.get(id);
      if (!existing) return res.status(404).json({ message: 'Task not found' });
      const updated = await service.update(id, updates);
      res.json(updated);
    } catch (e) { next(e); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
      const existing = await service.get(id);
      if (!existing) return res.status(404).json({ message: 'Task not found' });
      await service.delete(id);
      res.status(204).send();
    } catch (e) { next(e); }
  }
}
