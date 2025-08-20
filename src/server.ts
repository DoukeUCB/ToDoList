import 'reflect-metadata';
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { AppDataSource } from './database/data-source';
import taskRoutes from './routes/taskRoutes';
import { notFound, errorHandler } from './middleware/errorHandler';

const app = express();
app.use(cors());
app.use(express.json());
const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir));

app.use('/api/tasks', taskRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'views', 'index.html'));
});

// health
app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

// middlewares finales
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

AppDataSource.initialize().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Data Source init error', err);
  process.exit(1);
});
