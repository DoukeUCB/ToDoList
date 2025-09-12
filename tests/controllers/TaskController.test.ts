import { Request, Response, NextFunction } from 'express';
import { TaskController } from '../../src/controllers/TaskController';
import { TaskService } from '../../src/services/TaskService';

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

describe('TaskController', () => {
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
    // Setup spies on TaskService prototype
    listByUserSpy = jest.spyOn(TaskService.prototype, 'listByUser');
    getSpy = jest.spyOn(TaskService.prototype, 'get');
    createSpy = jest.spyOn(TaskService.prototype, 'create');
    updateSpy = jest.spyOn(TaskService.prototype, 'update');
    deleteSpy = jest.spyOn(TaskService.prototype, 'delete');

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
    it('should return tasks for authenticated user', async () => {
      const mockTasks = [
        {
          id: 1,
          title: 'Test Task 1',
          description: 'Description 1',
          completed: false,
          userId: 1,
          category: 'Casa',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          title: 'Test Task 2',
          description: 'Description 2',
          completed: false,
          userId: 1,
          category: 'Trabajo',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      listByUserSpy.mockResolvedValue(mockTasks);

      await TaskController.list(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(listByUserSpy).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockTasks);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if service throws', async () => {
      const error = new Error('Service error');
      listByUserSpy.mockRejectedValue(error);

      await TaskController.list(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should return task by id for authenticated user', async () => {
      const mockTask = {
        id: 1,
        title: 'Test Task',
        description: 'Description',
        completed: false,
        userId: 1,
        category: 'Casa',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      getSpy.mockResolvedValue(mockTask);

      await TaskController.get(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(getSpy).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockTask);
    });

    it('should return 400 for invalid id', async () => {
      mockRequest.params = { id: 'invalid' };

      await TaskController.get(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid id' });
    });

    it('should return 404 if task not found', async () => {
      mockRequest.params = { id: '999' };
      getSpy.mockResolvedValue(null);

      await TaskController.get(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Task not found' });
    });

    it('should deny access to task from different user', async () => {
      const mockTask = {
        id: 1,
        title: 'Test Task',
        description: 'Description',
        completed: false,
        userId: 2, // Different user
        category: 'Casa',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      getSpy.mockResolvedValue(mockTask);

      await TaskController.get(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'No tienes permisos para acceder a esta tarea' 
      });
    });

    it('should allow access to unassigned tasks', async () => {
      const mockTask = {
        id: 3,
        title: 'Unassigned Task',
        description: 'Description',
        completed: false,
        userId: null,
        category: 'Casa',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '3' };
      getSpy.mockResolvedValue(mockTask);

      await TaskController.get(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(mockTask);
    });
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'Nueva Tarea',
        description: 'Descripción de la tarea',
        category: 'Casa',
        startDate: '2023-01-01',
        endDate: '2023-01-02',
      };

      const createdTask = {
        id: 3,
        ...taskData,
        completed: false,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = taskData;
      createSpy.mockResolvedValue(createdTask);

      await TaskController.create(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(createSpy).toHaveBeenCalledWith({
        title: taskData.title,
        description: taskData.description,
        userId: 1,
        category: taskData.category,
        startDate: taskData.startDate,
        endDate: taskData.endDate,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdTask);
    });

    it('should return 400 if title is missing', async () => {
      mockRequest.body = { 
        description: 'Descripción',
        category: 'Casa' 
      };

      await TaskController.create(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'title required' 
      });
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('should return 400 if category is missing', async () => {
      mockRequest.body = { 
        title: 'Tarea',
        description: 'Descripción' 
      };

      await TaskController.create(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'category required' 
      });
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update task successfully', async () => {
      const updateData = {
        title: 'Tarea Actualizada',
        description: 'Nueva descripción',
      };

      const existingTask = {
        id: 1,
        title: 'Tarea Original',
        description: 'Descripción original',
        completed: false,
        userId: 1,
        category: 'Casa',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedTask = { ...existingTask, ...updateData };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      getSpy.mockResolvedValue(existingTask);
      updateSpy.mockResolvedValue(updatedTask);

      await TaskController.update(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(getSpy).toHaveBeenCalledWith(1);
      expect(updateSpy).toHaveBeenCalledWith(1, updateData);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedTask);
    });

    it('should return 400 for invalid id', async () => {
      mockRequest.params = { id: 'invalid' };

      await TaskController.update(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid id' });
    });

    it('should return 404 if task not found', async () => {
      mockRequest.params = { id: '999' };
      getSpy.mockResolvedValue(null);

      await TaskController.update(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Task not found' });
    });

    it('should deny update of task from different user', async () => {
      const otherUserTask = {
        id: 1,
        title: 'Tarea de otro usuario',
        description: 'Descripción',
        completed: false,
        userId: 2, // Different user
        category: 'Casa',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { title: 'New Title' };
      getSpy.mockResolvedValue(otherUserTask);

      await TaskController.update(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'No tienes permisos para modificar esta tarea' 
      });
    });

    it('should assign user to unassigned task during update', async () => {
      const unassignedTask = {
        id: 3,
        title: 'Unassigned Task',
        description: 'Descripción',
        completed: false,
        userId: null,
        category: 'Casa',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData = { title: 'Updated Task' };
      const expectedUpdate = { ...updateData, userId: 1 };
      const updatedTask = { ...unassignedTask, ...expectedUpdate };

      mockRequest.params = { id: '3' };
      mockRequest.body = updateData;
      getSpy.mockResolvedValue(unassignedTask);
      updateSpy.mockResolvedValue(updatedTask);

      await TaskController.update(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(updateSpy).toHaveBeenCalledWith(3, expectedUpdate);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedTask);
    });
  });

  describe('delete', () => {
    it('should delete task successfully', async () => {
      const existingTask = {
        id: 1,
        title: 'Tarea a Eliminar',
        description: 'Descripción',
        completed: false,
        userId: 1,
        category: 'Casa',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      getSpy.mockResolvedValue(existingTask);
      deleteSpy.mockResolvedValue(undefined);

      await TaskController.delete(
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

      await TaskController.delete(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid id' });
    });

    it('should return 404 if task not found', async () => {
      mockRequest.params = { id: '999' };
      getSpy.mockResolvedValue(null);

      await TaskController.delete(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Task not found' });
    });

    it('should deny deletion of task from different user', async () => {
      const otherUserTask = {
        id: 1,
        title: 'Tarea de otro usuario',
        description: 'Descripción',
        completed: false,
        userId: 2, // Different user
        category: 'Casa',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      getSpy.mockResolvedValue(otherUserTask);

      await TaskController.delete(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'No tienes permisos para eliminar esta tarea' 
      });
    });

    it('should allow deletion of unassigned task', async () => {
      const unassignedTask = {
        id: 3,
        title: 'Unassigned Task',
        description: 'Descripción',
        completed: false,
        userId: null,
        category: 'Casa',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '3' };
      getSpy.mockResolvedValue(unassignedTask);
      deleteSpy.mockResolvedValue(undefined);

      await TaskController.delete(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(deleteSpy).toHaveBeenCalledWith(3);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
    });
  });
});