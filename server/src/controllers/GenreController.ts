import { Request, Response } from 'express';
import { GenreService } from '../services/GenreService';

const genreService = new GenreService();

export class GenreController {
  async getAll(req: Request, res: Response) {
    try {
      res.json(await genreService.getAllGenres());
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  }

  async create(req: Request, res: Response) {
    try {
      const { nameRu, nameEn } = req.body;
      if (!nameRu) return res.status(400).json({ message: 'nameRu обязателен' });
      res.status(201).json(await genreService.createGenre(nameRu, nameEn));
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  }

  async update(req: Request, res: Response) {
    try {
      res.json(await genreService.updateGenre(Number(req.params.id), req.body));
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  }

  async remove(req: Request, res: Response) {
    try {
      await genreService.deleteGenre(Number(req.params.id));
      res.json({ message: 'Жанр удалён' });
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  }
}
