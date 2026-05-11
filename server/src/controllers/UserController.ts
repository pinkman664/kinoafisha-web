import { Request, Response } from 'express';
import path from 'path';
import { UserService } from '../services/UserService';
import { AuthRequest } from '../middlewares/authMiddleware';

const userService = new UserService();

export class UserController {
    // Регистрация пользователя
    async register(req: Request, res: Response) {
        try {
            const { login, password, email } = req.body;
            if (!login || !password || !email) {
                return res.status(400).json({ message: 'Все поля (логин, пароль, email) обязательны' });
            }
            const result = await userService.register({ login, password, email });
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message || 'Ошибка регистрации' });
        }
    }

    // Вход в систему
    async login(req: Request, res: Response) {
        try {
            const { login, password } = req.body;
            if (!login || !password) {
                return res.status(400).json({ message: 'Логин и пароль обязательны' });
            }
            const result = await userService.login(login, password);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(401).json({ message: error.message || 'Ошибка авторизации' });
        }
    }

    // Получить профиль текущего пользователя
    async getProfile(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ message: 'Не авторизован' });
            const profile = await userService.getProfile(userId);
            res.status(200).json(profile);
        } catch (error: any) {
            res.status(404).json({ message: error.message || 'Ошибка получения профиля' });
        }
    }

    // Отдать аватарку как изображение
    async getAvatar(req: Request, res: Response) {
        try {
            const user = await userService.getProfile(Number(req.params.id));
            if (!user || !user.avatarImage) return res.status(404).send('Нет аватарки');
            const filePath = path.resolve('uploads/avatars', user.avatarImage);
            res.sendFile(filePath);
        } catch (error: any) {
            res.status(500).send('Ошибка сервера');
        }
    }

    // Обновить профиль (никнейм и/или аватар)
    async updateProfile(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ message: 'Не авторизован' });
            const { login } = req.body;
            const avatarImage = (req as any).file ? (req as any).file.filename : undefined;
            const updatedProfile = await userService.updateProfile(userId, { login, avatarImage });
            res.status(200).json(updatedProfile);
        } catch (error: any) {
            res.status(400).json({ message: error.message || 'Ошибка обновления профиля' });
        }
    }

    // === Методы для Администратора ===

    // Получить список всех пользователей
    async getAllUsers(req: AuthRequest, res: Response) {
        try {
            res.json(await userService.getAllUsers());
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    // Назначить администратора
    async makeAdmin(req: AuthRequest, res: Response) {
        try {
            const user = await userService.makeAdmin(Number(req.params.id));
            res.json(user);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // Снять права администратора
    async removeAdmin(req: AuthRequest, res: Response) {
        try {
            const user = await userService.removeAdmin(Number(req.params.id));
            res.json(user);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // Удалить пользователя
    async deleteUser(req: AuthRequest, res: Response) {
        try {
            await userService.deleteUser(Number(req.params.id));
            res.json({ message: 'Пользователь удалён' });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}
