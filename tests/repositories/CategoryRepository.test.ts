import { CategoryRepository } from '../../src/repositories/CategoryRepository';
import { AppDataSource } from '../../src/database/data-source';
import { UserRepository } from '../../src/repositories/UserRepository';
import { User } from '../../src/models/User';
import { v4 as uuidv4 } from 'uuid';

describe('CategoryRepository', () => {
  let categoryRepository: CategoryRepository;
  let userRepository: UserRepository;
  let testUser: User;

  beforeAll(async () => {
    await AppDataSource.initialize();
    categoryRepository = new CategoryRepository();
    userRepository = new UserRepository();

    testUser = await userRepository.create({
      name: 'Test User',
      userName: `testuser-${uuidv4()}`,
      mail: `test-${uuidv4()}@example.com`,
      password: 'password',
    });
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it('should create a new category', async () => {
    const categoryData = {
      name: 'Test Category',
      isDefault: false,
      userId: testUser.id,
    };
    const category = await categoryRepository.create(categoryData);

    expect(category).toHaveProperty('id');
    expect(category.name).toBe('Test Category');
  });

  it('should find all categories', async () => {
    const categories = await categoryRepository.findAll();

    expect(Array.isArray(categories)).toBe(true);
  });

  it('should find a category by ID', async () => {
    const category = await categoryRepository.create({
      name: 'Find Test',
      isDefault: false,
      userId: testUser.id,
    });
    const foundCategory = await categoryRepository.findById(category.id);

    expect(foundCategory).not.toBeNull();
    expect(foundCategory?.id).toBe(category.id);
  });

  it('should update a category', async () => {
    const category = await categoryRepository.create({
      name: 'Update Test',
      isDefault: false,
      userId: testUser.id,
    });
    const updatedCategory = await categoryRepository.update(category.id, { name: 'Updated Name' });

    expect(updatedCategory).not.toBeNull();
    expect(updatedCategory?.name).toBe('Updated Name');
  });

  it('should delete a category', async () => {
    const category = await categoryRepository.create({
      name: 'Delete Test',
      isDefault: false,
      userId: testUser.id,
    });
    await categoryRepository.delete(category.id);
    const deletedCategory = await categoryRepository.findById(category.id);

    expect(deletedCategory).toBeNull();
  });
});