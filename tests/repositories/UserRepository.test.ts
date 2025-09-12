import { Repository } from 'typeorm';
import { UserRepository } from '../../src/repositories/UserRepository';
import { User } from '../../src/models/User';
import { AppDataSource } from '../../src/database/data-source';

jest.mock('../../src/database/data-source');

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockRepository: jest.Mocked<Repository<User>>;

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
    userRepository = new UserRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'John Doe',
          userName: 'johndoe',
          mail: 'john@example.com',
          password: 'hashedpassword',
        },
      ];

      mockRepository.find.mockResolvedValue(mockUsers as User[]);

      const result = await userRepository.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['tasks']
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        userName: 'johndoe',
        mail: 'john@example.com',
        password: 'hashedpassword',
      };

      mockRepository.findOne.mockResolvedValue(mockUser as User);

      const result = await userRepository.findById(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['tasks']
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await userRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByUserName', () => {
    it('should return user by username', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        userName: 'johndoe',
        mail: 'john@example.com',
        password: 'hashedpassword',
      };

      mockRepository.findOne.mockResolvedValue(mockUser as User);

      const result = await userRepository.findByUserName('johndoe');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userName: 'johndoe' }
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await userRepository.findByUserName('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByMail', () => {
    it('should return user by email', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        userName: 'johndoe',
        mail: 'john@example.com',
        password: 'hashedpassword',
      };

      mockRepository.findOne.mockResolvedValue(mockUser as User);

      const result = await userRepository.findByMail('john@example.com');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { mail: 'john@example.com' }
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await userRepository.findByMail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and save new user', async () => {
      const userData = {
        name: 'Jane Doe',
        userName: 'janedoe',
        mail: 'jane@example.com',
        password: 'hashedpassword',
      };

      const createdUser = { id: 2, ...userData };

      mockRepository.create.mockReturnValue(createdUser as User);
      mockRepository.save.mockResolvedValue(createdUser as User);

      const result = await userRepository.create(userData);

      expect(mockRepository.create).toHaveBeenCalledWith(userData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(createdUser);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const updateData = {
        name: 'John Updated',
        mail: 'johnupdated@example.com',
      };

      const updatedUser = {
        id: 1,
        name: 'John Updated',
        userName: 'johndoe',
        mail: 'johnupdated@example.com',
        password: 'hashedpassword',
      };

      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne.mockResolvedValue(updatedUser as User);

      const result = await userRepository.update(1, updateData);

      expect(mockRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['tasks']
      });
      expect(result).toEqual(updatedUser);
    });

    it('should return null if user not found', async () => {
      mockRepository.update.mockResolvedValue({ affected: 0 } as any);
      mockRepository.findOne.mockResolvedValue(null);

      const result = await userRepository.update(999, { name: 'New Name' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await userRepository.delete(1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });
  });
});