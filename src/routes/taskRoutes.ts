import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Todas las rutas de tareas requieren autenticación
router.use(requireAuth);

router.get('/', TaskController.list);
router.get('/:id', TaskController.get);
router.post('/', TaskController.create);
router.put('/:id', TaskController.update);
router.delete('/:id', TaskController.delete);

export default router;
