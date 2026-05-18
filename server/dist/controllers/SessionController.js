"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionController = void 0;
const SessionService_1 = require("../services/SessionService");
const sessionService = new SessionService_1.SessionService();
class SessionController {
    async getAll(req, res) {
        try {
            res.json(await sessionService.getAllSessions());
        }
        catch (e) {
            res.status(500).json({ message: e.message });
        }
    }
    async getByMovie(req, res) {
        try {
            res.json(await sessionService.getSessionsByMovie(Number(req.params.movieId)));
        }
        catch (e) {
            res.status(500).json({ message: e.message });
        }
    }
    async getOne(req, res) {
        try {
            res.json(await sessionService.getSessionWithAvailableSeats(Number(req.params.id)));
        }
        catch (e) {
            res.status(404).json({ message: e.message });
        }
    }
    async create(req, res) {
        try {
            res.status(201).json(await sessionService.createSession(req.body));
        }
        catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
    async update(req, res) {
        try {
            res.json(await sessionService.updateSession(Number(req.params.id), req.body));
        }
        catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
    async remove(req, res) {
        try {
            await sessionService.deleteSession(Number(req.params.id));
            res.json({ message: 'Сеанс удалён' });
        }
        catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
}
exports.SessionController = SessionController;
//# sourceMappingURL=SessionController.js.map