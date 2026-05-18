"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketService = void 0;
const data_source_1 = require("../database/data-source");
const Ticket_1 = require("../entities/Ticket");
const Session_1 = require("../entities/Session");
const Seat_1 = require("../entities/Seat");
const User_1 = require("../entities/User");
const PaymentService_1 = require("./PaymentService");
const RESERVATION_MINUTES = 10;
const paymentService = new PaymentService_1.PaymentService();
class TicketService {
    constructor() {
        this.ticketRepo = data_source_1.AppDataSource.getRepository(Ticket_1.Ticket);
        this.sessionRepo = data_source_1.AppDataSource.getRepository(Session_1.Session);
        this.seatRepo = data_source_1.AppDataSource.getRepository(Seat_1.Seat);
        this.userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
    }
    // ── Бронирование мест ──────────────────────────
    async reserveSeats(userId, sessionId, seatIds) {
        const session = await this.sessionRepo.findOne({
            where: { sessionId },
            relations: ['tickets', 'tickets.seat'],
        });
        if (!session)
            throw new Error('Сеанс не найден');
        await this.cleanExpiredReservations();
        const user = await this.userRepo.findOne({ where: { userId } });
        if (!user)
            throw new Error('Пользователь не найден');
        const savedTickets = [];
        const now = new Date();
        const expiresAt = new Date(now.getTime() + RESERVATION_MINUTES * 60 * 1000);
        for (const seatId of seatIds) {
            const isTaken = session.tickets.some(t => t.seat.seatId === seatId &&
                (t.status === 'paid' ||
                    (t.status === 'reserved' && new Date(t.expiresAt) > new Date())));
            if (isTaken)
                throw new Error('Одно или несколько мест уже заняты');
            const seat = await this.seatRepo.findOne({ where: { seatId } });
            if (!seat)
                throw new Error('Место не найдено');
            const ticket = this.ticketRepo.create({
                status: 'reserved',
                reservedAt: now,
                expiresAt,
                price: seat.seatType === 'vip' ? session.price * (session.vipMultiplier || 1.5) : session.price,
                session,
                seat,
                user,
            });
            const saved = await this.ticketRepo.save(ticket);
            savedTickets.push(saved);
        }
        return savedTickets.map(saved => ({
            ticketId: saved.ticketId,
            status: saved.status,
            price: saved.price,
            expiresAt: saved.expiresAt,
            seat: saved.seat,
        }));
    }
    // ── Шаг 1: создать платёж в ЮKassa ─────────────
    async initiatePaymentMultiple(ticketIds, userId) {
        if (!ticketIds.length)
            throw new Error('Нет билетов для оплаты');
        let totalAmount = 0;
        const ticketsToPay = [];
        for (const ticketId of ticketIds) {
            const ticket = await this.ticketRepo.findOne({
                where: { ticketId, user: { userId } },
                relations: ['session', 'seat'],
            });
            if (!ticket)
                throw new Error(`Билет ${ticketId} не найден`);
            if (ticket.status === 'paid')
                throw new Error(`Билет ${ticketId} уже оплачен`);
            if (ticket.status !== 'reserved')
                throw new Error(`Бронь ${ticketId} истекла или отменена`);
            if (new Date(ticket.expiresAt) < new Date()) {
                ticket.status = 'expired';
                await this.ticketRepo.save(ticket);
                throw new Error(`Время бронирования билета ${ticketId} истекло.`);
            }
            totalAmount += ticket.price;
            ticketsToPay.push(ticket);
        }
        const returnUrl = `${process.env.FRONTEND_URL}/payment/${ticketIds.join(',')}?status=return`;
        const { paymentId, confirmationUrl } = await paymentService.createPayment(ticketIds[0], // Используем первый ID как идентификатор для ЮKassa
        totalAmount, returnUrl);
        // Сохраняем paymentId во всех билетах заказа
        for (const ticket of ticketsToPay) {
            ticket.paymentId = paymentId;
            await this.ticketRepo.save(ticket);
        }
        return { confirmationUrl };
    }
    // ── Шаг 2: проверить статус после редиректа ─────
    async confirmPaymentMultiple(ticketIds, userId) {
        if (!ticketIds.length)
            throw new Error('Нет билетов');
        const tickets = [];
        let paymentIdToCheck = null;
        for (const ticketId of ticketIds) {
            const ticket = await this.ticketRepo.findOne({
                where: { ticketId, user: { userId } },
                relations: ['session', 'session.movie', 'session.hall', 'session.hall.cinema', 'seat'],
            });
            if (!ticket)
                throw new Error(`Билет ${ticketId} не найден`);
            tickets.push(ticket);
            if (ticket.paymentId)
                paymentIdToCheck = ticket.paymentId;
        }
        const allPaid = tickets.every(t => t.status === 'paid');
        if (allPaid)
            return { status: 'paid', tickets };
        if (!paymentIdToCheck)
            throw new Error('Платёж не был инициирован');
        const { status } = await paymentService.getPaymentStatus(paymentIdToCheck);
        if (status === 'succeeded') {
            const now = new Date();
            for (const ticket of tickets) {
                ticket.status = 'paid';
                ticket.purchaseTime = now;
                await this.ticketRepo.save(ticket);
            }
            return { status: 'paid', tickets };
        }
        if (status === 'canceled') {
            for (const ticket of tickets) {
                ticket.status = 'expired';
                await this.ticketRepo.save(ticket);
            }
            return { status: 'canceled' };
        }
        return { status: 'pending' };
    }
    // ── Статус бронирования ─────────────────────────
    async getTicketStatus(ticketId, userId) {
        const ticket = await this.ticketRepo.findOne({
            where: { ticketId, user: { userId } },
            relations: ['session', 'session.movie', 'session.hall', 'session.hall.cinema', 'seat'],
        });
        if (!ticket)
            throw new Error('Билет не найден');
        if (ticket.status === 'reserved' && new Date(ticket.expiresAt) < new Date()) {
            ticket.status = 'expired';
            await this.ticketRepo.save(ticket);
        }
        return ticket;
    }
    // ── Билеты пользователя (только paid) ──────────
    async getUserTickets(userId) {
        return await this.ticketRepo.find({
            where: { user: { userId }, status: 'paid' },
            relations: ['session', 'session.movie', 'session.hall', 'session.hall.cinema', 'seat'],
        });
    }
    // ── Отмена билета / брони ───────────────────────
    async cancelTicket(ticketId, userId) {
        const ticket = await this.ticketRepo.findOne({
            where: { ticketId, user: { userId } },
        });
        if (!ticket)
            throw new Error('Билет не найден');
        if (ticket.status === 'reserved') {
            await this.ticketRepo.remove(ticket);
        }
        else if (ticket.status === 'paid') {
            ticket.status = 'cancelled';
            await this.ticketRepo.save(ticket);
        }
        else {
            throw new Error('Невозможно отменить билет с этим статусом');
        }
    }
    // ── Очистка просроченных броней ─────────────────
    async cleanExpiredReservations() {
        const expired = await this.ticketRepo
            .createQueryBuilder('t')
            .where('t.status = :status', { status: 'reserved' })
            .andWhere('t.expiresAt < :now', { now: new Date() })
            .getMany();
        for (const ticket of expired) {
            ticket.status = 'expired';
            await this.ticketRepo.save(ticket);
        }
        return expired.length;
    }
    // ── Статистика (админка) ────────────────────────
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
exports.TicketService = TicketService;
//# sourceMappingURL=TicketService.js.map