import { AppDataSource } from '../database/data-source';
import { Session } from '../entities/Session';
import { Movie } from '../entities/Movie';
import { Hall } from '../entities/Hall';
import { Ticket } from '../entities/Ticket';

export class SessionService {
  private sessionRepo = AppDataSource.getRepository(Session);
  private movieRepo = AppDataSource.getRepository(Movie);
  private hallRepo = AppDataSource.getRepository(Hall);
  private ticketRepo = AppDataSource.getRepository(Ticket);

  async getAllSessions() {
    return await this.sessionRepo.find({
      relations: ['movie', 'hall', 'hall.cinema'],
      order: { startTime: 'DESC' },
    });
  }

  async getSessionsByMovie(movieId: number) {
    return await this.sessionRepo.find({
      where: { movie: { movieId } },
      relations: ['hall', 'hall.cinema'],
      order: { startTime: 'ASC' },
    });
  }

  async getSessionById(sessionId: number) {
    const session = await this.sessionRepo.findOne({
      where: { sessionId },
      relations: ['movie', 'hall', 'hall.seats', 'tickets', 'tickets.seat'],
    });
    if (!session) throw new Error('Сеанс не найден');
    return session;
  }

  async getSessionWithAvailableSeats(sessionId: number) {
    const session = await this.getSessionById(sessionId);
    const now = new Date();
    // Место занято если ticket оплачен ИЛИ бронь ещё не истекла
    const takenSeatIds = session.tickets
      .filter(t =>
        t.status === 'paid' ||
        (t.status === 'reserved' && new Date(t.expiresAt) > now)
      )
      .map(t => t.seat?.seatId);
    const allSeats = session.hall.seats;
    const available = allSeats.map(seat => ({
      ...seat,
      isTaken: takenSeatIds.includes(seat.seatId),
    }));
    return { session, seats: available };
  }

  private async checkOverlap(hallId: number, newStartTime: Date, newEndTime: Date, excludeSessionId?: number) {
    const existingSessions = await this.sessionRepo.find({
      where: { hall: { hallId } },
      relations: ['movie'],
    });

    for (const s of existingSessions) {
      if (excludeSessionId && s.sessionId === excludeSessionId) continue;
      const sStart = new Date(s.startTime);
      const sDurationMs = (s.movie.duration || 0) * 60 * 1000;
      const sEnd = s.endTime ? new Date(s.endTime) : new Date(sStart.getTime() + sDurationMs);

      if (newStartTime < sEnd && newEndTime > sStart) {
        throw new Error('Зал занят в это время (пересечение с другим сеансом)');
      }
    }
  }

  async createSession(data: { movieId: number; hallId: number; startTime: string; endTime?: string; price: number }) {
    const movie = await this.movieRepo.findOne({ where: { movieId: data.movieId } });
    if (!movie) throw new Error('Фильм не найден');

    const hall = await this.hallRepo.findOne({ where: { hallId: data.hallId } });
    if (!hall) throw new Error('Зал не найден');

    const newStartTime = new Date(data.startTime);
    const newEndTime = data.endTime ? new Date(data.endTime) : new Date(newStartTime.getTime() + (movie.duration || 0) * 60000);

    await this.checkOverlap(data.hallId, newStartTime, newEndTime);

    const session = this.sessionRepo.create({
      movie,
      hall,
      startTime: newStartTime,
      endTime: data.endTime ? new Date(data.endTime) : undefined,
      price: data.price,
    });
    return await this.sessionRepo.save(session);
  }

  async updateSession(sessionId: number, data: Partial<{ startTime: string; endTime: string; price: number }>) {
    const session = await this.getSessionById(sessionId);
    
    let newStartTime = new Date(session.startTime);
    let newEndTime = session.endTime ? new Date(session.endTime) : new Date(newStartTime.getTime() + (session.movie.duration || 0) * 60000);

    if (data.startTime) {
      newStartTime = new Date(data.startTime);
      newEndTime = data.endTime ? new Date(data.endTime) : new Date(newStartTime.getTime() + (session.movie.duration || 0) * 60000);
    } else if (data.endTime) {
      newEndTime = new Date(data.endTime);
    }

    if (data.startTime || data.endTime) {
      await this.checkOverlap(session.hall.hallId, newStartTime, newEndTime, sessionId);
    }

    if (data.startTime) session.startTime = newStartTime;
    if (data.endTime) session.endTime = new Date(data.endTime);
    if (data.price !== undefined) session.price = data.price;
    return await this.sessionRepo.save(session);
  }

  async deleteSession(sessionId: number) {
    const session = await this.getSessionById(sessionId);
    await this.sessionRepo.remove(session);
  }
}
