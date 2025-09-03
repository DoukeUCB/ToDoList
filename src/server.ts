import 'reflect-metadata';
import express, { Request, Response } from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import { AppDataSource } from './database/data-source';
import taskRoutes from './routes/taskRoutes';
import userRoutes from './routes/userRoutes';
import { categoryRoutes } from './routes/categoryRoutes';
import { notFound, errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'douke017',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

app.use(express.json());
const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir));

// Rutas API
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'views', 'index.html'));
});

app.get('/views/login.html', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'views', 'login.html'));
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

AppDataSource.initialize().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Data Source init error', err);
  process.exit(1);
});
