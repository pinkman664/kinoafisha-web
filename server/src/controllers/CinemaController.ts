import { Request, Response } from 'express';
import { CinemaService } from '../services/CinemaService';

const cinemaService = new CinemaService();

/**
 * Контроллер для управления кинотеатрами и залами.
 */
export class CinemaController {
  /**
   * Получить список всех кинотеатров с их залами.
   */
  async getAll(req: Request, res: Response) {
    try {
      res.json(await cinemaService.getAllCinemas());
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      res.json(await cinemaService.getCinemaById(Number(req.params.id)));
    } catch (e: any) { res.status(404).json({ message: e.message }); }
  }

  /**
   * Добавление нового кинотеатра (Админ).
   */
  async create(req: Request, res: Response) {
    try {
      res.status(201).json(await cinemaService.createCinema(req.body));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      res.json(await cinemaService.updateCinema(Number(req.params.id), req.body));
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  }

  /**
   * Удаление кинотеатра.
   */
  async remove(req: Request, res: Response) {
    try {
      await cinemaService.deleteCinema(Number(req.params.id));
      res.json({ message: 'Кинотеатр удалён' });
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  }

  /**
   * Добавление нового зала в кинотеатр (Админ).
   */
  async createHall(req: Request, res: Response) {
    try {
      const hall = await cinemaService.createHall(Number(req.params.id), req.body);
      res.status(201).json(hall);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  }

  async getHallSeats(req: Request, res: Response) {
    try {
      res.json(await cinemaService.getHallSeats(Number(req.params.hallId)));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  }
}
