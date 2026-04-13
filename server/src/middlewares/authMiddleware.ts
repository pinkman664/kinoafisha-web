import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: {
        userId: number;
        login: string;
        isAdmin: string;
        email: string;
    };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Нет авторизации. Токен отсутствует или неверный формат.' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123') as AuthRequest['user'];
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ message: 'Токен недействителен или истек.' });
        return;
    }
};
