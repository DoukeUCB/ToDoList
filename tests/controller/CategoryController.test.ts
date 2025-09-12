import { CategoryController } from '../../src/controllers/CategoryController';
import { CategoryService } from '../../src/services/CategoryService';
import { Request, Response, NextFunction } from 'express';
import { jest } from '@jest/globals';
import { Category } from '../../src/models/Category';

describe('CategoryController', () => {
  let categoryService: jest.Mocked<CategoryService>;
  let categoryController: CategoryController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    categoryService = {
      listByUser: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<CategoryService>;

    categoryController = new CategoryController(categoryService);

    req = {
      session: { userId: 1 } as any,
      params: {},
      body: {},
    } as Partial<Request>;

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as Partial<Response>;

    next = jest.fn();
  });

  describe('list', () => {
    it('should return a list of categories for the user', async () => {
      const mockCategories: Category[] = [{
        id: 1,
        name: 'Work',
        color: '#000000',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }];
      categoryService.listByUser.mockResolvedValue(mockCategories);

      await categoryController.list(req as Request, res as Response, next);

      expect(categoryService.listByUser).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockCategories);
    });
  });

  describe('get', () => {
    it('should return a category by ID', async () => {
      const mockCategory: Category = {
        id: 1,
        name: 'Work',
        color: '#000000',
        isDefault: false,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      req.params = { id: '1' };
      categoryService.get.mockResolvedValue(mockCategory);

      await categoryController.get(req as Request, res as Response, next);

      expect(categoryService.get).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockCategory);
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const mockCategory: Category = {
        id: 1,
        name: 'Work',
        color: '#000000',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      req.body = { name: 'Work', color: '#000000' };
      categoryService.create.mockResolvedValue(mockCategory);

      await categoryController.create(req as Request, res as Response, next);

      expect(categoryService.create).toHaveBeenCalledWith({
        name: 'Work',
        color: '#000000',
        userId: 1,
      });
      expect(res.json).toHaveBeenCalledWith(mockCategory);
    });
  });

  describe('update', () => {
    it('should update an existing category', async () => {
      const mockCategory: Category = {
        id: 1,
        name: 'Updated Work',
        color: '#000000',
        isDefault: false,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      req.params = { id: '1' };
      req.body = { name: 'Updated Work' };
      categoryService.get.mockResolvedValue(mockCategory); // Simular que la categoría existe
      categoryService.update.mockResolvedValue(mockCategory);

      await categoryController.update(req as Request, res as Response, next);

      expect(categoryService.get).toHaveBeenCalledWith(1);
      expect(categoryService.update).toHaveBeenCalledWith(1, { name: 'Updated Work' });
      expect(res.json).toHaveBeenCalledWith(mockCategory);
    });
  });

  describe('delete', () => {
    it('should delete a category', async () => {
      const mockCategory: Category = {
        id: 1,
        name: 'Work',
        color: '#000000',
        isDefault: false,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      req.params = { id: '1' };
      categoryService.get.mockResolvedValue(mockCategory); // Simular que la categoría existe
      categoryService.delete.mockResolvedValue();

      await categoryController.delete(req as Request, res as Response, next);

      expect(categoryService.get).toHaveBeenCalledWith(1);
      expect(categoryService.delete).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});