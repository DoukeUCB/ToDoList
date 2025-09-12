import { DataSource } from 'typeorm';
import { User } from '../src/models/User';
import { Task } from '../src/models/Task';
import { Category } from '../src/models/Category';

export const testDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  logging: false,
  entities: [User, Task, Category],
});

beforeAll(async () => {
  await testDataSource.initialize();
});

afterAll(async () => {
  await testDataSource.destroy();
});