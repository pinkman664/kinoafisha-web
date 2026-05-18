import { Request, Response } from 'express';
export declare class MovieController {
    getAll(req: Request, res: Response): Promise<void>;
    getOne(req: Request, res: Response): Promise<void>;
    getTrailer(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getPoster(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    create(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
}
