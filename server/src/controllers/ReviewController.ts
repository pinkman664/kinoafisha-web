import { Request, Response } from 'express';
import { ReviewService } from '../services/ReviewService';
import { AuthRequest } from '../middlewares/authMiddleware';

const reviewService = new ReviewService();

export class ReviewController {
  async getComments(req: Request, res: Response) {
    try {
      res.json(await reviewService.getMovieComments(Number(req.params.movieId)));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  }

  async addComment(req: AuthRequest, res: Response) {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ message: 'Текст комментария обязателен' });
      res.status(201).json(await reviewService.addComment(req.user!.userId, Number(req.params.movieId), text));
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  }

  async deleteComment(req: AuthRequest, res: Response) {
    try {
      const isAdmin = req.user!.isAdmin === 'Y';
      await reviewService.deleteComment(Number(req.params.commentId), req.user!.userId, isAdmin);
      res.json({ message: 'Комментарий удалён' });
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  }

  async setRating(req: AuthRequest, res: Response) {
    try {
      const { value } = req.body;
      if (!value) return res.status(400).json({ message: 'value обязателен' });
      res.json(await reviewService.setRating(req.user!.userId, Number(req.params.movieId), Number(value)));
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  }

  async getRating(req: Request, res: Response) {
    try {
      res.json(await reviewService.getMovieRating(Number(req.params.movieId)));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  }
}
