import { UserRepository } from '../../src/repositories/UserRepository';
import { AppDataSource } from '../../src/database/data-source';
import { v4 as uuidv4 } from 'uuid';

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeAll(async () => {
    await AppDataSource.initialize();
    userRepository = new UserRepository();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    await AppDataSource.getRepository('tasks').clear();
    await AppDataSource.getRepository('categories').clear();
  });

  it('should create a new user', async () => {
    const userData = {
      name: 'Test User',
      userName: `testuser-${uuidv4()}`,
      mail: `test-${uuidv4()}@example.com`,
      password: 'password',
    };
    const user = await userRepository.create(userData);

    expect(user).toHaveProperty('id');
    expect(user.name).toBe('Test User');
  });

  it('should find all users', async () => {
    const users = await userRepository.findAll();

    expect(Array.isArray(users)).toBe(true);
  });

  it('should find a user by ID', async () => {
    const user = await userRepository.create({
      name: 'Find Test',
      userName: `finduser-${uuidv4()}`,
      mail: `find-${uuidv4()}@example.com`,
      password: 'password',
    });
    const foundUser = await userRepository.findById(user.id);

    expect(foundUser).not.toBeNull();
    expect(foundUser?.id).toBe(user.id);
  });

  it('should update a user', async () => {
    const user = await userRepository.create({
      name: 'Update Test',
      userName: `updateuser-${uuidv4()}`,
      mail: `update-${uuidv4()}@example.com`,
      password: 'password',
    });
    const updatedUser = await userRepository.update(user.id, { name: 'Updated Name' });

    expect(updatedUser).not.toBeNull();
    expect(updatedUser?.name).toBe('Updated Name');
  });

  it('should delete a user', async () => {
    const user = await userRepository.create({
      name: 'Delete Test',
      userName: `deleteuser-${uuidv4()}`,
      mail: `delete-${uuidv4()}@example.com`,
      password: 'password',
    });
    const result = await userRepository.delete(user.id);

    expect(result).toBe(true);
    const deletedUser = await userRepository.findById(user.id);
    expect(deletedUser).toBeNull();
  });
});