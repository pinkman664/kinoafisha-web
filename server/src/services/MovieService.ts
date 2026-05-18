import { AppDataSource } from '../database/data-source';
import { Movie } from '../entities/Movie';
import { Genre } from '../entities/Genre';
import { Rating } from '../entities/Rating';
import { Comment } from '../entities/Comment';
import { Session } from '../entities/Session';
import { Ticket } from '../entities/Ticket';
import { In } from 'typeorm';
import fs from 'fs';
import path from 'path';

// Бизнес-логика для фильмов
export class MovieService {
  private movieRepo = AppDataSource.getRepository(Movie);
  private genreRepo = AppDataSource.getRepository(Genre);

  // Список фильмов с фильтрами
  async getAllMovies(filters: { search?: string; genreId?: number; minRating?: number }) {
    const ratingRepo = AppDataSource.getRepository(Rating);

    const query = this.movieRepo.createQueryBuilder('movie')
      .leftJoinAndSelect('movie.genres', 'genre')
      .select(['movie.movieId', 'movie.title', 'movie.description', 'movie.duration', 'movie.releaseDate', 'movie.ageRating', 'movie.rating', 'movie.coverImage', 'movie.trailer', 'genre']);

    if (filters.search) {
      query.andWhere('LOWER(movie.title) LIKE LOWER(:search)', { search: `%${filters.search}%` });
    }

    if (filters.genreId) {
      query.andWhere('genre.genreId = :genreId', { genreId: filters.genreId });
    }

    const movies = await query.getMany();

    // Подтягиваем средние оценки для всех фильмов одним запросом
    const avgResults = await ratingRepo
      .createQueryBuilder('r')
      .select('r.movieId', 'movieId')
      .addSelect('AVG(r.ratingValue)', 'avg')
      .groupBy('r.movieId')
      .getRawMany();

    const avgMap = new Map<number, number>();
    for (const row of avgResults) {
      avgMap.set(Number(row.movieId), parseFloat(row.avg || '0'));
    }

    const moviesWithRating = movies.map(m => ({
      ...m,
      averageRating: parseFloat((avgMap.get(m.movieId) || 0).toFixed(1)),
    }));

    // Фильтрация по минимальному рейтингу (на основе реальной средней оценки)
    if (filters.minRating) {
      return moviesWithRating.filter(m => m.averageRating >= filters.minRating!);
    }

    return moviesWithRating;
  }

  // Получение по ID
  async getMovieById(movieId: number) {
    const movie = await this.movieRepo.findOne({
      where: { movieId },
      relations: ['genres'],
    });

    if (!movie) throw new Error('Фильм не найден');
    return movie;
  }

  // Получение бинарных данных (картинки/видео)
  async getMovieRaw(movieId: number) {
    return await this.movieRepo.findOne({
      where: { movieId },
      select: ['movieId', 'trailer', 'coverImage']
    });
  }

  // Создание
  async createMovie(movieData: any, files: { coverImage?: string; trailer?: string }) {
    const { genreIds, ...rest } = movieData;
    const movie = (this.movieRepo.create({
      ...rest,
      coverImage: files.coverImage,
      trailer: files.trailer,
    }) as unknown) as Movie;

    if (movieData.releaseDate) {
      movie.releaseDate = new Date(movieData.releaseDate);
    }
    
    if (genreIds) {
      let ids = [];
      if (typeof genreIds === 'string') ids = JSON.parse(genreIds);
      else ids = genreIds;
      movie.genres = await this.genreRepo.find({ where: { genreId: In(ids) } });
    }

    return await this.movieRepo.save(movie);
  }

  // Обновление
  async updateMovie(movieId: number, data: any, files?: { coverImage?: string, trailer?: string }) {
    const movie = await this.getMovieById(movieId);

    if (data.title) movie.title = data.title;
    if (data.description) movie.description = data.description;
    if (data.duration) movie.duration = data.duration;
    if (data.releaseDate) movie.releaseDate = new Date(data.releaseDate);
    if (data.ageRating) movie.ageRating = data.ageRating;
    
    if (files?.coverImage) {
      if (movie.coverImage) this.deleteFile(path.join('uploads/posters', movie.coverImage));
      movie.coverImage = files.coverImage;
    }
    if (files?.trailer) {
      if (movie.trailer) this.deleteFile(path.join('uploads/trailers', movie.trailer));
      movie.trailer = files.trailer;
    }

    if (data.genreIds) {
       let ids = [];
       if (typeof data.genreIds === 'string') ids = JSON.parse(data.genreIds);
       else ids = data.genreIds;
       movie.genres = await this.genreRepo.find({ where: { genreId: In(ids) } });
    }

    return await this.movieRepo.save(movie);
  }

  async deleteMovie(movieId: number) {
    const movie = await this.getMovieById(movieId);
    
    // Вручную удаляем связанные записи, так как в Oracle каскадное удаление может быть не настроено
    await AppDataSource.getRepository(Rating).delete({ movie: { movieId } });
    await AppDataSource.getRepository(Comment).delete({ movie: { movieId } });
    
    // Для сеансов нужно сначала удалить билеты
    const sessions = await AppDataSource.getRepository(Session).find({ where: { movie: { movieId } } });
    if (sessions.length > 0) {
      const sessionIds = sessions.map(s => s.sessionId);
      await AppDataSource.getRepository(Ticket).delete({ session: { sessionId: In(sessionIds) } });
      await AppDataSource.getRepository(Session).remove(sessions);
    }

    // Удаляем файлы с диска
    if (movie.coverImage) this.deleteFile(path.join('uploads/posters', movie.coverImage));
    if (movie.trailer) this.deleteFile(path.join('uploads/trailers', movie.trailer));

    await this.movieRepo.remove(movie);
    return { success: true };
  }

  private deleteFile(filePath: string) {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error(`Ошибка удаления файла ${filePath}:`, err);
      });
    }
  }
}
