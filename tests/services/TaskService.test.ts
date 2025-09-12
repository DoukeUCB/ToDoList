import { TaskService } from '../../src/services/TaskService';
import { TaskRepository } from '../../src/repositories/TaskRepository';
import { Task } from '../../src/models/Task';

// Mock the TaskRepository
jest.mock('../../src/repositories/TaskRepository');

describe('TaskService', () => {
  let taskService: TaskService;
  let mockTaskRepository: jest.Mocked<TaskRepository>;

  beforeEach(() => {
    mockTaskRepository = new TaskRepository() as jest.Mocked<TaskRepository>;
    taskService = new TaskService(mockTaskRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return all tasks', async () => {
      const mockTasks: Task[] = [
        {
          id: 1,
          title: 'Test Task',
          description: 'Test Description',
          category: 'Casa',
          completed: false,
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockTaskRepository.findAll.mockResolvedValue(mockTasks);

      const result = await taskService.list();

      expect(result).toEqual(mockTasks);
      expect(mockTaskRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('listByUser', () => {
    it('should return tasks for a specific user', async () => {
      const userId = 1;
      const mockTasks: Task[] = [
        {
          id: 1,
          title: 'User Task',
          description: 'User Task Description',
          category: 'Casa',
          completed: false,
          userId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          title: 'Unassigned Task',
          description: 'Task without user',
          category: 'Universidad',
          completed: false,
          userId: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockTaskRepository.findByUserId.mockResolvedValue(mockTasks);

      const result = await taskService.listByUser(userId);

      expect(result).toEqual(mockTasks);
      expect(mockTaskRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('get', () => {
    it('should return task by id', async () => {
      const taskId = 1;
      const mockTask: Task = {
        id: taskId,
        title: 'Test Task',
        description: 'Test Description',
        category: 'Casa',
        completed: false,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTaskRepository.findById.mockResolvedValue(mockTask);

      const result = await taskService.get(taskId);

      expect(result).toEqual(mockTask);
      expect(mockTaskRepository.findById).toHaveBeenCalledWith(taskId);
    });

    it('should return null if task not found', async () => {
      const taskId = 999;
      mockTaskRepository.findById.mockResolvedValue(null);

      const result = await taskService.get(taskId);

      expect(result).toBeNull();
      expect(mockTaskRepository.findById).toHaveBeenCalledWith(taskId);
    });
  });

  describe('create', () => {
    it('should create a new task with all data', async () => {
      const taskData = {
        title: 'New Task',
        description: 'New Task Description',
        category: 'Casa',
        userId: 1,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-02'),
      };

      const expectedTaskData = {
        ...taskData,
        completed: false,
        startDate: taskData.startDate,
        endDate: taskData.endDate,
      };

      const mockCreatedTask: Task = {
        id: 1,
        ...expectedTaskData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTaskRepository.create.mockResolvedValue(mockCreatedTask);

      const result = await taskService.create(taskData);

      expect(result).toEqual(mockCreatedTask);
      expect(mockTaskRepository.create).toHaveBeenCalledWith(expectedTaskData);
    });

    it('should create a task with null dates when not provided', async () => {
      const taskData = {
        title: 'New Task',
        category: 'Casa',
        userId: 1,
      };

      const expectedTaskData = {
        ...taskData,
        completed: false,
        startDate: null,
        endDate: null,
      };

      const mockCreatedTask: Task = {
        id: 1,
        title: taskData.title,
        category: taskData.category,
        userId: taskData.userId,
        completed: false,
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTaskRepository.create.mockResolvedValue(mockCreatedTask);

      const result = await taskService.create(taskData);

      expect(result).toEqual(mockCreatedTask);
      expect(mockTaskRepository.create).toHaveBeenCalledWith(expectedTaskData);
    });

    it('should create a task without description', async () => {
      const taskData = {
        title: 'New Task',
        category: 'Casa',
        userId: 1,
      };

      const expectedTaskData = {
        ...taskData,
        completed: false,
        startDate: null,
        endDate: null,
      };

      const mockCreatedTask: Task = {
        id: 1,
        title: taskData.title,
        category: taskData.category,
        userId: taskData.userId,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTaskRepository.create.mockResolvedValue(mockCreatedTask);

      const result = await taskService.create(taskData);

      expect(result).toEqual(mockCreatedTask);
      expect(mockTaskRepository.create).toHaveBeenCalledWith(expectedTaskData);
    });
  });

  describe('update', () => {
    it('should update task with all fields', async () => {
      const taskId = 1;
      const updates = {
        title: 'Updated Task',
        description: 'Updated Description',
        category: 'Universidad',
        completed: true,
        startDate: new Date('2023-02-01'),
        endDate: new Date('2023-02-02'),
      };

      const mockUpdatedTask: Task = {
        id: taskId,
        ...updates,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTaskRepository.update.mockResolvedValue(mockUpdatedTask);

      const result = await taskService.update(taskId, updates);

      expect(result).toEqual(mockUpdatedTask);
      expect(mockTaskRepository.update).toHaveBeenCalledWith(taskId, {
        ...updates,
        startDate: new Date(updates.startDate),
        endDate: new Date(updates.endDate),
      });
    });

    it('should update task with partial data', async () => {
      const taskId = 1;
      const updates = {
        title: 'Updated Task',
        completed: true,
      };

      const mockUpdatedTask: Task = {
        id: taskId,
        title: updates.title,
        description: 'Original Description',
        category: 'Casa',
        completed: updates.completed,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTaskRepository.update.mockResolvedValue(mockUpdatedTask);

      const result = await taskService.update(taskId, updates);

      expect(result).toEqual(mockUpdatedTask);
      expect(mockTaskRepository.update).toHaveBeenCalledWith(taskId, updates);
    });

    it('should handle date conversion in updates', async () => {
      const taskId = 1;
      const updates = {
        startDate: '2023-02-01' as any, // Simulating string date from request
        endDate: '2023-02-02' as any,
      };

      const mockUpdatedTask: Task = {
        id: taskId,
        title: 'Test Task',
        category: 'Casa',
        completed: false,
        userId: 1,
        startDate: new Date('2023-02-01'),
        endDate: new Date('2023-02-02'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTaskRepository.update.mockResolvedValue(mockUpdatedTask);

      const result = await taskService.update(taskId, updates);

      expect(result).toEqual(mockUpdatedTask);
      expect(mockTaskRepository.update).toHaveBeenCalledWith(taskId, {
        startDate: new Date('2023-02-01'),
        endDate: new Date('2023-02-02'),
      });
    });

    it('should return null if task not found', async () => {
      const taskId = 999;
      const updates = {
        title: 'Updated Task',
      };

      mockTaskRepository.update.mockResolvedValue(null);

      const result = await taskService.update(taskId, updates);

      expect(result).toBeNull();
      expect(mockTaskRepository.update).toHaveBeenCalledWith(taskId, updates);
    });
  });

  describe('delete', () => {
    it('should delete task successfully', async () => {
      const taskId = 1;
      mockTaskRepository.delete.mockResolvedValue();

      await taskService.delete(taskId);

      expect(mockTaskRepository.delete).toHaveBeenCalledWith(taskId);
    });

    it('should handle deletion of non-existent task', async () => {
      const taskId = 999;
      mockTaskRepository.delete.mockResolvedValue();

      await taskService.delete(taskId);

      expect(mockTaskRepository.delete).toHaveBeenCalledWith(taskId);
    });
  });
});