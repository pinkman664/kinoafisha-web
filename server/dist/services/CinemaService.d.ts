import { Cinema } from '../entities/Cinema';
import { Hall } from '../entities/Hall';
import { Seat } from '../entities/Seat';
/**
 * Сервис для управления кинотеатрами и кинозалами.
 */
export declare class CinemaService {
    private cinemaRepo;
    private hallRepo;
    private seatRepo;
    /**
     * Получение списка всех кинотеатров.
     */
    getAllCinemas(): Promise<Cinema[]>;
    getCinemaById(cinemaId: number): Promise<Cinema>;
    /**
     * Создание нового кинотеатра.
     */
    createCinema(data: Partial<Cinema>): Promise<Cinema>;
    updateCinema(cinemaId: number, data: Partial<Cinema>): Promise<Cinema>;
    /**
     * Удаление кинотеатра.
     */
    deleteCinema(cinemaId: number): Promise<void>;
    createHall(cinemaId: number, data: {
        hallName: string;
        rows: number;
        cols: number;
        seats?: any[];
    }): Promise<Hall>;
    getHallSeats(hallId: number): Promise<Seat[]>;
    deleteHall(hallId: number): Promise<void>;
}
