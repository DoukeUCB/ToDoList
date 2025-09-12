import { UserService } from '../../src/services/UserService';
import { UserRepository } from '../../src/repositories/UserRepository';
import { User } from '../../src/models/User';
import bcrypt from 'bcryptjs';

jest.mock('../../src/repositories/UserRepository');
jest.mock('bcryptjs');

describe('UserService', () => {
  let userService: UserService;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    userRepository = new UserRepository() as jest.Mocked<UserRepository>;
    userService = new UserService();
    (userService as any).userRepository = userRepository;
  });

  it('should get all users', async () => {
    const mockUsers: User[] = [
      { id: 1, name: 'John Doe', userName: 'johndoe', mail: 'john@example.com', password: 'hashed', createdAt: new Date(), updatedAt: new Date() },
    ];
    userRepository.findAll.mockResolvedValue(mockUsers);

    const users = await userService.getAllUsers();

    expect(users).toEqual(mockUsers);
    expect(userRepository.findAll).toHaveBeenCalled();
  });

  it('should create a new user', async () => {
    const mockUser: User = { id: 1, name: 'John Doe', userName: 'johndoe', mail: 'john@example.com', password: 'hashed', createdAt: new Date(), updatedAt: new Date() };
    userRepository.findByUserName.mockResolvedValue(null);
    userRepository.findByMail.mockResolvedValue(null);
    userRepository.create.mockResolvedValue(mockUser);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    const user = await userService.createUser('John Doe', 'johndoe', 'john@example.com', 'password');

    expect(user).toEqual(mockUser);
    expect(userRepository.findByUserName).toHaveBeenCalledWith('johndoe');
    expect(userRepository.findByMail).toHaveBeenCalledWith('john@example.com');
    expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
    expect(userRepository.create).toHaveBeenCalledWith({
      name: 'John Doe',
      userName: 'johndoe',
      mail: 'john@example.com',
      password: 'hashed',
    });
  });

  it('should throw an error if username already exists', async () => {
    userRepository.findByUserName.mockResolvedValue({ id: 1, name: 'John Doe', userName: 'johndoe', mail: 'john@example.com', password: 'hashed', createdAt: new Date(), updatedAt: new Date() });

    await expect(
      userService.createUser('John Doe', 'johndoe', 'john@example.com', 'password')
    ).rejects.toThrow('El nombre de usuario ya existe');
  });

  it('should authenticate a user with valid credentials', async () => {
    const mockUser: User = { id: 1, name: 'John Doe', userName: 'johndoe', mail: 'john@example.com', password: 'hashed', createdAt: new Date(), updatedAt: new Date() };
    userRepository.findByUserName.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const user = await userService.authenticateUser('johndoe', 'password');

    expect(user).toEqual(mockUser);
    expect(userRepository.findByUserName).toHaveBeenCalledWith('johndoe');
    expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashed');
  });

  it('should return null for invalid credentials', async () => {
    userRepository.findByUserName.mockResolvedValue(null);

    const user = await userService.authenticateUser('johndoe', 'password');

    expect(user).toBeNull();
    expect(userRepository.findByUserName).toHaveBeenCalledWith('johndoe');
  });
});