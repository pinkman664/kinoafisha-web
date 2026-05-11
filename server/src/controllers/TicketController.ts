import { Request, Response } from 'express';
import { TicketService } from '../services/TicketService';
import { AuthRequest } from '../middlewares/authMiddleware';

const ticketService = new TicketService();

export class TicketController {
  // Забронировать место (создаёт ticket со статусом reserved, 6 минут на оплату)
  async reserve(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { sessionId, seatId } = req.body;
      if (!sessionId || !seatId) return res.status(400).json({ message: 'sessionId и seatId обязательны' });
      const result = await ticketService.reserveSeat(userId, sessionId, seatId);
      res.status(201).json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  // Оплатить забронированный билет
  async pay(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const ticketId = Number(req.params.id);
      const { cardNumber, expiry, cvv } = req.body;
      if (!cardNumber || !expiry || !cvv) {
        return res.status(400).json({ message: 'Заполните все поля карты' });
      }
      const result = await ticketService.payTicket(ticketId, userId, {
        cardNumber,
        expiry,
        cvv,
        amount: 0, // будет перезаписано в сервисе из цены билета
      });
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  // Получить статус брони / билета
  async getStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const ticketId = Number(req.params.id);
      const ticket = await ticketService.getTicketStatus(ticketId, userId);
      res.json(ticket);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  // История билетов текущего пользователя (только оплаченные)
  async myTickets(req: AuthRequest, res: Response) {
    try {
      res.json(await ticketService.getUserTickets(req.user!.userId));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  }

  // Отменить билет / бронь
  async cancel(req: AuthRequest, res: Response) {
    try {
      await ticketService.cancelTicket(Number(req.params.id), req.user!.userId);
      res.json({ message: 'Билет отменён' });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  // Статистика продаж (только для Администратора)
  async getStats(req: AuthRequest, res: Response) {
    try {
      res.json(await ticketService.getStatistics());
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  }
}
