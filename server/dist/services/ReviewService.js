"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const data_source_1 = require("../database/data-source");
const Comment_1 = require("../entities/Comment");
const Rating_1 = require("../entities/Rating");
const Movie_1 = require("../entities/Movie");
const User_1 = require("../entities/User");
class ReviewService {
    constructor() {
        this.commentRepo = data_source_1.AppDataSource.getRepository(Comment_1.Comment);
        this.ratingRepo = data_source_1.AppDataSource.getRepository(Rating_1.Rating);
        this.movieRepo = data_source_1.AppDataSource.getRepository(Movie_1.Movie);
        this.userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
    }
    async getMovieComments(movieId) {
        const comments = await this.commentRepo.find({
            where: { movie: { movieId } },
            relations: ['user'],
            order: { commentDate: 'DESC' },
        });
        const ratings = await this.ratingRepo.find({
            where: { movie: { movieId } },
            relations: ['user'],
        });
        const ratingMap = new Map();
        ratings.forEach(r => ratingMap.set(r.user.userId, r.ratingValue));
        return comments.map(c => ({
            ...c,
            userRating: ratingMap.get(c.user.userId) || null
        }));
    }
    async addComment(userId, movieId, text) {
        const movie = await this.movieRepo.findOne({ where: { movieId } });
        if (!movie)
            throw new Error('Фильм не найден');
        const user = await this.userRepo.findOne({ where: { userId } });
        if (!user)
            throw new Error('Пользователь не найден');
        const comment = this.commentRepo.create({
            movie,
            user,
            commentText: text,
            commentDate: new Date(),
        });
        const savedComment = await this.commentRepo.save(comment);
        const rating = await this.ratingRepo.findOne({ where: { user: { userId }, movie: { movieId } } });
        return {
            ...savedComment,
            userRating: rating?.ratingValue || null
        };
    }
    async deleteComment(commentId, userId, isAdmin) {
        const comment = await this.commentRepo.findOne({
            where: { commentId },
            relations: ['user'],
        });
        if (!comment)
            throw new Error('Комментарий не найден');
        if (!isAdmin && comment.user.userId !== userId)
            throw new Error('Нет доступа');
        await this.commentRepo.remove(comment);
    }
    async setRating(userId, movieId, value) {
        if (value < 1 || value > 10)
            throw new Error('Оценка должна быть от 1 до 10');
        // Ищем существующий рейтинг этого пользователя
        let rating = await this.ratingRepo.findOne({
            where: { user: { userId }, movie: { movieId } },
        });
        if (rating) {
            rating.ratingValue = value;
        }
        else {
            rating = this.ratingRepo.create({ user: { userId }, movie: { movieId }, ratingValue: value });
        }
        await this.ratingRepo.save(rating);
        // Считаем средний рейтинг
        const result = await this.ratingRepo
            .createQueryBuilder('r')
            .select('AVG(r.ratingValue)', 'avg')
            .addSelect('COUNT(r.ratingId)', 'count')
            .where('r.movie = :movieId', { movieId })
            .getRawOne();
        return {
            ratingValue: value,
            averageRating: parseFloat(result?.avg || '0').toFixed(1),
            totalVotes: parseInt(result?.count || '0')
        };
    }
    async getMovieRating(movieId) {
        const result = await this.ratingRepo
            .createQueryBuilder('r')
            .select('AVG(r.ratingValue)', 'avg')
            .addSelect('COUNT(r.ratingId)', 'count')
            .where('r.movie = :movieId', { movieId })
            .getRawOne();
        return {
            averageRating: parseFloat(result?.avg || '0').toFixed(1),
            totalVotes: parseInt(result?.count || '0'),
        };
    }
}
exports.ReviewService = ReviewService;
//# sourceMappingURL=ReviewService.js.map