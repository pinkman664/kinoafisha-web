"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovieService = void 0;
const data_source_1 = require("../database/data-source");
const Movie_1 = require("../entities/Movie");
const Genre_1 = require("../entities/Genre");
const Rating_1 = require("../entities/Rating");
const Comment_1 = require("../entities/Comment");
const Session_1 = require("../entities/Session");
const Ticket_1 = require("../entities/Ticket");
const typeorm_1 = require("typeorm");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Бизнес-логика для фильмов
class MovieService {
    constructor() {
        this.movieRepo = data_source_1.AppDataSource.getRepository(Movie_1.Movie);
        this.genreRepo = data_source_1.AppDataSource.getRepository(Genre_1.Genre);
    }
    // Список фильмов с фильтрами
    async getAllMovies(filters) {
        const ratingRepo = data_source_1.AppDataSource.getRepository(Rating_1.Rating);
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
        const avgMap = new Map();
        for (const row of avgResults) {
            avgMap.set(Number(row.movieId), parseFloat(row.avg || '0'));
        }
        const moviesWithRating = movies.map(m => ({
            ...m,
            averageRating: parseFloat((avgMap.get(m.movieId) || 0).toFixed(1)),
        }));
        // Фильтрация по минимальному рейтингу (на основе реальной средней оценки)
        if (filters.minRating) {
            return moviesWithRating.filter(m => m.averageRating >= filters.minRating);
        }
        return moviesWithRating;
    }
    // Получение по ID
    async getMovieById(movieId) {
        const movie = await this.movieRepo.findOne({
            where: { movieId },
            relations: ['genres'],
        });
        if (!movie)
            throw new Error('Фильм не найден');
        return movie;
    }
    // Получение бинарных данных (картинки/видео)
    async getMovieRaw(movieId) {
        return await this.movieRepo.findOne({
            where: { movieId },
            select: ['movieId', 'trailer', 'coverImage']
        });
    }
    // Создание
    async createMovie(movieData, files) {
        const { genreIds, ...rest } = movieData;
        const movie = this.movieRepo.create({
            ...rest,
            coverImage: files.coverImage,
            trailer: files.trailer,
        });
        if (movieData.releaseDate) {
            movie.releaseDate = new Date(movieData.releaseDate);
        }
        if (genreIds) {
            let ids = [];
            if (typeof genreIds === 'string')
                ids = JSON.parse(genreIds);
            else
                ids = genreIds;
            movie.genres = await this.genreRepo.find({ where: { genreId: (0, typeorm_1.In)(ids) } });
        }
        return await this.movieRepo.save(movie);
    }
    // Обновление
    async updateMovie(movieId, data, files) {
        const movie = await this.getMovieById(movieId);
        if (data.title)
            movie.title = data.title;
        if (data.description)
            movie.description = data.description;
        if (data.duration)
            movie.duration = data.duration;
        if (data.releaseDate)
            movie.releaseDate = new Date(data.releaseDate);
        if (data.ageRating)
            movie.ageRating = data.ageRating;
        if (files?.coverImage) {
            if (movie.coverImage)
                this.deleteFile(path_1.default.join('uploads/posters', movie.coverImage));
            movie.coverImage = files.coverImage;
        }
        if (files?.trailer) {
            if (movie.trailer)
                this.deleteFile(path_1.default.join('uploads/trailers', movie.trailer));
            movie.trailer = files.trailer;
        }
        if (data.genreIds) {
            let ids = [];
            if (typeof data.genreIds === 'string')
                ids = JSON.parse(data.genreIds);
            else
                ids = data.genreIds;
            movie.genres = await this.genreRepo.find({ where: { genreId: (0, typeorm_1.In)(ids) } });
        }
        return await this.movieRepo.save(movie);
    }
    async deleteMovie(movieId) {
        const movie = await this.getMovieById(movieId);
        // Вручную удаляем связанные записи, так как в Oracle каскадное удаление может быть не настроено
        await data_source_1.AppDataSource.getRepository(Rating_1.Rating).delete({ movie: { movieId } });
        await data_source_1.AppDataSource.getRepository(Comment_1.Comment).delete({ movie: { movieId } });
        // Для сеансов нужно сначала удалить билеты
        const sessions = await data_source_1.AppDataSource.getRepository(Session_1.Session).find({ where: { movie: { movieId } } });
        if (sessions.length > 0) {
            const sessionIds = sessions.map(s => s.sessionId);
            await data_source_1.AppDataSource.getRepository(Ticket_1.Ticket).delete({ session: { sessionId: (0, typeorm_1.In)(sessionIds) } });
            await data_source_1.AppDataSource.getRepository(Session_1.Session).remove(sessions);
        }
        // Удаляем файлы с диска
        if (movie.coverImage)
            this.deleteFile(path_1.default.join('uploads/posters', movie.coverImage));
        if (movie.trailer)
            this.deleteFile(path_1.default.join('uploads/trailers', movie.trailer));
        await this.movieRepo.remove(movie);
        return { success: true };
    }
    deleteFile(filePath) {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlink(filePath, (err) => {
                if (err)
                    console.error(`Ошибка удаления файла ${filePath}:`, err);
            });
        }
    }
}
exports.MovieService = MovieService;
//# sourceMappingURL=MovieService.js.map