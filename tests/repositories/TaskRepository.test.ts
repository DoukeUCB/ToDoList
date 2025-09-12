import { Repository } from 'typeorm';
import { TaskRepository } from '../../src/repositories/TaskRepository';
import { Task } from '../../src/models/Task';
import { AppDataSource } from '../../src/database/data-source';

jest.mock('../../src/database/data-source');

describe('TaskRepository', () => {
  let taskRepository: TaskRepository;
  let mockRepository: jest.Mocked<Repository<Task>>;

  beforeEach(() => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as any;

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
    taskRepository = new TaskRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all tasks', async () => {
      const mockTasks = [
        {
          id: 1,
          title: 'Test Task 1',
          description: 'Description 1',
          completed: false,
          userId: 1,
          category: 'Casa',
        },
      ];

      mockRepository.find.mockResolvedValue(mockTasks as Task[]);

      const result = await taskRepository.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['user']
      });
      expect(result).toEqual(mockTasks);
    });
  });

  describe('findByUserId', () => {
    it('should return tasks for user including unassigned', async () => {
      const mockTasks = [
        {
          id: 1,
          title: 'User Task',
          description: 'Description',
          completed: false,
          userId: 1,
          category: 'Casa',
        },
        {
          id: 2,
          title: 'Unassigned Task',
          description: 'Description',
          completed: false,
          userId: null,
          category: 'Casa',
        },
      ];

      mockRepository.find.mockResolvedValue(mockTasks as Task[]);

      const result = await taskRepository.findByUserId(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: [{ userId: 1 }, { userId: undefined }],
        relations: ['user']
      });
      expect(result).toEqual(mockTasks);
    });
  });

  describe('findById', () => {
    it('should return task by id', async () => {
      const mockTask = {
        id: 1,
        title: 'Test Task',
        description: 'Description',
        completed: false,
        userId: 1,
        category: 'Casa',
      };

      mockRepository.findOne.mockResolvedValue(mockTask as Task);

      const result = await taskRepository.findById(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user']
      });
      expect(result).toEqual(mockTask);
    });

    it('should return null if task not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await taskRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and save new task', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Description',
        userId: 1,
        category: 'Casa',
      };

      const createdTask = { id: 3, ...taskData, completed: false };

      mockRepository.create.mockReturnValue(createdTask as Task);
      mockRepository.save.mockResolvedValue(createdTask as Task);

      const result = await taskRepository.create(taskData);

      expect(mockRepository.create).toHaveBeenCalledWith(taskData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdTask);
      expect(result).toEqual(createdTask);
    });
  });

  describe('update', () => {
    it('should update task', async () => {
      const updateData = {
        title: 'Updated Task',
        description: 'Updated description',
      };

      const updatedTask = {
        id: 1,
        title: 'Updated Task',
        description: 'Updated description',
        completed: false,
        userId: 1,
        category: 'Casa',
      };

      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne.mockResolvedValue(updatedTask as Task);

      const result = await taskRepository.update(1, updateData);

      expect(mockRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user']
      });
      expect(result).toEqual(updatedTask);
    });

    it('should return null if task not found', async () => {
      mockRepository.update.mockResolvedValue({ affected: 0 } as any);
      mockRepository.findOne.mockResolvedValue(null);

      const result = await taskRepository.update(999, { title: 'New Title' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete task', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await taskRepository.delete(1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });
  });
});