import { CategoryService } from '../../src/services/CategoryService';
import { CategoryRepository } from '../../src/repositories/CategoryRepository';
import { Category } from '../../src/models/Category';

// Mock the CategoryRepository
jest.mock('../../src/repositories/CategoryRepository');

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let mockCategoryRepository: jest.Mocked<CategoryRepository>;

  beforeEach(() => {
    mockCategoryRepository = new CategoryRepository() as jest.Mocked<CategoryRepository>;
    categoryService = new CategoryService();
    
    // Override the private repository with our mock
    (categoryService as any).repo = mockCategoryRepository;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listByUser', () => {
    it('should return categories for a user', async () => {
      const userId = 1;
      const mockCategories: Category[] = [
        {
          id: 1,
          name: 'Casa',
          color: '#4a8257ff',
          isDefault: true,
          userId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Personal',
          color: '#007bff',
          isDefault: false,
          userId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCategoryRepository.findByUserId.mockResolvedValue(mockCategories);

      const result = await categoryService.listByUser(userId);

      expect(result).toEqual(mockCategories);
      expect(mockCategoryRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('get', () => {
    it('should return category by id', async () => {
      const categoryId = 1;
      const mockCategory: Category = {
        id: categoryId,
        name: 'Casa',
        color: '#4a8257ff',
        isDefault: true,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCategoryRepository.findById.mockResolvedValue(mockCategory);

      const result = await categoryService.get(categoryId);

      expect(result).toEqual(mockCategory);
      expect(mockCategoryRepository.findById).toHaveBeenCalledWith(categoryId);
    });

    it('should return null if category not found', async () => {
      const categoryId = 999;
      mockCategoryRepository.findById.mockResolvedValue(null);

      const result = await categoryService.get(categoryId);

      expect(result).toBeNull();
      expect(mockCategoryRepository.findById).toHaveBeenCalledWith(categoryId);
    });
  });

  describe('create', () => {
    it('should create a new category with default color', async () => {
      const userId = 1;
      const categoryData = {
        name: 'Nueva Categoría',
        userId: userId,
      };

      const expectedCategoryData = {
        name: 'Nueva Categoría',
        color: '#007bff',
        userId: userId,
        isDefault: false,
      };

      const mockCreatedCategory: Category = {
        id: 1,
        ...expectedCategoryData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCategoryRepository.create.mockResolvedValue(mockCreatedCategory);

      const result = await categoryService.create(categoryData);

      expect(result).toEqual(mockCreatedCategory);
      expect(mockCategoryRepository.create).toHaveBeenCalledWith(expectedCategoryData);
    });

    it('should create a new category with custom color', async () => {
      const userId = 1;
      const categoryData = {
        name: 'Nueva Categoría',
        color: '#ff0000',
        userId: userId,
      };

      const expectedCategoryData = {
        name: 'Nueva Categoría',
        color: '#ff0000',
        userId: userId,
        isDefault: false,
      };

      const mockCreatedCategory: Category = {
        id: 1,
        ...expectedCategoryData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCategoryRepository.create.mockResolvedValue(mockCreatedCategory);

      const result = await categoryService.create(categoryData);

      expect(result).toEqual(mockCreatedCategory);
      expect(mockCategoryRepository.create).toHaveBeenCalledWith(expectedCategoryData);
    });
  });

  describe('update', () => {
    it('should update category successfully', async () => {
      const categoryId = 1;
      const updateData = {
        name: 'Categoría Actualizada',
        color: '#ff0000',
      };

      const mockUpdatedCategory: Category = {
        id: categoryId,
        name: updateData.name,
        color: updateData.color,
        isDefault: false,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCategoryRepository.update.mockResolvedValue(mockUpdatedCategory);

      const result = await categoryService.update(categoryId, updateData);

      expect(result).toEqual(mockUpdatedCategory);
      expect(mockCategoryRepository.update).toHaveBeenCalledWith(categoryId, updateData);
    });

    it('should return null if category not found', async () => {
      const categoryId = 999;
      const updateData = {
        name: 'Categoría Actualizada',
      };

      mockCategoryRepository.update.mockResolvedValue(null);

      const result = await categoryService.update(categoryId, updateData);

      expect(result).toBeNull();
      expect(mockCategoryRepository.update).toHaveBeenCalledWith(categoryId, updateData);
    });
  });

  describe('delete', () => {
    it('should delete non-default category successfully', async () => {
      const categoryId = 1;
      const mockCategory: Category = {
        id: categoryId,
        name: 'Categoría Personal',
        color: '#007bff',
        isDefault: false,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCategoryRepository.findById.mockResolvedValue(mockCategory);
      mockCategoryRepository.delete.mockResolvedValue();

      await categoryService.delete(categoryId);

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith(categoryId);
      expect(mockCategoryRepository.delete).toHaveBeenCalledWith(categoryId);
    });

    it('should throw error when trying to delete default category', async () => {
      const categoryId = 1;
      const mockDefaultCategory: Category = {
        id: categoryId,
        name: 'Casa',
        color: '#4a8257ff',
        isDefault: true,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCategoryRepository.findById.mockResolvedValue(mockDefaultCategory);

      await expect(categoryService.delete(categoryId)).rejects.toThrow(
        'No se pueden eliminar las categorías por defecto'
      );

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith(categoryId);
      expect(mockCategoryRepository.delete).not.toHaveBeenCalled();
    });

    it('should handle category not found', async () => {
      const categoryId = 999;
      mockCategoryRepository.findById.mockResolvedValue(null);
      mockCategoryRepository.delete.mockResolvedValue();

      await categoryService.delete(categoryId);

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith(categoryId);
      expect(mockCategoryRepository.delete).toHaveBeenCalledWith(categoryId);
    });
  });

  describe('getDefaultCategories', () => {
    it('should return default categories', async () => {
      const mockDefaultCategories: Category[] = [
        {
          id: 1,
          name: 'Casa',
          color: '#4a8257ff',
          isDefault: true,
          userId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Universidad',
          color: '#007bff',
          isDefault: true,
          userId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCategoryRepository.findDefaultCategories.mockResolvedValue(mockDefaultCategories);

      const result = await categoryService.getDefaultCategories();

      expect(result).toEqual(mockDefaultCategories);
      expect(mockCategoryRepository.findDefaultCategories).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserCategories', () => {
    it('should return user categories', async () => {
      const userId = 1;
      const mockUserCategories: Category[] = [
        {
          id: 3,
          name: 'Personal',
          color: '#ff0000',
          isDefault: false,
          userId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCategoryRepository.findUserCategories.mockResolvedValue(mockUserCategories);

      const result = await categoryService.getUserCategories(userId);

      expect(result).toEqual(mockUserCategories);
      expect(mockCategoryRepository.findUserCategories).toHaveBeenCalledWith(userId);
    });
  });

  describe('createDefaultCategories', () => {
    it('should create default categories when none exist', async () => {
      mockCategoryRepository.findDefaultCategories.mockResolvedValue([]);
      mockCategoryRepository.create.mockResolvedValue({} as Category);

      await categoryService.createDefaultCategories();

      expect(mockCategoryRepository.findDefaultCategories).toHaveBeenCalledTimes(1);
      expect(mockCategoryRepository.create).toHaveBeenCalledTimes(3);
      
      // Check that the correct default categories are created
      expect(mockCategoryRepository.create).toHaveBeenCalledWith({
        name: 'Casa',
        color: '#4a8257ff',
        isDefault: true,
        userId: null,
      });
      expect(mockCategoryRepository.create).toHaveBeenCalledWith({
        name: 'Universidad',
        color: '#007bff',
        isDefault: true,
        userId: null,
      });
      expect(mockCategoryRepository.create).toHaveBeenCalledWith({
        name: 'Trabajo',
        color: '#d6912fff',
        isDefault: true,
        userId: null,
      });
    });

    it('should not create default categories when they already exist', async () => {
      const existingCategories: Category[] = [
        {
          id: 1,
          name: 'Casa',
          color: '#4a8257ff',
          isDefault: true,
          userId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCategoryRepository.findDefaultCategories.mockResolvedValue(existingCategories);

      await categoryService.createDefaultCategories();

      expect(mockCategoryRepository.findDefaultCategories).toHaveBeenCalledTimes(1);
      expect(mockCategoryRepository.create).not.toHaveBeenCalled();
    });
  });
});