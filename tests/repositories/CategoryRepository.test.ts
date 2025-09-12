import { Repository } from 'typeorm';
import { CategoryRepository } from '../../src/repositories/CategoryRepository';
import { Category } from '../../src/models/Category';
import { AppDataSource } from '../../src/database/data-source';

jest.mock('../../src/database/data-source');

describe('CategoryRepository', () => {
  let categoryRepository: CategoryRepository;
  let mockRepository: jest.Mocked<Repository<Category>>;

  beforeEach(() => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      findOneBy: jest.fn(),
      update: jest.fn(),
    } as any;

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
    categoryRepository = new CategoryRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should return categories for user including defaults', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Casa',
          color: '#4a8257ff',
          isDefault: true,
          userId: null,
        },
        {
          id: 2,
          name: 'Personal',
          color: '#007bff',
          isDefault: false,
          userId: 1,
        },
      ];

      mockRepository.find.mockResolvedValue(mockCategories as Category[]);

      const result = await categoryRepository.findByUserId(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: [{ isDefault: true }, { userId: 1 }],
        relations: ['user'],
        order: { isDefault: 'DESC', name: 'ASC' },
      });
      expect(result).toEqual(mockCategories);
    });
  });

  describe('findById', () => {
    it('should return category by id', async () => {
      const mockCategory = {
        id: 1,
        name: 'Casa',
        color: '#4a8257ff',
        isDefault: true,
        userId: null,
      };

      mockRepository.findOne.mockResolvedValue(mockCategory as Category);

      const result = await categoryRepository.findById(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ 
        where: { id: 1 },
        relations: ['user']
      });
      expect(result).toEqual(mockCategory);
    });

    it('should return null if category not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await categoryRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and save new category', async () => {
      const categoryData = {
        name: 'Nueva Categoría',
        color: '#ff0000',
        userId: 1,
      };

      const createdCategory = { id: 3, ...categoryData, isDefault: false };

      mockRepository.create.mockReturnValue(createdCategory as Category);
      mockRepository.save.mockResolvedValue(createdCategory as Category);

      const result = await categoryRepository.create(categoryData);

      expect(mockRepository.create).toHaveBeenCalledWith(categoryData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdCategory);
      expect(result).toEqual(createdCategory);
    });
  });

  describe('update', () => {
    it('should update category', async () => {
      const existingCategory = {
        id: 1,
        name: 'Categoría Original',
        color: '#ff0000',
        isDefault: false,
        userId: 1,
      };

      const updateData = {
        name: 'Categoría Actualizada',
        color: '#00ff00',
      };

      const updatedCategory = { ...existingCategory, ...updateData };

      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne.mockResolvedValue(updatedCategory as Category);

      const result = await categoryRepository.update(1, updateData);

      expect(mockRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ 
        where: { id: 1 },
        relations: ['user']
      });
      expect(result).toEqual(updatedCategory);
    });

    it('should return null if category not found', async () => {
      mockRepository.update.mockResolvedValue({ affected: 0 } as any);
      mockRepository.findOne.mockResolvedValue(null);

      const result = await categoryRepository.update(999, { name: 'New Name' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete category', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await categoryRepository.delete(1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Casa',
          color: '#4a8257ff',
          isDefault: true,
          userId: null,
        },
        {
          id: 2,
          name: 'Personal',
          color: '#007bff',
          isDefault: false,
          userId: 1,
        },
      ];

      mockRepository.find.mockResolvedValue(mockCategories as Category[]);

      const result = await categoryRepository.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['user'],
        order: { isDefault: 'DESC', name: 'ASC' }
      });
      expect(result).toEqual(mockCategories);
    });
  });

  describe('findDefaultCategories', () => {
    it('should return default categories', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Casa',
          color: '#4a8257ff',
          isDefault: true,
          userId: null,
        },
      ];

      mockRepository.find.mockResolvedValue(mockCategories as Category[]);

      const result = await categoryRepository.findDefaultCategories();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isDefault: true },
        order: { name: 'ASC' }
      });
      expect(result).toEqual(mockCategories);
    });
  });

  describe('findUserCategories', () => {
    it('should return user categories', async () => {
      const mockCategories = [
        {
          id: 2,
          name: 'Personal',
          color: '#007bff',
          isDefault: false,
          userId: 1,
        },
      ];

      mockRepository.find.mockResolvedValue(mockCategories as Category[]);

      const result = await categoryRepository.findUserCategories(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { name: 'ASC' }
      });
      expect(result).toEqual(mockCategories);
    });
  });
});