import { CategoryRepository } from '../repositories/CategoryRepository';
import { Category } from '../models/Category';

export class CategoryService {
  private repo = new CategoryRepository();

  async listByUser(userId: number): Promise<Category[]> {
    return this.repo.findByUserId(userId);
  }

  async get(id: number): Promise<Category | null> {
    return this.repo.findById(id);
  }

  async create(data: { name: string; color?: string; userId: number }): Promise<Category> {
    const categoryData = {
      name: data.name,
      color: data.color || '#007bff',
      userId: data.userId,
      isDefault: false
    };

    return this.repo.create(categoryData);
  }

  async update(id: number, data: { name?: string; color?: string }): Promise<Category | null> {
    return this.repo.update(id, data);
  }

  async delete(id: number): Promise<void> {
    // Verificar que no sea una categoría por defecto
    const category = await this.repo.findById(id);
    if (category?.isDefault) {
      throw new Error('No se pueden eliminar las categorías por defecto');
    }

    return this.repo.delete(id);
  }

  async getDefaultCategories(): Promise<Category[]> {
    return this.repo.findDefaultCategories();
  }

  async getUserCategories(userId: number): Promise<Category[]> {
    return this.repo.findUserCategories(userId);
  }

  async createDefaultCategories(): Promise<void> {
    const defaultCategories = [
      { name: 'Casa', color: '#4a8257ff', isDefault: true, userId: null },
      { name: 'Universidad', color: '#007bff', isDefault: true, userId: null },
      { name: 'Trabajo', color: '#d6912fff', isDefault: true, userId: null }
    ];

    // Verificar si ya existen las categorías por defecto
    const existing = await this.repo.findDefaultCategories();
    if (existing.length === 0) {
      for (const categoryData of defaultCategories) {
        await this.repo.create(categoryData);
      }
    }
  }
}
