import { TaskController } from '../../src/controllers/TaskController';
import { TaskService } from '../../src/services/TaskService';
import { Request, Response, NextFunction } from 'express';
import { jest } from '@jest/globals';
import { Task } from '../../src/models/Task';

describe('TaskController', () => {
  let taskService: jest.Mocked<TaskService>;
  let taskController: TaskController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    taskService = {
      listByUser: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<TaskService>;

    taskController = new TaskController(taskService);

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
    it('should return a list of tasks for the user', async () => {
      const mockTasks: Task[] = [{
        id: 1,
        title: 'Task 1',
        category: 'Work',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }];
      taskService.listByUser.mockResolvedValue(mockTasks);

      await taskController.list(req as Request, res as Response, next);

      expect(taskService.listByUser).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockTasks);
    });
  });

  describe('get', () => {
    it('should return a task by ID', async () => {
      const mockTask: Task = {
        id: 1,
        title: 'Task 1',
        category: 'Work',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      req.params = { id: '1' };
      taskService.get.mockResolvedValue(mockTask);

      await taskController.get(req as Request, res as Response, next);

      expect(taskService.get).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockTask);
    });
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const mockTask: Task = {
        id: 1,
        title: 'Task 1',
        category: 'Work',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      req.body = { title: 'Task 1', category: 'Work' };
      taskService.create.mockResolvedValue(mockTask);

      await taskController.create(req as Request, res as Response, next);

      expect(taskService.create).toHaveBeenCalledWith({
        title: 'Task 1',
        category: 'Work',
        userId: 1,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockTask);
    });
  });

  describe('update', () => {
    it('should update an existing task', async () => {
      const mockTask: Task = {
        id: 1,
        title: 'Updated Task',
        category: 'Work',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      req.params = { id: '1' };
      req.body = { title: 'Updated Task' };
      taskService.get.mockResolvedValue(mockTask);
      taskService.update.mockResolvedValue(mockTask);

      await taskController.update(req as Request, res as Response, next);

      expect(taskService.get).toHaveBeenCalledWith(1);
      expect(taskService.update).toHaveBeenCalledWith(1, { title: 'Updated Task' });
      expect(res.json).toHaveBeenCalledWith(mockTask);
    });
  });

  describe('delete', () => {
    it('should delete a task', async () => {
      const mockTask: Task = {
        id: 1,
        title: 'Task 1',
        category: 'Work',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      req.params = { id: '1' };
      taskService.get.mockResolvedValue(mockTask);
      taskService.delete.mockResolvedValue();

      await taskController.delete(req as Request, res as Response, next);

      expect(taskService.get).toHaveBeenCalledWith(1);
      expect(taskService.delete).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});