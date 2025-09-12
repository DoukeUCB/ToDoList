import { TaskRepository } from '../../src/repositories/TaskRepository';
import { AppDataSource } from '../../src/database/data-source';
import { UserRepository } from '../../src/repositories/UserRepository';
import { CategoryRepository } from '../../src/repositories/CategoryRepository';
import { Category } from '../../src/models/Category';
import { User } from '../../src/models/User';
import { v4 as uuidv4 } from 'uuid';

describe('TaskRepository', () => {
  let taskRepository: TaskRepository;
  let userRepository: UserRepository;
  let categoryRepository: CategoryRepository;
  let testUser: User;
  let testCategory: Category;

  beforeAll(async () => {
    await AppDataSource.initialize();
    taskRepository = new TaskRepository();
    userRepository = new UserRepository();
    categoryRepository = new CategoryRepository();

    testUser = await userRepository.create({
      name: 'Test User',
      userName: `testuser-${uuidv4()}`,
      mail: `test-${uuidv4()}@example.com`,
      password: 'password',
    });

    testCategory = await categoryRepository.create({
      name: 'Test Category',
      isDefault: false,
      userId: testUser.id,
    });
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it('should create a new task', async () => {
    const taskData = {
      title: 'Test Task',
      description: 'Test Description',
      userId: testUser.id,
      category: testCategory.name,
    };
    const task = await taskRepository.create(taskData);

    expect(task).toHaveProperty('id');
    expect(task.title).toBe('Test Task');
  });

  it('should find all tasks', async () => {
    const tasks = await taskRepository.findAll();

    expect(Array.isArray(tasks)).toBe(true);
  });

  it('should find a task by ID', async () => {
    const task = await taskRepository.create({
      title: 'Find Test',
      description: 'Find Description',
      userId: testUser.id,
      category: testCategory.id.toString(),
    });
    const foundTask = await taskRepository.findById(task.id);

    expect(foundTask).not.toBeNull();
    expect(foundTask?.id).toBe(task.id);
  });

  it('should update a task', async () => {
    const task = await taskRepository.create({
      title: 'Update Test',
      description: 'Update Description',
      userId: testUser.id,
      category: testCategory.id.toString(),
    });
    const updatedTask = await taskRepository.update(task.id, { title: 'Updated Title' });

    expect(updatedTask).not.toBeNull();
    expect(updatedTask?.title).toBe('Updated Title');
  });

  it('should delete a task', async () => {
    const task = await taskRepository.create({
      title: 'Delete Test',
      description: 'Delete Description',
      userId: testUser.id,
      category: testCategory.id.toString(),
    });
    await taskRepository.delete(task.id);
    const deletedTask = await taskRepository.findById(task.id);

    expect(deletedTask).toBeNull();
  });
});