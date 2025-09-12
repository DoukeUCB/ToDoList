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
  private static async validateIdAndGetCategory(id: number): Promise<any> {
    if (Number.isNaN(id)) {
      const error = new Error('Invalid id');
      (error as any).status = 400;
      throw error;
    }
    const category = await service.get(id);
    if (!category) {
      const error = new Error('Category not found');
      (error as any).status = 404;
      throw error;
    }
    return category;

  }

  private static checkCategoryAccess(category: any, userId: number, allowDefault: boolean): void {
    if (!allowDefault && category.isDefault) {
      const error = new Error('No se pueden modificar las categorías por defecto');
      (error as any).status = 403;
      throw error;
    }
    if (!category.isDefault && category.userId !== userId) {
      const error = new Error(allowDefault ? 'No tienes permisos para acceder a esta categoría' : 'No tienes permisos para modificar esta categoría');
      (error as any).status = 403;
      throw error;
    }
  }

  private static checkCategoryAccessForDelete(category: any, userId: number): void {
    if (category.isDefault) {
      const error = new Error('No se pueden eliminar las categorías por defecto');
      (error as any).status = 403;
      throw error;
    }
    if (category.userId !== userId) {
      const error = new Error('No tienes permisos para eliminar esta categoría');
      (error as any).status = 403;
      throw error;
    }
  }

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
      const category = await this.validateIdAndGetCategory(id);
      this.checkCategoryAccess(category, userId, true);
      res.json(category);
    } catch (e: any) { 
      if (e.status) {
        return res.status(e.status).json({ message: e.message });
      }
      next(e); 
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, color } = req.body;
      const userId = req.session.userId!;
      
      if (!name?.trim()) {
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
      const category = await this.validateIdAndGetCategory(id);
      this.checkCategoryAccess(category, userId, false);
      
      const updates = req.body;
      if (updates.name) {
        updates.name = updates.name.trim();
      }
      
      const updated = await service.update(id, updates);
      res.json(updated);
    } catch (e: any) { 
      if (e.status) {
        return res.status(e.status).json({ message: e.message });
      }
      next(e); 
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = req.session.userId!;
      const category = await this.validateIdAndGetCategory(id);
      this.checkCategoryAccessForDelete(category, userId);
      
      await service.delete(id);
      res.status(204).send();
    } catch (e: any) { 
      if (e.status) {
        return res.status(e.status).json({ message: e.message });
      }
      next(e); 
    }
  }
}
