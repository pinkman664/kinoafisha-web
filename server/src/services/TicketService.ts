import { AppDataSource } from '../database/data-source';
import { Ticket } from '../entities/Ticket';
import { Session } from '../entities/Session';
import { Seat } from '../entities/Seat';
import { User } from '../entities/User';
import { PaymentService, PaymentData } from './PaymentService';
import { LessThan } from 'typeorm';

const RESERVATION_MINUTES = 6;
const paymentService = new PaymentService();

// Работа с билетами, бронированием и оплатой
export class TicketService {
  private ticketRepo = AppDataSource.getRepository(Ticket);
  private sessionRepo = AppDataSource.getRepository(Session);
  private seatRepo = AppDataSource.getRepository(Seat);
  private userRepo = AppDataSource.getRepository(User);

  // ────────────────────────────────────────────────
  //  Бронирование места (вместо мгновенной покупки)
  // ────────────────────────────────────────────────
  async reserveSeat(userId: number, sessionId: number, seatId: number) {
    const session = await this.sessionRepo.findOne({
      where: { sessionId },
      relations: ['tickets', 'tickets.seat'],
    });
    if (!session) throw new Error('Сеанс не найден');

    // Ленивая очистка: убираем просроченные брони ДО проверки
    await this.cleanExpiredReservations();

    // Проверка: место занято, если есть ticket со статусом reserved (не просрочен) или paid
    const isTaken = session.tickets.some(
      t =>
        t.seat.seatId === seatId &&
        (t.status === 'paid' ||
          (t.status === 'reserved' && new Date(t.expiresAt) > new Date()))
    );
    if (isTaken) throw new Error('Место уже занято или забронировано');

    const seat = await this.seatRepo.findOne({ where: { seatId } });
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!seat || !user) throw new Error('Ошибка данных');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + RESERVATION_MINUTES * 60 * 1000);

    const ticket = this.ticketRepo.create({
      status: 'reserved',
      reservedAt: now,
      expiresAt,
      price: session.price,
      session,
      seat,
      user,
    });

    const saved = await this.ticketRepo.save(ticket);

    return {
      ticketId: saved.ticketId,
      status: saved.status,
      price: saved.price,
      expiresAt: saved.expiresAt,
      seat: { rowNumber: seat.rowNumber, seatNumber: seat.seatNumber, seatType: seat.seatType },
    };
  }

  // ────────────────────────────────────────────────
  //  Оплата забронированного билета
  // ────────────────────────────────────────────────
  async payTicket(ticketId: number, userId: number, paymentData: PaymentData) {
    const ticket = await this.ticketRepo.findOne({
      where: { ticketId, user: { userId } },
      relations: ['session', 'session.movie', 'session.hall', 'session.hall.cinema', 'seat'],
    });
    if (!ticket) throw new Error('Билет не найден');
    if (ticket.status === 'paid') throw new Error('Билет уже оплачен');
    if (ticket.status !== 'reserved') throw new Error('Бронь истекла или отменена');

    // Проверяем не просрочена ли бронь
    if (new Date(ticket.expiresAt) < new Date()) {
      ticket.status = 'expired';
      await this.ticketRepo.save(ticket);
      throw new Error('Время бронирования истекло. Забронируйте место заново.');
    }

    // Вызываем платёжный сервис
    const result = await paymentService.processPayment({
      ...paymentData,
      amount: ticket.price,
    });

    if (!result.success) {
      throw new Error(result.message);
    }

    // Оплата прошла — обновляем билет
    ticket.status = 'paid';
    ticket.paymentId = result.transactionId;
    ticket.purchaseTime = new Date();
    await this.ticketRepo.save(ticket);

    return {
      ticketId: ticket.ticketId,
      status: 'paid',
      transactionId: result.transactionId,
      message: result.message,
      ticket,
    };
  }

  // ────────────────────────────────────────────────
  //  Получить статус бронирования
  // ────────────────────────────────────────────────
  async getTicketStatus(ticketId: number, userId: number) {
    const ticket = await this.ticketRepo.findOne({
      where: { ticketId, user: { userId } },
      relations: ['session', 'session.movie', 'session.hall', 'session.hall.cinema', 'seat'],
    });
    if (!ticket) throw new Error('Билет не найден');

    // Если бронь просрочена — обновляем статус
    if (ticket.status === 'reserved' && new Date(ticket.expiresAt) < new Date()) {
      ticket.status = 'expired';
      await this.ticketRepo.save(ticket);
    }

    return ticket;
  }

  // ────────────────────────────────────────────────
  //  Билеты пользователя (только paid)
  // ────────────────────────────────────────────────
  async getUserTickets(userId: number) {
    return await this.ticketRepo.find({
      where: { user: { userId }, status: 'paid' },
      relations: ['session', 'session.movie', 'session.hall', 'session.hall.cinema', 'seat'],
    });
  }

  // ────────────────────────────────────────────────
  //  Отмена билета / брони
  // ────────────────────────────────────────────────
  async cancelTicket(ticketId: number, userId: number) {
    const ticket = await this.ticketRepo.findOne({
      where: { ticketId, user: { userId } },
    });
    if (!ticket) throw new Error('Билет не найден');

    if (ticket.status === 'reserved') {
      // Бронь — просто удаляем
      await this.ticketRepo.remove(ticket);
    } else if (ticket.status === 'paid') {
      // Оплаченный — помечаем как отменённый
      ticket.status = 'cancelled';
      await this.ticketRepo.save(ticket);
    } else {
      throw new Error('Невозможно отменить билет с этим статусом');
    }
  }

  // ────────────────────────────────────────────────
  //  Ленивая + фоновая очистка просроченных броней
  // ────────────────────────────────────────────────
  async cleanExpiredReservations() {
    const now = new Date();
    const expired = await this.ticketRepo
      .createQueryBuilder('t')
      .where('t.status = :status', { status: 'reserved' })
      .andWhere('t.expiresAt < :now', { now })
      .getMany();

    for (const ticket of expired) {
      ticket.status = 'expired';
      await this.ticketRepo.save(ticket);
    }

    return expired.length;
  }

  // ────────────────────────────────────────────────
  //  Статистика (админка)
  // ────────────────────────────────────────────────
  async getStatistics() {
    const totals = await this.ticketRepo
      .createQueryBuilder('t')
      .where('t.status = :status', { status: 'paid' })
      .select('COUNT(t.ticketId)', 'totalTickets')
      .addSelect('SUM(t.price)', 'totalRevenue')
      .getRawOne();

    const topMovies = await this.ticketRepo
      .createQueryBuilder('t')
      .leftJoin('t.session', 's')
      .leftJoin('s.movie', 'm')
      .where('t.status = :status', { status: 'paid' })
      .select('m.title', 'title')
      .addSelect('COUNT(t.ticketId)', 'ticketCount')
      .addSelect('SUM(t.price)', 'revenue')
      .groupBy('m.title')
      .orderBy('SUM(t.price)', 'DESC')
      .getRawMany();

    return {
      totalTickets: Number(totals.totalTickets),
      totalRevenue: Number(totals.totalRevenue),
      topMovies,
    };
  }
}
