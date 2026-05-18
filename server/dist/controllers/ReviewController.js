"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const ReviewService_1 = require("../services/ReviewService");
const reviewService = new ReviewService_1.ReviewService();
class ReviewController {
    async getComments(req, res) {
        try {
            res.json(await reviewService.getMovieComments(Number(req.params.movieId)));
        }
        catch (e) {
            res.status(500).json({ message: e.message });
        }
    }
    async addComment(req, res) {
        try {
            const { text } = req.body;
            if (!text)
                return res.status(400).json({ message: 'Текст комментария обязателен' });
            res.status(201).json(await reviewService.addComment(req.user.userId, Number(req.params.movieId), text));
        }
        catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
    async deleteComment(req, res) {
        try {
            const isAdmin = req.user.isAdmin === 'Y';
            await reviewService.deleteComment(Number(req.params.commentId), req.user.userId, isAdmin);
            res.json({ message: 'Комментарий удалён' });
        }
        catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
    async setRating(req, res) {
        try {
            const { value } = req.body;
            if (!value)
                return res.status(400).json({ message: 'value обязателен' });
            res.json(await reviewService.setRating(req.user.userId, Number(req.params.movieId), Number(value)));
        }
        catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
    async getRating(req, res) {
        try {
            res.json(await reviewService.getMovieRating(Number(req.params.movieId)));
        }
        catch (e) {
            res.status(500).json({ message: e.message });
        }
    }
}
exports.ReviewController = ReviewController;
//# sourceMappingURL=ReviewController.js.map