import { Task } from '../models/Task';
import { TaskRepository } from '../repositories/TaskRepository';

export class TaskService {
  private repository: TaskRepository;

  constructor(repository = new TaskRepository()) {
    this.repository = repository;
  }

  list(): Promise<Task[]> {
    return this.repository.findAll();
  }

  listByUser(userId: number): Promise<Task[]> {
    return this.repository.findByUserId(userId);
  }

  get(id: number) {
    return this.repository.findById(id);
  }

  create(data: { title: string; description?: string | null; userId?: number }) {
    return this.repository.create({ ...data, completed: false });
  }

  async update(id: number, updates: Partial<Task>) {
    return this.repository.update(id, updates);
  }

  async delete(id: number) {
    return this.repository.delete(id);
  }
}
