"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovieController = void 0;
const path_1 = __importDefault(require("path"));
const MovieService_1 = require("../services/MovieService");
const logger_1 = require("../utils/logger");
const movieService = new MovieService_1.MovieService();
// Контроллер для работы с фильмами
class MovieController {
    // Получение всех фильмов с поиском и фильтрами
    async getAll(req, res) {
        try {
            const { search, genreId, minRating } = req.query;
            const movies = await movieService.getAllMovies({
                search: search,
                genreId: genreId ? Number(genreId) : undefined,
                minRating: minRating ? Number(minRating) : undefined
            });
            res.json(movies);
        }
        catch (e) {
            res.status(500).json({ message: e.message });
        }
    }
    // Информация об одном фильме
    async getOne(req, res) {
        try {
            const movie = await movieService.getMovieById(Number(req.params.id));
            res.json(movie);
        }
        catch (e) {
            res.status(404).json({ message: e.message });
        }
    }
    // Отдача видео-файла (трейлера)
    async getTrailer(req, res) {
        try {
            const movie = await movieService.getMovieRaw(Number(req.params.id));
            if (!movie || !movie.trailer) {
                return res.status(404).json({ message: 'Трейлер не найден' });
            }
            const filePath = path_1.default.resolve('uploads/trailers', movie.trailer);
            res.sendFile(filePath);
        }
        catch (e) {
            res.status(500).json({ message: e.message });
        }
    }
    // Отдача постера фильма
    async getPoster(req, res) {
        try {
            const movie = await movieService.getMovieRaw(Number(req.params.id));
            if (!movie || !movie.coverImage)
                return res.status(404).send('No cover');
            const filePath = path_1.default.resolve('uploads/posters', movie.coverImage);
            res.sendFile(filePath);
        }
        catch (e) {
            res.status(500).send(e.message);
        }
    }
    // Добавление нового фильма (админка)
    async create(req, res) {
        try {
            const coverImage = req.files?.coverImage?.[0]?.filename;
            const trailer = req.files?.trailer?.[0]?.filename;
            const movie = await movieService.createMovie(req.body, { coverImage, trailer });
            res.status(201).json(movie);
        }
        catch (e) {
            logger_1.logger.error('Ошибка при создании фильма', e);
            res.status(400).json({ message: e.message });
        }
    }
    // Редактирование
    async update(req, res) {
        try {
            const coverImage = req.files?.coverImage?.[0]?.filename;
            const trailer = req.files?.trailer?.[0]?.filename;
            const movie = await movieService.updateMovie(Number(req.params.id), req.body, { coverImage, trailer });
            res.json(movie);
        }
        catch (e) {
            logger_1.logger.error('Ошибка при обновлении фильма', e);
            res.status(400).json({ message: e.message });
        }
    }
    // Удаление
    async delete(req, res) {
        try {
            await movieService.deleteMovie(Number(req.params.id));
            res.json({ message: 'Успешно удалено' });
        }
        catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
}
exports.MovieController = MovieController;
//# sourceMappingURL=MovieController.js.map