import { AppDataSource } from './data-source';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { CategoryService } from '../services/CategoryService';

(async () => {
  try {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
    await AppDataSource.synchronize();
    
    const taskRepo = AppDataSource.getRepository(Task);
    const userRepo = AppDataSource.getRepository(User);
    const categoryRepo = AppDataSource.getRepository(Category);
    
    // Crear categorías por defecto si no existen
    const categoryService = new CategoryService();
    await categoryService.createDefaultCategories();
    
    const taskCount = await taskRepo.count();
    const userCount = await userRepo.count();
    const categoryCount = await categoryRepo.count();
    
    console.log(`DB sync OK. Users: ${userCount}, Tasks: ${taskCount}, Categories: ${categoryCount}`);
    process.exit(0);
  } catch (err) {
    console.error('DB sync error', err);
    process.exit(1);
  }
})();
