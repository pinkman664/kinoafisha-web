import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class TicketController {
    reserve(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    initiate(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    confirm(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getStatus(req: AuthRequest, res: Response): Promise<void>;
    myTickets(req: AuthRequest, res: Response): Promise<void>;
    cancel(req: AuthRequest, res: Response): Promise<void>;
    getStats(req: AuthRequest, res: Response): Promise<void>;
}
