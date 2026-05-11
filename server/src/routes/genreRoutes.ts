import { Router } from 'express';
import { GenreController } from '../controllers/GenreController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

const router = Router();
const gc = new GenreController();

router.get('/', gc.getAll);                                          // Все могут видеть жанры
router.post('/', authMiddleware, adminMiddleware, gc.create);        // Только Администратор
router.put('/:id', authMiddleware, adminMiddleware, gc.update);      // Только Администратор
router.delete('/:id', authMiddleware, adminMiddleware, gc.remove);   // Только Администратор

export default router;
