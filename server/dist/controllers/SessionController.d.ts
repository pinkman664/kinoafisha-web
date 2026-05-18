import { Request, Response } from 'express';
export declare class SessionController {
    getAll(req: Request, res: Response): Promise<void>;
    getByMovie(req: Request, res: Response): Promise<void>;
    getOne(req: Request, res: Response): Promise<void>;
    create(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    remove(req: Request, res: Response): Promise<void>;
}
