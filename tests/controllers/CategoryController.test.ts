import { Request, Response, NextFunction } from 'express';
import { CategoryController } from '../../src/controllers/CategoryController';
import { CategoryService } from '../../src/services/CategoryService';

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

describe('CategoryController', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  
  // Mock service methods directly on the prototype
  let listByUserSpy: jest.SpyInstance;
  let getSpy: jest.SpyInstance;
  let createSpy: jest.SpyInstance;
  let updateSpy: jest.SpyInstance;
  let deleteSpy: jest.SpyInstance;

  beforeEach(() => {
    // Setup spies on CategoryService prototype
    listByUserSpy = jest.spyOn(CategoryService.prototype, 'listByUser');
    getSpy = jest.spyOn(CategoryService.prototype, 'get');
    createSpy = jest.spyOn(CategoryService.prototype, 'create');
    updateSpy = jest.spyOn(CategoryService.prototype, 'update');
    deleteSpy = jest.spyOn(CategoryService.prototype, 'delete');

    mockRequest = {
      body: {},
      params: {},
      session: {
        userId: 1,
        user: {
          id: 1,
          name: 'Test User',
          userName: 'testuser',
          mail: 'test@example.com'
        }
      } as any
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('list', () => {
    it('should return categories for authenticated user', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Casa',
          color: '#4a8257ff',
          isDefault: true,
          userId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Trabajo',
          color: '#007bff',
          isDefault: false,
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      listByUserSpy.mockResolvedValue(mockCategories);

      await CategoryController.list(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(listByUserSpy).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCategories);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if service throws', async () => {
      const error = new Error('Service error');
      listByUserSpy.mockRejectedValue(error);

      await CategoryController.list(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should return category by id for authenticated user', async () => {
      const mockCategory = {
        id: 1,
        name: 'Casa',
        color: '#4a8257ff',
        isDefault: false,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      getSpy.mockResolvedValue(mockCategory);

      await CategoryController.get(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(getSpy).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCategory);
    });

    it('should return 400 for invalid id', async () => {
      mockRequest.params = { id: 'invalid' };

      await CategoryController.get(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid id' });
    });

    it('should return 404 if category not found', async () => {
      mockRequest.params = { id: '999' };
      getSpy.mockResolvedValue(null);

      await CategoryController.get(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Category not found' });
    });

    it('should deny access to category from different user', async () => {
      const mockCategory = {
        id: 1,
        name: 'Casa',
        color: '#4a8257ff',
        isDefault: false,
        userId: 2, // Different user
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      getSpy.mockResolvedValue(mockCategory);

      await CategoryController.get(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'No tienes permisos para acceder a esta categoría' 
      });
    });

    it('should allow access to default categories', async () => {
      const mockCategory = {
        id: 1,
        name: 'Casa',
        color: '#4a8257ff',
        isDefault: true,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      getSpy.mockResolvedValue(mockCategory);

      await CategoryController.get(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(mockCategory);
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const categoryData = {
        name: 'Nueva Categoría',
        color: '#ff0000',
      };

      const createdCategory = {
        id: 3,
        name: 'Nueva Categoría',
        color: '#ff0000',
        isDefault: false,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = categoryData;
      createSpy.mockResolvedValue(createdCategory);

      await CategoryController.create(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(createSpy).toHaveBeenCalledWith({
        name: categoryData.name.trim(),
        color: categoryData.color,
        userId: 1,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdCategory);
    });

    it('should create category with default color if not provided', async () => {
      const categoryData = {
        name: 'Nueva Categoría',
      };

      const createdCategory = {
        id: 3,
        name: 'Nueva Categoría',
        color: '#007bff',
        isDefault: false,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = categoryData;
      createSpy.mockResolvedValue(createdCategory);

      await CategoryController.create(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(createSpy).toHaveBeenCalledWith({
        name: categoryData.name.trim(),
        color: '#007bff',
        userId: 1,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdCategory);
    });

    it('should return 400 if name is missing or empty', async () => {
      mockRequest.body = { color: '#ff0000' };

      await CategoryController.create(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'El nombre de la categoría es requerido' 
      });
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('should return 400 if name is only whitespace', async () => {
      mockRequest.body = { name: '   ', color: '#ff0000' };

      await CategoryController.create(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'El nombre de la categoría es requerido' 
      });
    });
  });

  describe('update', () => {
    it('should update category successfully', async () => {
      const updateData = {
        name: 'Categoría Actualizada',
        color: '#00ff00',
      };

      const existingCategory = {
        id: 1,
        name: 'Categoría Original',
        color: '#ff0000',
        isDefault: false,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedCategory = { ...existingCategory, ...updateData };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      getSpy.mockResolvedValue(existingCategory);
      updateSpy.mockResolvedValue(updatedCategory);

      await CategoryController.update(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(getSpy).toHaveBeenCalledWith(1);
      expect(updateSpy).toHaveBeenCalledWith(1, {
        name: updateData.name.trim(),
        color: updateData.color,
      });
      expect(mockResponse.json).toHaveBeenCalledWith(updatedCategory);
    });

    it('should return 400 for invalid id', async () => {
      mockRequest.params = { id: 'invalid' };

      await CategoryController.update(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid id' });
    });

    it('should return 404 if category not found', async () => {
      mockRequest.params = { id: '999' };
      getSpy.mockResolvedValue(null);

      await CategoryController.update(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Category not found' });
    });

    it('should deny update of default category', async () => {
      const defaultCategory = {
        id: 1,
        name: 'Casa',
        color: '#4a8257ff',
        isDefault: true,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'New Name' };
      getSpy.mockResolvedValue(defaultCategory);

      await CategoryController.update(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'No se pueden modificar las categorías por defecto'
      });
    });

    it('should deny update of category from different user', async () => {
      const otherUserCategory = {
        id: 1,
        name: 'Casa',
        color: '#4a8257ff',
        isDefault: false,
        userId: 2, // Different user
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'New Name' };
      getSpy.mockResolvedValue(otherUserCategory);

      await CategoryController.update(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'No tienes permisos para modificar esta categoría' 
      });
    });
  });

  describe('delete', () => {
    it('should delete category successfully', async () => {
      const existingCategory = {
        id: 1,
        name: 'Categoría a Eliminar',
        color: '#ff0000',
        isDefault: false,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      getSpy.mockResolvedValue(existingCategory);
      deleteSpy.mockResolvedValue(undefined);

      await CategoryController.delete(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(getSpy).toHaveBeenCalledWith(1);
      expect(deleteSpy).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 400 for invalid id', async () => {
      mockRequest.params = { id: 'invalid' };

      await CategoryController.delete(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid id' });
    });

    it('should return 404 if category not found', async () => {
      mockRequest.params = { id: '999' };
      getSpy.mockResolvedValue(null);

      await CategoryController.delete(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Category not found' });
    });

    it('should deny deletion of default category', async () => {
      const defaultCategory = {
        id: 1,
        name: 'Casa',
        color: '#4a8257ff',
        isDefault: true,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      getSpy.mockResolvedValue(defaultCategory);

      await CategoryController.delete(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'No se pueden eliminar las categorías por defecto'
      });
    });

    it('should deny deletion of category from different user', async () => {
      const otherUserCategory = {
        id: 1,
        name: 'Casa',
        color: '#4a8257ff',
        isDefault: false,
        userId: 2, // Different user
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      getSpy.mockResolvedValue(otherUserCategory);

      await CategoryController.delete(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'No tienes permisos para eliminar esta categoría' 
      });
    });
  });
});