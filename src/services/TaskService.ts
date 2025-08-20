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

  get(id: number) {
    return this.repository.findById(id);
  }

  create(data: { title: string; description?: string | null }) {
    return this.repository.create({ ...data, completed: false });
  }

  async update(id: number, updates: Partial<Task>) {
    return this.repository.update(id, updates);
  }

  async delete(id: number) {
    return this.repository.delete(id);
  }
}
