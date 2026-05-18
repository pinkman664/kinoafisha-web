import { Request, Response } from 'express';
/**
 * Контроллер для управления кинотеатрами и залами.
 */
export declare class CinemaController {
    /**
     * Получить список всех кинотеатров с их залами.
     */
    getAll(req: Request, res: Response): Promise<void>;
    getOne(req: Request, res: Response): Promise<void>;
    /**
     * Добавление нового кинотеатра (Админ).
     */
    create(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    /**
     * Удаление кинотеатра.
     */
    remove(req: Request, res: Response): Promise<void>;
    /**
     * Добавление нового зала в кинотеатр (Админ).
     */
    createHall(req: Request, res: Response): Promise<void>;
    getHallSeats(req: Request, res: Response): Promise<void>;
    removeHall(req: Request, res: Response): Promise<void>;
}
