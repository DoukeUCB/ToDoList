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

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class CategoryController {
  private static getUserId(req: AuthenticatedRequest) {
    const userId = req.session.userId;
    if (typeof userId !== 'number') {
      throw new HttpError(401, 'Unauthorized');
    }
    return userId;
  }

  private static parseId(param?: string) {
    const id = Number(param);
    if (Number.isNaN(id)) {
      throw new HttpError(400, 'Invalid id');
    }
    return id;
  }

  private static ensureExists<T>(entity: T | null | undefined, message = 'Not found') {
    if (!entity) {
      throw new HttpError(404, message);
    }
  }

  private static ensureReadable(category: any, userId: number) {
    // Verificar que la categoría pertenece al usuario o es una categoría por defecto
    if (!category.isDefault && category.userId !== userId) {
      throw new HttpError(403, 'No tienes permisos para acceder a esta categoría');
    }
  }

  private static ensureNotDefault(category: any, action: 'update' | 'delete') {
    if (category.isDefault) {
      throw new HttpError(
        403,
        action === 'update'
          ? 'No se pueden modificar las categorías por defecto'
          : 'No se pueden eliminar las categorías por defecto'
      );
    }
  }

  private static ensureOwnership(category: any, userId: number, action: 'modify' | 'delete') {
    if (category.userId !== userId) {
      throw new HttpError(
        403,
        action === 'modify'
          ? 'No tienes permisos para modificar esta categoría'
          : 'No tienes permisos para eliminar esta categoría'
      );
    }
  }

  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = this.getUserId(req);
      const categories = await service.listByUser(userId);
      res.json(categories);
    } catch (e) {
      next(e);
    }
  }

  static async get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = this.parseId(req.params.id);
      const userId = this.getUserId(req);

      const category = await service.get(id);
      this.ensureExists(category, 'Category not found');
      this.ensureReadable(category, userId);

      res.json(category);
    } catch (e) {
      next(e);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, color } = req.body;
      const userId = this.getUserId(req);

      if (!name?.trim()) {
        return res.status(400).json({ message: 'El nombre de la categoría es requerido' });
      }

      const created = await service.create({
        name: name.trim(),
        color: color || '#007bff',
        userId,
      });

      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = this.parseId(req.params.id);
      const userId = this.getUserId(req);

      const existing = await service.get(id);
      this.ensureExists(existing, 'Category not found');

      this.ensureNotDefault(existing, 'update');
      this.ensureOwnership(existing, userId, 'modify');

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
      const id = this.parseId(req.params.id);
      const userId = this.getUserId(req);

      const existing = await service.get(id);
      this.ensureExists(existing, 'Category not found');

      this.ensureNotDefault(existing, 'delete');
      this.ensureOwnership(existing, userId, 'delete');

      await service.delete(id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
}
