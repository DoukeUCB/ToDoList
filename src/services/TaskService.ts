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
  create(data: { title: string; description?: string | null;
     startDate?: Date | null; endDate?: Date | null; userId?: number }) {
    return this.repository.create({
      ...data, completed: false,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
    });
  }

  async update(id: number, updates: Partial<Task>) {
    const formattedUpdates: Partial<Task> = { ...updates };

    if (updates.startDate) {
      formattedUpdates.startDate = new Date(updates.startDate);
    }
    if (updates.endDate) {
      formattedUpdates.endDate = new Date(updates.endDate);
    }

    return this.repository.update(id, formattedUpdates);
  }

  async delete(id: number) {
    return this.repository.delete(id);
  }
}
