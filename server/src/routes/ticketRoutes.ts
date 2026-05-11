import { Router } from 'express';
import { TicketController } from '../controllers/TicketController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

const router = Router();
const tc = new TicketController();

// Маршруты для авторизованных пользователей
router.post('/reserve', authMiddleware, tc.reserve);       // Забронировать место
router.post('/:id/pay', authMiddleware, tc.pay);           // Оплатить бронь
router.get('/:id/status', authMiddleware, tc.getStatus);   // Статус бронирования
router.get('/my', authMiddleware, tc.myTickets);            // Мои оплаченные билеты
router.delete('/:id', authMiddleware, tc.cancel);           // Отменить билет/бронь

// Статистика только для Администратора
router.get('/stats', authMiddleware, adminMiddleware, tc.getStats);

export default router;
