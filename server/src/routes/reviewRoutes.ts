import { Router } from 'express';
import { ReviewController } from '../controllers/ReviewController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const rc = new ReviewController();

// Комментарии
router.get('/movie/:movieId/comments', rc.getComments);
router.post('/movie/:movieId/comments', authMiddleware, rc.addComment);
router.delete('/comments/:commentId', authMiddleware, rc.deleteComment);

// Рейтинг
router.get('/movie/:movieId/rating', rc.getRating);
router.post('/movie/:movieId/rating', authMiddleware, rc.setRating);

export default router;
