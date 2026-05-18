"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CinemaService = void 0;
const data_source_1 = require("../database/data-source");
const Cinema_1 = require("../entities/Cinema");
const Hall_1 = require("../entities/Hall");
const Seat_1 = require("../entities/Seat");
/**
 * Сервис для управления кинотеатрами и кинозалами.
 */
class CinemaService {
    constructor() {
        this.cinemaRepo = data_source_1.AppDataSource.getRepository(Cinema_1.Cinema);
        this.hallRepo = data_source_1.AppDataSource.getRepository(Hall_1.Hall);
        this.seatRepo = data_source_1.AppDataSource.getRepository(Seat_1.Seat);
    }
    /**
     * Получение списка всех кинотеатров.
     */
    async getAllCinemas() {
        return await this.cinemaRepo.find({ relations: ['halls'] });
    }
    async getCinemaById(cinemaId) {
        const cinema = await this.cinemaRepo.findOne({
            where: { cinemaId },
            relations: ['halls', 'halls.seats'],
        });
        if (!cinema)
            throw new Error('Кинотеатр не найден');
        return cinema;
    }
    /**
     * Создание нового кинотеатра.
     */
    async createCinema(data) {
        const cinema = this.cinemaRepo.create(data);
        return await this.cinemaRepo.save(cinema);
    }
    async updateCinema(cinemaId, data) {
        const cinema = await this.getCinemaById(cinemaId);
        Object.assign(cinema, data);
        return await this.cinemaRepo.save(cinema);
    }
    /**
     * Удаление кинотеатра.
     */
    async deleteCinema(cinemaId) {
        const cinema = await this.getCinemaById(cinemaId);
        await this.cinemaRepo.remove(cinema);
    }
    // --- Halls ---
    async createHall(cinemaId, data) {
        const cinema = await this.getCinemaById(cinemaId);
        // Если переданы кастомные места, считаем вместимость по ним
        const capacity = data.seats ? data.seats.length : (data.rows * data.cols);
        const hall = this.hallRepo.create({
            hallName: data.hallName,
            capacity,
            cinema
        });
        const saved = await this.hallRepo.save(hall);
        const seatEntities = [];
        if (data.seats && data.seats.length > 0) {
            // Используем данные из конструктора
            for (const s of data.seats) {
                const seat = this.seatRepo.create({
                    hall: saved,
                    rowNumber: s.row,
                    seatNumber: s.col,
                    seatType: s.type || 'standard'
                });
                seatEntities.push(seat);
            }
        }
        else {
            // Стандартная генерация сетки (fallback)
            for (let r = 1; r <= data.rows; r++) {
                for (let c = 1; c <= data.cols; c++) {
                    const seat = this.seatRepo.create({
                        hall: saved,
                        rowNumber: r,
                        seatNumber: c,
                        seatType: r === data.rows ? 'vip' : 'standard'
                    });
                    seatEntities.push(seat);
                }
            }
        }
        await this.seatRepo.save(seatEntities);
        return saved;
    }
    async getHallSeats(hallId) {
        return await this.seatRepo.find({ where: { hall: { hallId } } });
    }
    async deleteHall(hallId) {
        const hall = await this.hallRepo.findOne({ where: { hallId } });
        if (!hall)
            throw new Error('Зал не найден');
        await this.hallRepo.remove(hall);
    }
}
exports.CinemaService = CinemaService;
//# sourceMappingURL=CinemaService.js.map