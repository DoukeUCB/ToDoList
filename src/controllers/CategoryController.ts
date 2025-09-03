import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/CategoryService';

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

const service = new CategoryService();

export class CategoryController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.session.userId!;
      const categories = await service.listByUser(userId);
      res.json(categories);
    } catch (e) { 
      next(e); 
    }
  }

  static async get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = req.session.userId!;
      
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
      
      const category = await service.get(id);
      if (!category) return res.status(404).json({ message: 'Category not found' });
      
      // Verificar que la categoría pertenece al usuario o es una categoría por defecto
      if (!category.isDefault && category.userId !== userId) {
        return res.status(403).json({ message: 'No tienes permisos para acceder a esta categoría' });
      }
      
      res.json(category);
    } catch (e) { 
      next(e); 
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, color } = req.body;
      const userId = req.session.userId!;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'El nombre de la categoría es requerido' });
      }

      const created = await service.create({ 
        name: name.trim(), 
        color: color || '#007bff', 
        userId 
      });
      
      res.status(201).json(created);
    } catch (e) { 
      next(e); 
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = req.session.userId!;
      
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
      
      const existing = await service.get(id);
      if (!existing) return res.status(404).json({ message: 'Category not found' });
      
      // Verificar que la categoría pertenece al usuario y no es una categoría por defecto
      if (existing.isDefault) {
        return res.status(403).json({ message: 'No se pueden modificar las categorías por defecto' });
      }
      
      if (existing.userId !== userId) {
        return res.status(403).json({ message: 'No tienes permisos para modificar esta categoría' });
      }
      
      const updates = req.body;
      if (updates.name) {
        updates.name = updates.name.trim();
      }
      
      const updated = await service.update(id, updates);
      res.json(updated);
    } catch (e) { 
      next(e); 
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = req.session.userId!;
      
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
      
      const existing = await service.get(id);
      if (!existing) return res.status(404).json({ message: 'Category not found' });
      
      // Verificar que la categoría pertenece al usuario y no es una categoría por defecto
      if (existing.isDefault) {
        return res.status(403).json({ message: 'No se pueden eliminar las categorías por defecto' });
      }
      
      if (existing.userId !== userId) {
        return res.status(403).json({ message: 'No tienes permisos para eliminar esta categoría' });
      }
      
      await service.delete(id);
      res.status(204).send();
    } catch (e) { 
      next(e); 
    }
  }
}
