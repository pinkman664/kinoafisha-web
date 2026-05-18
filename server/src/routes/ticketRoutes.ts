import { Router } from 'express';
import { TicketController } from '../controllers/TicketController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

const router = Router();
const tc = new TicketController();

router.post('/reserve', authMiddleware, tc.reserve);
router.post('/initiate-multiple', authMiddleware, tc.initiate);
router.post('/confirm-multiple', authMiddleware, tc.confirm);
router.get('/:id/status', authMiddleware, tc.getStatus);
router.get('/my', authMiddleware, tc.myTickets);
router.delete('/:id', authMiddleware, tc.cancel);
router.get('/stats', authMiddleware, adminMiddleware, tc.getStats);

export default router;