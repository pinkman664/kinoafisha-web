"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const path_1 = __importDefault(require("path"));
const UserService_1 = require("../services/UserService");
const userService = new UserService_1.UserService();
class UserController {
    // Регистрация пользователя
    async register(req, res) {
        try {
            const { login, password, email } = req.body;
            if (!login || !password || !email) {
                return res.status(400).json({ message: 'Все поля (логин, пароль, email) обязательны' });
            }
            const result = await userService.register({ login, password, email });
            res.status(201).json(result);
        }
        catch (error) {
            res.status(400).json({ message: error.message || 'Ошибка регистрации' });
        }
    }
    // Вход в систему
    async login(req, res) {
        try {
            const { login, password } = req.body;
            if (!login || !password) {
                return res.status(400).json({ message: 'Логин и пароль обязательны' });
            }
            const result = await userService.login(login, password);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(401).json({ message: error.message || 'Ошибка авторизации' });
        }
    }
    // Получить профиль текущего пользователя
    async getProfile(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId)
                return res.status(401).json({ message: 'Не авторизован' });
            const profile = await userService.getProfile(userId);
            res.status(200).json(profile);
        }
        catch (error) {
            res.status(404).json({ message: error.message || 'Ошибка получения профиля' });
        }
    }
    // Отдать аватарку как изображение
    async getAvatar(req, res) {
        try {
            const user = await userService.getProfile(Number(req.params.id));
            if (!user || !user.avatarImage)
                return res.status(404).send('Нет аватарки');
            const filePath = path_1.default.resolve('uploads/avatars', user.avatarImage);
            res.sendFile(filePath);
        }
        catch (error) {
            res.status(500).send('Ошибка сервера');
        }
    }
    // Обновить профиль (никнейм и/или аватар)
    async updateProfile(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId)
                return res.status(401).json({ message: 'Не авторизован' });
            const { login } = req.body;
            const avatarImage = req.file ? req.file.filename : undefined;
            const updatedProfile = await userService.updateProfile(userId, { login, avatarImage });
            res.status(200).json(updatedProfile);
        }
        catch (error) {
            res.status(400).json({ message: error.message || 'Ошибка обновления профиля' });
        }
    }
    // === Методы для Администратора ===
    // Получить список всех пользователей
    async getAllUsers(req, res) {
        try {
            res.json(await userService.getAllUsers());
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    // Назначить администратора
    async makeAdmin(req, res) {
        try {
            const user = await userService.makeAdmin(Number(req.params.id));
            res.json(user);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    // Снять права администратора
    async removeAdmin(req, res) {
        try {
            const user = await userService.removeAdmin(Number(req.params.id));
            res.json(user);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    // Удалить пользователя
    async deleteUser(req, res) {
        try {
            await userService.deleteUser(Number(req.params.id));
            res.json({ message: 'Пользователь удалён' });
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=UserController.js.map