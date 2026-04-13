import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({ message: 'Пользователь не авторизован' });
        return;
    }

    if (req.user.isAdmin !== 'Y') {
        res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора.' });
        return;
    }

    next();
};
