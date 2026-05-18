import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class UserController {
    register(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    login(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getProfile(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getAvatar(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateProfile(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getAllUsers(req: AuthRequest, res: Response): Promise<void>;
    makeAdmin(req: AuthRequest, res: Response): Promise<void>;
    removeAdmin(req: AuthRequest, res: Response): Promise<void>;
    deleteUser(req: AuthRequest, res: Response): Promise<void>;
}
