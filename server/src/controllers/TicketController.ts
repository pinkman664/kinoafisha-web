import { Request, Response } from 'express';
import { TicketService } from '../services/TicketService';
import { AuthRequest } from '../middlewares/authMiddleware';

const ticketService = new TicketService();

export class TicketController {
  async reserve(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { sessionId, seatIds } = req.body;
      if (!sessionId || !seatIds || !Array.isArray(seatIds))
        return res.status(400).json({ message: 'sessionId и массив seatIds обязательны' });
      const result = await ticketService.reserveSeats(userId, sessionId, seatIds);
      res.status(201).json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  // Инициировать оплату → вернуть ссылку на ЮKassa
  async initiate(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const ticketIds = req.body.ticketIds;
      if (!ticketIds || !Array.isArray(ticketIds)) return res.status(400).json({ message: 'ticketIds array required' });
      const result = await ticketService.initiatePaymentMultiple(ticketIds, userId);
      res.json(result); // { confirmationUrl }
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  // Проверить статус после редиректа с ЮKassa
  async confirm(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const ticketIds = req.body.ticketIds;
      if (!ticketIds || !Array.isArray(ticketIds)) return res.status(400).json({ message: 'ticketIds array required' });
      const result = await ticketService.confirmPaymentMultiple(ticketIds, userId);
      res.json(result); // { status: 'paid' | 'pending' | 'canceled', ticket? }
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async getStatus(req: AuthRequest, res: Response) {
    try {
      const ticket = await ticketService.getTicketStatus(
        Number(req.params.id),
        req.user!.userId
      );
      res.json(ticket);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async myTickets(req: AuthRequest, res: Response) {
    try {
      res.json(await ticketService.getUserTickets(req.user!.userId));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  }

  async cancel(req: AuthRequest, res: Response) {
    try {
      await ticketService.cancelTicket(Number(req.params.id), req.user!.userId);
      res.json({ message: 'Билет отменён' });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async getStats(req: AuthRequest, res: Response) {
    try {
      res.json(await ticketService.getStatistics());
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  }
}