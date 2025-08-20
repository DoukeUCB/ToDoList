import { AppDataSource } from './data-source';
import { Task } from '../models/Task';

(async () => {
  try {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
    await AppDataSource.synchronize();
    const repo = AppDataSource.getRepository(Task);
    const count = await repo.count();
    console.log(`DB sync OK. Tasks count: ${count}`);
    process.exit(0);
  } catch (err) {
    console.error('DB sync error', err);
    process.exit(1);
  }
})();
