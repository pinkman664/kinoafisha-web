import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class ReviewController {
    getComments(req: Request, res: Response): Promise<void>;
    addComment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteComment(req: AuthRequest, res: Response): Promise<void>;
    setRating(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getRating(req: Request, res: Response): Promise<void>;
}
