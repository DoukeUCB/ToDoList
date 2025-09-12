import { UserService } from '../src/services/UserService';
import { UserRepository } from '../src/repositories/UserRepository';
import { User } from '../src/models/User';
import bcrypt from 'bcryptjs';

jest.mock('../src/repositories/UserRepository');
jest.mock('bcryptjs');

const mockUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
  let userService: UserService;
  let mockRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepo = new mockUserRepository() as jest.Mocked<UserRepository>;
    userService = new UserService();
    (userService as any).userRepository = mockRepo;
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const users: User[] = [{ id: 1, name: 'Test User' } as User];
      mockRepo.findAll.mockResolvedValue(users);

      const result = await userService.getAllUsers();

      expect(mockRepo.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const user: User = { id: 1, name: 'Test User' } as User;
      mockRepo.findById.mockResolvedValue(user);

      const result = await userService.getUserById(1);

      expect(mockRepo.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await userService.getUserById(1);

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = { name: 'Test', userName: 'testuser', mail: 'test@example.com', password: 'password' };
      const hashedPassword = 'hashedpassword';
      const createdUser: User = { id: 1, ...userData, password: hashedPassword } as User;

      mockRepo.findByUserName.mockResolvedValue(null);
      mockRepo.findByMail.mockResolvedValue(null);
      mockBcrypt.hash.mockImplementation(() => Promise.resolve(hashedPassword));
      mockRepo.create.mockResolvedValue(createdUser);

      const result = await userService.createUser(userData.name, userData.userName, userData.mail, userData.password);

      expect(mockRepo.findByUserName).toHaveBeenCalledWith(userData.userName);
      expect(mockRepo.findByMail).toHaveBeenCalledWith(userData.mail);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(mockRepo.create).toHaveBeenCalledWith({ ...userData, password: hashedPassword });
      expect(result).toEqual(createdUser);
    });

    it('should throw error if username exists', async () => {
      mockRepo.findByUserName.mockResolvedValue({} as User);

      await expect(userService.createUser('Test', 'testuser', 'test@example.com', 'password')).rejects.toThrow('El nombre de usuario ya existe');
    });

    it('should throw error if mail exists', async () => {
      mockRepo.findByUserName.mockResolvedValue(null);
      mockRepo.findByMail.mockResolvedValue({} as User);

      await expect(userService.createUser('Test', 'testuser', 'test@example.com', 'password')).rejects.toThrow('El email ya está registrado');
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate user with correct credentials', async () => {
      const user: User = { id: 1, userName: 'testuser', password: 'hashedpassword' } as User;
      mockRepo.findByUserName.mockResolvedValue(user);
      mockBcrypt.compare.mockImplementation(() => Promise.resolve(true));

      const result = await userService.authenticateUser('testuser', 'password');

      expect(mockRepo.findByUserName).toHaveBeenCalledWith('testuser');
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password', user.password);
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      mockRepo.findByUserName.mockResolvedValue(null);

      const result = await userService.authenticateUser('testuser', 'password');

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const user: User = { id: 1, userName: 'testuser', password: 'hashedpassword' } as User;
      mockRepo.findByUserName.mockResolvedValue(user);
      mockBcrypt.compare.mockImplementation(() => Promise.resolve(false));

      const result = await userService.authenticateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });
  });
});