"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CinemaController = void 0;
const CinemaService_1 = require("../services/CinemaService");
const cinemaService = new CinemaService_1.CinemaService();
/**
 * Контроллер для управления кинотеатрами и залами.
 */
class CinemaController {
    /**
     * Получить список всех кинотеатров с их залами.
     */
    async getAll(req, res) {
        try {
            res.json(await cinemaService.getAllCinemas());
        }
        catch (e) {
            res.status(500).json({ message: e.message });
        }
    }
    async getOne(req, res) {
        try {
            res.json(await cinemaService.getCinemaById(Number(req.params.id)));
        }
        catch (e) {
            res.status(404).json({ message: e.message });
        }
    }
    /**
     * Добавление нового кинотеатра (Админ).
     */
    async create(req, res) {
        try {
            res.status(201).json(await cinemaService.createCinema(req.body));
        }
        catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
    async update(req, res) {
        try {
            res.json(await cinemaService.updateCinema(Number(req.params.id), req.body));
        }
        catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
    /**
     * Удаление кинотеатра.
     */
    async remove(req, res) {
        try {
            await cinemaService.deleteCinema(Number(req.params.id));
            res.json({ message: 'Кинотеатр удалён' });
        }
        catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
    /**
     * Добавление нового зала в кинотеатр (Админ).
     */
    async createHall(req, res) {
        try {
            const hall = await cinemaService.createHall(Number(req.params.id), req.body);
            res.status(201).json(hall);
        }
        catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
    async getHallSeats(req, res) {
        try {
            res.json(await cinemaService.getHallSeats(Number(req.params.hallId)));
        }
        catch (e) {
            res.status(500).json({ message: e.message });
        }
    }
    async removeHall(req, res) {
        try {
            await cinemaService.deleteHall(Number(req.params.hallId));
            res.json({ message: 'Зал удалён' });
        }
        catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
}
exports.CinemaController = CinemaController;
//# sourceMappingURL=CinemaController.js.map