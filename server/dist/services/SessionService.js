"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const data_source_1 = require("../database/data-source");
const Session_1 = require("../entities/Session");
const Movie_1 = require("../entities/Movie");
const Hall_1 = require("../entities/Hall");
const Ticket_1 = require("../entities/Ticket");
class SessionService {
    constructor() {
        this.sessionRepo = data_source_1.AppDataSource.getRepository(Session_1.Session);
        this.movieRepo = data_source_1.AppDataSource.getRepository(Movie_1.Movie);
        this.hallRepo = data_source_1.AppDataSource.getRepository(Hall_1.Hall);
        this.ticketRepo = data_source_1.AppDataSource.getRepository(Ticket_1.Ticket);
    }
    async getAllSessions() {
        return await this.sessionRepo.find({
            relations: ['movie', 'hall', 'hall.cinema'],
            order: { startTime: 'DESC' },
        });
    }
    async getSessionsByMovie(movieId) {
        return await this.sessionRepo.find({
            where: { movie: { movieId } },
            relations: ['hall', 'hall.cinema'],
            order: { startTime: 'ASC' },
        });
    }
    async getSessionById(sessionId) {
        const session = await this.sessionRepo.findOne({
            where: { sessionId },
            relations: ['movie', 'hall', 'hall.seats', 'tickets', 'tickets.seat'],
        });
        if (!session)
            throw new Error('Сеанс не найден');
        return session;
    }
    async getSessionWithAvailableSeats(sessionId) {
        const session = await this.getSessionById(sessionId);
        const now = new Date();
        const takenSeatIds = session.tickets
            .filter(t => t.status === 'paid' ||
            (t.status === 'reserved' && new Date(t.expiresAt) > now))
            .map(t => t.seat?.seatId);
        const allSeats = session.hall.seats;
        const available = allSeats.map(seat => ({
            ...seat,
            isTaken: takenSeatIds.includes(seat.seatId),
        }));
        return { session, seats: available };
    }
    // Парсит строку "YYYY-MM-DDTHH:mm" как локальное время (не UTC)
    parseLocalDate(dateStr) {
        const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
        const [datePart, timePart] = normalized.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);
        // Используем конструктор local time
        return new Date(year, month - 1, day, hours, minutes, 0);
    }
    async checkOverlap(hallId, newStartTime, newEndTime, excludeSessionId) {
        const existingSessions = await this.sessionRepo.find({
            where: { hall: { hallId } },
            relations: ['movie'],
        });
        for (const s of existingSessions) {
            if (excludeSessionId && s.sessionId === excludeSessionId)
                continue;
            const sStart = new Date(s.startTime);
            const sDurationMs = (s.movie.duration || 120) * 60 * 1000;
            const sEnd = s.endTime ? new Date(s.endTime) : new Date(sStart.getTime() + sDurationMs);
            if (newStartTime < sEnd && newEndTime > sStart) {
                throw new Error('Зал занят в это время (пересечение с другим сеансом)');
            }
        }
    }
    async createSession(data) {
        const movie = await this.movieRepo.findOne({ where: { movieId: data.movieId } });
        if (!movie)
            throw new Error('Фильм не найден');
        const hall = await this.hallRepo.findOne({ where: { hallId: data.hallId } });
        if (!hall)
            throw new Error('Зал не найден');
        const newStartTime = this.parseLocalDate(data.startTime);
        const newEndTime = data.endTime
            ? this.parseLocalDate(data.endTime)
            : new Date(newStartTime.getTime() + (movie.duration || 120) * 60000);
        await this.checkOverlap(Number(data.hallId), newStartTime, newEndTime);
        const session = new Session_1.Session();
        session.movie = movie;
        session.hall = hall;
        session.startTime = newStartTime;
        session.endTime = newEndTime;
        session.price = Number(data.price);
        session.vipMultiplier = data.vipMultiplier !== undefined ? Number(data.vipMultiplier) : 1.5;
        const saved = await this.sessionRepo.save(session);
        return saved;
    }
    async updateSession(sessionId, data) {
        const session = await this.getSessionById(sessionId);
        let newStartTime = new Date(session.startTime);
        let newEndTime = session.endTime
            ? new Date(session.endTime)
            : new Date(newStartTime.getTime() + (session.movie.duration || 120) * 60000);
        if (data.startTime) {
            newStartTime = this.parseLocalDate(data.startTime);
            newEndTime = data.endTime
                ? this.parseLocalDate(data.endTime)
                : new Date(newStartTime.getTime() + (session.movie.duration || 120) * 60000);
        }
        else if (data.endTime) {
            newEndTime = this.parseLocalDate(data.endTime);
        }
        if (data.startTime || data.endTime) {
            await this.checkOverlap(Number(session.hall.hallId), newStartTime, newEndTime, sessionId);
        }
        if (data.startTime)
            session.startTime = newStartTime;
        if (data.endTime)
            session.endTime = newEndTime;
        if (data.price !== undefined)
            session.price = Number(data.price);
        if (data.vipMultiplier !== undefined)
            session.vipMultiplier = Number(data.vipMultiplier);
        return await this.sessionRepo.save(session);
    }
    async deleteSession(sessionId) {
        const session = await this.getSessionById(sessionId);
        await this.sessionRepo.remove(session);
    }
}
exports.SessionService = SessionService;
//# sourceMappingURL=SessionService.js.map