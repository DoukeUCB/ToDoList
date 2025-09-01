import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { User } from '../models/User';

export class UserRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  async findAll(): Promise<User[]> {
    return await this.repository.find({
      relations: ['tasks']
    });
  }

  async findById(id: number): Promise<User | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['tasks']
    });
  }

  async findByUserName(userName: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { userName }
    });
  }

  async findByMail(mail: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { mail }
    });
  }

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>): Promise<User> {
    const user = this.repository.create(userData);
    return await this.repository.save(user);
  }

  async update(id: number, userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>>): Promise<User | null> {
    const result = await this.repository.update(id, userData);
    if (result.affected === 0) {
      return null;
    }
    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }
}
