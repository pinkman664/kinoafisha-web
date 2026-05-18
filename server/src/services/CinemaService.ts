import { AppDataSource } from '../database/data-source';
import { Cinema } from '../entities/Cinema';
import { Hall } from '../entities/Hall';
import { Seat } from '../entities/Seat';

/**
 * Сервис для управления кинотеатрами и кинозалами.
 */
export class CinemaService {
  private cinemaRepo = AppDataSource.getRepository(Cinema);
  private hallRepo = AppDataSource.getRepository(Hall);
  private seatRepo = AppDataSource.getRepository(Seat);

  /**
   * Получение списка всех кинотеатров.
   */
  async getAllCinemas() {
    return await this.cinemaRepo.find({ relations: ['halls'] });
  }

  async getCinemaById(cinemaId: number) {
    const cinema = await this.cinemaRepo.findOne({
      where: { cinemaId },
      relations: ['halls', 'halls.seats'],
    });
    if (!cinema) throw new Error('Кинотеатр не найден');
    return cinema;
  }

  /**
   * Создание нового кинотеатра.
   */
  async createCinema(data: Partial<Cinema>) {
    const cinema = this.cinemaRepo.create(data);
    return await this.cinemaRepo.save(cinema);
  }

  async updateCinema(cinemaId: number, data: Partial<Cinema>) {
    const cinema = await this.getCinemaById(cinemaId);
    Object.assign(cinema, data);
    return await this.cinemaRepo.save(cinema);
  }

  /**
   * Удаление кинотеатра.
   */
  async deleteCinema(cinemaId: number) {
    const cinema = await this.getCinemaById(cinemaId);
    await this.cinemaRepo.remove(cinema);
  }

  // --- Halls ---
  async createHall(cinemaId: number, data: { hallName: string; rows: number; cols: number; seats?: any[] }) {
    const cinema = await this.getCinemaById(cinemaId);
    
    // Если переданы кастомные места, считаем вместимость по ним
    const capacity = data.seats ? data.seats.length : (data.rows * data.cols);

    const hall = this.hallRepo.create({ 
      hallName: data.hallName, 
      capacity, 
      cinema 
    });
    const saved = await this.hallRepo.save(hall);

    const seatEntities: Seat[] = [];

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
    } else {
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

  async getHallSeats(hallId: number) {
    return await this.seatRepo.find({ where: { hall: { hallId } } });
  }

  async deleteHall(hallId: number) {
    const hall = await this.hallRepo.findOne({ where: { hallId } });
    if (!hall) throw new Error('Зал не найден');
    await this.hallRepo.remove(hall);
  }
}
