import { Router } from 'express';
import { CinemaController } from '../controllers/CinemaController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

const router = Router();
const cc = new CinemaController();

// Открытые
router.get('/', cc.getAll);
router.get('/:id', cc.getOne);
router.get('/:id/halls/:hallId/seats', cc.getHallSeats);

// Только для Админа
router.post('/', authMiddleware, adminMiddleware, cc.create);
router.put('/:id', authMiddleware, adminMiddleware, cc.update);
router.delete('/:id', authMiddleware, adminMiddleware, cc.remove);
router.post('/:id/halls', authMiddleware, adminMiddleware, cc.createHall);
router.delete('/halls/:hallId', authMiddleware, adminMiddleware, cc.removeHall);

export default router;
