import { AppDataSource } from '../database/data-source';
import { Category } from '../models/Category';

export class CategoryRepository {
  private repo = AppDataSource.getRepository(Category);

  async findAll(): Promise<Category[]> {
    return this.repo.find({
      relations: ['user'],
      order: { isDefault: 'DESC', name: 'ASC' }
    });
  }

  async findByUserId(userId: number): Promise<Category[]> {
    return this.repo.find({
      where: [
        { isDefault: true }, // Categorías por defecto
        { userId: userId }   // Categorías del usuario
      ],
      relations: ['user'],
      order: { isDefault: 'DESC', name: 'ASC' }
    });
  }

  async findById(id: number): Promise<Category | null> {
    return this.repo.findOne({ 
      where: { id },
      relations: ['user']
    });
  }

  async create(data: Partial<Category>): Promise<Category> {
    const category = this.repo.create(data);
    return this.repo.save(category);
  }

  async update(id: number, data: Partial<Category>): Promise<Category | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async findDefaultCategories(): Promise<Category[]> {
    return this.repo.find({
      where: { isDefault: true },
      order: { name: 'ASC' }
    });
  }

  async findUserCategories(userId: number): Promise<Category[]> {
    return this.repo.find({
      where: { userId: userId },
      order: { name: 'ASC' }
    });
  }
}
