import { AppDataSource } from './data-source';
import { Task } from '../models/Task';
import { User } from '../models/User';

(async () => {
  try {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
    await AppDataSource.synchronize();
    
    const taskRepo = AppDataSource.getRepository(Task);
    const userRepo = AppDataSource.getRepository(User);
    
    const taskCount = await taskRepo.count();
    const userCount = await userRepo.count();
    
    console.log(`DB sync OK. Users count: ${userCount}, Tasks count: ${taskCount}`);
    process.exit(0);
  } catch (err) {
    console.error('DB sync error', err);
    process.exit(1);
  }
})();
