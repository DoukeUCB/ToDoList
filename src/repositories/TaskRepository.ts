import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { Task } from '../models/Task';

export class TaskRepository {
  private repo: Repository<Task>;

  constructor() {
    this.repo = AppDataSource.getRepository(Task);
  }

  findAll() {
    return this.repo.find();
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(taskData: Partial<Task>) {
    const task = this.repo.create(taskData);
    return this.repo.save(task);
  }

  async update(id: number, updates: Partial<Task>) {
    await this.repo.update(id, updates);
    return this.findById(id);
  }

  async delete(id: number) {
    await this.repo.delete(id);
  }
}
