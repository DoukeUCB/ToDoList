import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/', CategoryController.list);
router.get('/:id', CategoryController.get);
router.post('/', CategoryController.create);
router.put('/:id', CategoryController.update);
router.delete('/:id', CategoryController.delete);

export { router as categoryRoutes };
