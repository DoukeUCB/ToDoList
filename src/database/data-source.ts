import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { Category } from '../models/Category';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DB_PATH || 'data/database.sqlite',
  entities: [Task, User, Category],
  synchronize: true,
  logging: false
});