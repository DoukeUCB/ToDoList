import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Task } from '../models/Task';
import { User } from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DB_PATH || 'data/database.sqlite',
  synchronize: false,
  entities: [Task, User],
  logging: false
});