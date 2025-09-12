import { TaskService } from '../src/services/TaskService';
import { TaskRepository } from '../src/repositories/TaskRepository';
import { Task } from '../src/models/Task';

jest.mock('../src/repositories/TaskRepository');

const mockTaskRepository = TaskRepository as jest.MockedClass<typeof TaskRepository>;

describe('TaskService', () => {
  let taskService: TaskService;
  let mockRepo: jest.Mocked<TaskRepository>;

  beforeEach(() => {
    mockRepo = new mockTaskRepository() as jest.Mocked<TaskRepository>;
    taskService = new TaskService(mockRepo);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return all tasks', async () => {
      const tasks: Task[] = [{ id: 1, title: 'Test Task' } as Task];
      mockRepo.findAll.mockResolvedValue(tasks);

      const result = await taskService.list();

      expect(mockRepo.findAll).toHaveBeenCalled();
      expect(result).toEqual(tasks);
    });
  });

  describe('listByUser', () => {
    it('should return tasks by user id', async () => {
      const tasks: Task[] = [{ id: 1, title: 'User Task' } as Task];
      mockRepo.findByUserId.mockResolvedValue(tasks);

      const result = await taskService.listByUser(1);

      expect(mockRepo.findByUserId).toHaveBeenCalledWith(1);
      expect(result).toEqual(tasks);
    });
  });

  describe('get', () => {
    it('should return task by id', async () => {
      const task: Task = { id: 1, title: 'Test Task' } as Task;
      mockRepo.findById.mockResolvedValue(task);

      const result = await taskService.get(1);

      expect(mockRepo.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(task);
    });
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const taskData = { title: 'New Task', description: 'Description', category: 'Work' };
      const createdTask: Task = { id: 1, ...taskData, completed: false } as Task;
      mockRepo.create.mockResolvedValue(createdTask);

      const result = await taskService.create(taskData);

      expect(mockRepo.create).toHaveBeenCalledWith({ ...taskData, completed: false, startDate: null, endDate: null });
      expect(result).toEqual(createdTask);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updates = { title: 'Updated Title' };
      const updatedTask: Task = { id: 1, title: 'Updated Title' } as Task;
      mockRepo.update.mockResolvedValue(updatedTask);

      const result = await taskService.update(1, updates);

      expect(mockRepo.update).toHaveBeenCalledWith(1, updates);
      expect(result).toEqual(updatedTask);
    });

    it('should format dates in updates', async () => {
      const updates = { startDate: new Date('2023-01-01'), endDate: new Date('2023-01-02') };
      mockRepo.update.mockResolvedValue({} as Task);

      await taskService.update(1, updates);

      expect(mockRepo.update).toHaveBeenCalledWith(1, updates);
    });
  });

  describe('delete', () => {
    it('should delete a task', async () => {
      mockRepo.delete.mockResolvedValue(undefined);

      await taskService.delete(1);

      expect(mockRepo.delete).toHaveBeenCalledWith(1);
    });
  });
});