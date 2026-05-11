import { Router } from 'express';
import { SessionController } from '../controllers/SessionController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

const router = Router();
const sc = new SessionController();

// Открытые
router.get('/movie/:movieId', sc.getByMovie);
router.get('/:id', sc.getOne);

// Только для Админа
router.get('/', authMiddleware, adminMiddleware, sc.getAll);
router.post('/', authMiddleware, adminMiddleware, sc.create);
router.put('/:id', authMiddleware, adminMiddleware, sc.update);
router.delete('/:id', authMiddleware, adminMiddleware, sc.remove);

export default router;
