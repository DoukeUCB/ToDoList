import { CategoryService } from '../../src/services/CategoryService';
import { CategoryRepository } from '../../src/repositories/CategoryRepository';
import { Category } from '../../src/models/Category';

jest.mock('../../src/repositories/CategoryRepository');

const mockCategoryRepository = CategoryRepository as jest.MockedClass<typeof CategoryRepository>;

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let mockRepo: jest.Mocked<CategoryRepository>;

  beforeEach(() => {
    mockRepo = new mockCategoryRepository() as jest.Mocked<CategoryRepository>;
    categoryService = new CategoryService();
    (categoryService as any).repo = mockRepo;
    jest.clearAllMocks();
  });

  describe('listByUser', () => {
    it('should return categories by user id', async () => {
      const categories: Category[] = [{ id: 1, name: 'Work' } as Category];
      mockRepo.findByUserId.mockResolvedValue(categories);

      const result = await categoryService.listByUser(1);

      expect(mockRepo.findByUserId).toHaveBeenCalledWith(1);
      expect(result).toEqual(categories);
    });
  });

  describe('get', () => {
    it('should return category by id', async () => {
      const category: Category = { id: 1, name: 'Work' } as Category;
      mockRepo.findById.mockResolvedValue(category);

      const result = await categoryService.get(1);

      expect(mockRepo.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(category);
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const data = { name: 'New Category', color: '#ff0000', userId: 1 };
      const createdCategory: Category = { id: 1, ...data, isDefault: false } as Category;
      mockRepo.create.mockResolvedValue(createdCategory);

      const result = await categoryService.create(data);

      expect(mockRepo.create).toHaveBeenCalledWith({
        name: data.name,
        color: data.color,
        userId: data.userId,
        isDefault: false
      });
      expect(result).toEqual(createdCategory);
    });

    it('should use default color if not provided', async () => {
      const data = { name: 'New Category', userId: 1 };
      mockRepo.create.mockResolvedValue({} as Category);

      await categoryService.create(data);

      expect(mockRepo.create).toHaveBeenCalledWith({
        name: data.name,
        color: '#007bff',
        userId: data.userId,
        isDefault: false
      });
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const data = { name: 'Updated Name' };
      const updatedCategory: Category = { id: 1, name: 'Updated Name' } as Category;
      mockRepo.update.mockResolvedValue(updatedCategory);

      const result = await categoryService.update(1, data);

      expect(mockRepo.update).toHaveBeenCalledWith(1, data);
      expect(result).toEqual(updatedCategory);
    });
  });

  describe('delete', () => {
    it('should delete a category', async () => {
      const category: Category = { id: 1, isDefault: false } as Category;
      mockRepo.findById.mockResolvedValue(category);
      mockRepo.delete.mockResolvedValue(undefined);

      await categoryService.delete(1);

      expect(mockRepo.findById).toHaveBeenCalledWith(1);
      expect(mockRepo.delete).toHaveBeenCalledWith(1);
    });

    it('should throw error if trying to delete default category', async () => {
      const category: Category = { id: 1, isDefault: true } as Category;
      mockRepo.findById.mockResolvedValue(category);

      await expect(categoryService.delete(1)).rejects.toThrow('No se pueden eliminar las categorías por defecto');
    });
  });

  describe('getDefaultCategories', () => {
    it('should return default categories', async () => {
      const categories: Category[] = [{ id: 1, name: 'Casa', isDefault: true } as Category];
      mockRepo.findDefaultCategories.mockResolvedValue(categories);

      const result = await categoryService.getDefaultCategories();

      expect(mockRepo.findDefaultCategories).toHaveBeenCalled();
      expect(result).toEqual(categories);
    });
  });

  describe('getUserCategories', () => {
    it('should return user categories', async () => {
      const categories: Category[] = [{ id: 1, name: 'Personal' } as Category];
      mockRepo.findUserCategories.mockResolvedValue(categories);

      const result = await categoryService.getUserCategories(1);

      expect(mockRepo.findUserCategories).toHaveBeenCalledWith(1);
      expect(result).toEqual(categories);
    });
  });

  describe('createDefaultCategories', () => {
    it('should create default categories if none exist', async () => {
      mockRepo.findDefaultCategories.mockResolvedValue([]);
      mockRepo.create.mockResolvedValue({} as Category);

      await categoryService.createDefaultCategories();

      expect(mockRepo.findDefaultCategories).toHaveBeenCalled();
      expect(mockRepo.create).toHaveBeenCalledTimes(3);
    });

    it('should not create if default categories already exist', async () => {
      mockRepo.findDefaultCategories.mockResolvedValue([{} as Category]);

      await categoryService.createDefaultCategories();

      expect(mockRepo.findDefaultCategories).toHaveBeenCalled();
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });
});