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

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class CategoryController {
  private readonly service: CategoryService;

  constructor(service: CategoryService) {
    this.service = service;
  }

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

  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = CategoryController.getUserId(req);
      const categories = await this.service.listByUser(userId);
      res.json(categories);
    } catch (e) {
      next(e);
    }
  }

  async get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const id = CategoryController.parseId(req.params.id);
    const userId = CategoryController.getUserId(req);
    const category = await this.service.get(id);
    CategoryController.ensureExists(category, 'Category not found');
    CategoryController.ensureReadable(category, userId);
    res.json(category);
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, color } = req.body;
      const userId = CategoryController.getUserId(req);

      if (!name?.trim()) {
        return res.status(400).json({ message: 'El nombre de la categoría es requerido' });
      }

      const created = await this.service.create({
        name: name.trim(),
        color: color || '#007bff',
        userId,
      });

      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const id = CategoryController.parseId(req.params.id);
    const userId = CategoryController.getUserId(req);
    const existing = await this.service.get(id);
    CategoryController.ensureExists(existing, 'Category not found');
    CategoryController.ensureNotDefault(existing, 'update');
    CategoryController.ensureOwnership(existing, userId, 'modify');
    const updated = await this.service.update(id, req.body);
    res.json(updated);
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const id = CategoryController.parseId(req.params.id);
    const userId = CategoryController.getUserId(req);
    const existing = await this.service.get(id);
    CategoryController.ensureExists(existing, 'Category not found');
    CategoryController.ensureNotDefault(existing, 'delete');
    CategoryController.ensureOwnership(existing, userId, 'delete');
    await this.service.delete(id);
    res.status(204).send();
  }
}
