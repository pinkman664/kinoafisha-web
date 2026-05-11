import { Request, Response } from 'express';
import { SessionService } from '../services/SessionService';

const sessionService = new SessionService();

export class SessionController {
  async getAll(req: Request, res: Response) {
    try {
      res.json(await sessionService.getAllSessions());
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  }

  async getByMovie(req: Request, res: Response) {
    try {
      res.json(await sessionService.getSessionsByMovie(Number(req.params.movieId)));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  }

  async getOne(req: Request, res: Response) {
    try {
      res.json(await sessionService.getSessionWithAvailableSeats(Number(req.params.id)));
    } catch (e: any) { res.status(404).json({ message: e.message }); }
  }

  async create(req: Request, res: Response) {
    try {
      res.status(201).json(await sessionService.createSession(req.body));
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  }

  async update(req: Request, res: Response) {
    try {
      res.json(await sessionService.updateSession(Number(req.params.id), req.body));
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  }

  async remove(req: Request, res: Response) {
    try {
      await sessionService.deleteSession(Number(req.params.id));
      res.json({ message: 'Сеанс удалён' });
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  }
}
