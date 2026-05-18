"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketController = void 0;
const TicketService_1 = require("../services/TicketService");
const ticketService = new TicketService_1.TicketService();
class TicketController {
    async reserve(req, res) {
        try {
            const userId = req.user.userId;
            const { sessionId, seatIds } = req.body;
            if (!sessionId || !seatIds || !Array.isArray(seatIds))
                return res.status(400).json({ message: 'sessionId и массив seatIds обязательны' });
            const result = await ticketService.reserveSeats(userId, sessionId, seatIds);
            res.status(201).json(result);
        }
        catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
    // Инициировать оплату → вернуть ссылку на ЮKassa
    async initiate(req, res) {
        try {
            const userId = req.user.userId;
            const ticketIds = req.body.ticketIds;
            if (!ticketIds || !Array.isArray(ticketIds))
                return res.status(400).json({ message: 'ticketIds array required' });
            const result = await ticketService.initiatePaymentMultiple(ticketIds, userId);
            res.json(result); // { confirmationUrl }
        }
        catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
    // Проверить статус после редиректа с ЮKassa
    async confirm(req, res) {
        try {
            const userId = req.user.userId;
            const ticketIds = req.body.ticketIds;
            if (!ticketIds || !Array.isArray(ticketIds))
                return res.status(400).json({ message: 'ticketIds array required' });
            const result = await ticketService.confirmPaymentMultiple(ticketIds, userId);
            res.json(result); // { status: 'paid' | 'pending' | 'canceled', ticket? }
        }
        catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
    async getStatus(req, res) {
        try {
            const ticket = await ticketService.getTicketStatus(Number(req.params.id), req.user.userId);
            res.json(ticket);
        }
        catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
    async myTickets(req, res) {
        try {
            res.json(await ticketService.getUserTickets(req.user.userId));
        }
        catch (e) {
            res.status(500).json({ message: e.message });
        }
    }
    async cancel(req, res) {
        try {
            await ticketService.cancelTicket(Number(req.params.id), req.user.userId);
            res.json({ message: 'Билет отменён' });
        }
        catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
    async getStats(req, res) {
        try {
            res.json(await ticketService.getStatistics());
        }
        catch (e) {
            res.status(500).json({ message: e.message });
        }
    }
}
exports.TicketController = TicketController;
//# sourceMappingURL=TicketController.js.map