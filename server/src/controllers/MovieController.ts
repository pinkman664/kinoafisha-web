import { Request, Response } from 'express';
import path from 'path';
import { MovieService } from '../services/MovieService';
import { logger } from '../utils/logger';

const movieService = new MovieService();

// Контроллер для работы с фильмами
export class MovieController {

  // Получение всех фильмов с поиском и фильтрами
  async getAll(req: Request, res: Response) {
    try {
      const { search, genreId, minRating } = req.query;
      const movies = await movieService.getAllMovies({ 
        search: search as string, 
        genreId: genreId ? Number(genreId) : undefined,
        minRating: minRating ? Number(minRating) : undefined
      });
      res.json(movies);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  }

  // Информация об одном фильме
  async getOne(req: Request, res: Response) {
    try {
      const movie = await movieService.getMovieById(Number(req.params.id));
      res.json(movie);
    } catch (e: any) {
      res.status(404).json({ message: e.message });
    }
  }

  // Отдача видео-файла (трейлера)
  async getTrailer(req: Request, res: Response) {
    try {
      const movie = await movieService.getMovieRaw(Number(req.params.id));
      if (!movie || !movie.trailer) {
        return res.status(404).json({ message: 'Трейлер не найден' });
      }
      const filePath = path.resolve('uploads/trailers', movie.trailer);
      res.sendFile(filePath);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  }

  // Отдача постера фильма
  async getPoster(req: Request, res: Response) {
    try {
      const movie = await movieService.getMovieRaw(Number(req.params.id));
      if (!movie || !movie.coverImage) return res.status(404).send('No cover');
      const filePath = path.resolve('uploads/posters', movie.coverImage);
      res.sendFile(filePath);
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  }

  // Добавление нового фильма (админка)
  async create(req: Request, res: Response) {
    try {
      const coverImage = (req as any).files?.coverImage?.[0]?.filename;
      const trailer = (req as any).files?.trailer?.[0]?.filename;
      const movie = await movieService.createMovie(req.body, { coverImage, trailer });
      res.status(201).json(movie);
    } catch (e: any) {
      logger.error('Ошибка при создании фильма', e);
      res.status(400).json({ message: e.message });
    }
  }

  // Редактирование
  async update(req: Request, res: Response) {
    try {
      const coverImage = (req as any).files?.coverImage?.[0]?.filename;
      const trailer = (req as any).files?.trailer?.[0]?.filename;
      const movie = await movieService.updateMovie(Number(req.params.id), req.body, { coverImage, trailer });
      res.json(movie);
    } catch (e: any) {
      logger.error('Ошибка при обновлении фильма', e);
      res.status(400).json({ message: e.message });
    }
  }

  // Удаление
  async delete(req: Request, res: Response) {
    try {
      await movieService.deleteMovie(Number(req.params.id));
      res.json({ message: 'Успешно удалено' });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
}
