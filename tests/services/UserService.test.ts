import { UserService } from '../../src/services/UserService';
import { UserRepository } from '../../src/repositories/UserRepository';
import { User } from '../../src/models/User';
import bcrypt from 'bcryptjs';

// Mock the UserRepository
jest.mock('../../src/repositories/UserRepository');
jest.mock('bcryptjs');

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    userService = new UserService();
    
    // Override the private repository with our mock
    (userService as any).userRepository = mockUserRepository;
    
    // Setup bcrypt mocks
    (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers: User[] = [
        {
          id: 1,
          name: 'John Doe',
          userName: 'johndoe',
          mail: 'john@example.com',
          password: 'hashedpassword',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockUserRepository.findAll.mockResolvedValue(mockUsers);

      const result = await userService.getAllUsers();

      expect(result).toEqual(mockUsers);
      expect(mockUserRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUser: User = {
        id: 1,
        name: 'John Doe',
        userName: 'johndoe',
        mail: 'john@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById(1);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userService.getUserById(999);

      expect(result).toBeNull();
      expect(mockUserRepository.findById).toHaveBeenCalledWith(999);
    });
  });

  describe('getUserByUserName', () => {
    it('should return user by username', async () => {
      const mockUser: User = {
        id: 1,
        name: 'John Doe',
        userName: 'johndoe',
        mail: 'john@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByUserName.mockResolvedValue(mockUser);

      const result = await userService.getUserByUserName('johndoe');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findByUserName).toHaveBeenCalledWith('johndoe');
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        userName: 'johndoe',
        mail: 'john@example.com',
        password: 'password123',
      };

      const hashedPassword = 'hashedpassword123';
      const mockCreatedUser: User = {
        id: 1,
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByUserName.mockResolvedValue(null);
      mockUserRepository.findByMail.mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(mockCreatedUser);

      const result = await userService.createUser(
        userData.name,
        userData.userName,
        userData.mail,
        userData.password
      );

      expect(result).toEqual(mockCreatedUser);
      expect(mockUserRepository.findByUserName).toHaveBeenCalledWith(userData.userName);
      expect(mockUserRepository.findByMail).toHaveBeenCalledWith(userData.mail);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        name: userData.name,
        userName: userData.userName,
        mail: userData.mail,
        password: hashedPassword,
      });
    });

    it('should throw error if username already exists', async () => {
      const existingUser: User = {
        id: 1,
        name: 'Existing User',
        userName: 'johndoe',
        mail: 'existing@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByUserName.mockResolvedValue(existingUser);

      await expect(
        userService.createUser('John Doe', 'johndoe', 'john@example.com', 'password123')
      ).rejects.toThrow('El nombre de usuario ya existe');

      expect(mockUserRepository.findByUserName).toHaveBeenCalledWith('johndoe');
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      const existingUser: User = {
        id: 1,
        name: 'Existing User',
        userName: 'existinguser',
        mail: 'john@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByUserName.mockResolvedValue(null);
      mockUserRepository.findByMail.mockResolvedValue(existingUser);

      await expect(
        userService.createUser('John Doe', 'johndoe', 'john@example.com', 'password123')
      ).rejects.toThrow('El email ya está registrado');

      expect(mockUserRepository.findByMail).toHaveBeenCalledWith('john@example.com');
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userId = 1;
      const updateData = {
        name: 'Updated Name',
        userName: 'updateduser',
      };

      const updatedUser: User = {
        id: userId,
        name: updateData.name,
        userName: updateData.userName,
        mail: 'john@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByUserName.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUser(userId, updateData.name, updateData.userName);

      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.findByUserName).toHaveBeenCalledWith(updateData.userName);
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, updateData);
    });

    it('should throw error if username already exists for another user', async () => {
      const userId = 1;
      const existingUser: User = {
        id: 2,
        name: 'Other User',
        userName: 'existinguser',
        mail: 'other@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByUserName.mockResolvedValue(existingUser);

      await expect(
        userService.updateUser(userId, 'Updated Name', 'existinguser')
      ).rejects.toThrow('El nombre de usuario ya existe');

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should hash password when updating password', async () => {
      const userId = 1;
      const newPassword = 'newpassword123';
      const hashedPassword = 'hashednewpassword';

      const updatedUser: User = {
        id: userId,
        name: 'John Doe',
        userName: 'johndoe',
        mail: 'john@example.com',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockBcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUser(userId, undefined, undefined, undefined, newPassword);

      expect(result).toEqual(updatedUser);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, { password: hashedPassword });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockUserRepository.delete.mockResolvedValue(true);

      const result = await userService.deleteUser(1);

      expect(result).toBe(true);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should return false if user not found', async () => {
      mockUserRepository.delete.mockResolvedValue(false);

      const result = await userService.deleteUser(999);

      expect(result).toBe(false);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(999);
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate user with correct credentials', async () => {
      const mockUser: User = {
        id: 1,
        name: 'John Doe',
        userName: 'johndoe',
        mail: 'john@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByUserName.mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await userService.authenticateUser('johndoe', 'password123');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findByUserName).toHaveBeenCalledWith('johndoe');
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findByUserName.mockResolvedValue(null);

      const result = await userService.authenticateUser('nonexistent', 'password123');

      expect(result).toBeNull();
      expect(mockUserRepository.findByUserName).toHaveBeenCalledWith('nonexistent');
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null if password is incorrect', async () => {
      const mockUser: User = {
        id: 1,
        name: 'John Doe',
        userName: 'johndoe',
        mail: 'john@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByUserName.mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await userService.authenticateUser('johndoe', 'wrongpassword');

      expect(result).toBeNull();
      expect(mockUserRepository.findByUserName).toHaveBeenCalledWith('johndoe');
      expect(mockBcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
    });
  });
});