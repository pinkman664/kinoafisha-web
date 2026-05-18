"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const data_source_1 = require("../database/data-source");
const User_1 = require("../entities/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class UserService {
    constructor() {
        this.userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
    }
    // Регистрация нового пользователя
    async register(userData) {
        const existingLogin = await this.userRepository.findOne({ where: { login: userData.login } });
        if (existingLogin) {
            throw new Error('Логин уже занят');
        }
        const existingEmail = await this.userRepository.findOne({ where: { email: userData.email } });
        if (existingEmail) {
            throw new Error('Email уже используется');
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(userData.password, salt);
        const newUser = this.userRepository.create({
            ...userData,
            password: hashedPassword,
            isAdmin: 'N', // По умолчанию обычный пользователь
        });
        await this.userRepository.save(newUser);
        const token = this.generateToken(newUser);
        const { password, ...userResponse } = newUser;
        return { user: userResponse, token };
    }
    // Вход в систему
    async login(login, password) {
        const user = await this.userRepository.findOne({ where: { login } });
        if (!user)
            throw new Error('Неверный логин или пароль');
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch)
            throw new Error('Неверный логин или пароль');
        const token = this.generateToken(user);
        const { password: _, ...userResponse } = user;
        return { user: userResponse, token };
    }
    // Получить профиль текущего пользователя
    async getProfile(userId) {
        const user = await this.userRepository.findOne({
            where: { userId },
            select: ['userId', 'login', 'email', 'registrationDate', 'isAdmin', 'avatarImage']
        });
        if (!user)
            throw new Error('Пользователь не найден');
        return user;
    }
    // Обновить профиль (никнейм и/или аватар)
    async updateProfile(userId, updateData) {
        const user = await this.userRepository.findOne({ where: { userId } });
        if (!user)
            throw new Error('Пользователь не найден');
        if (updateData.login && updateData.login !== user.login) {
            const existingUser = await this.userRepository.findOne({ where: { login: updateData.login } });
            if (existingUser)
                throw new Error('Пользователь с таким логином уже существует');
            user.login = updateData.login;
        }
        if (updateData.avatarImage !== undefined) {
            if (user.avatarImage)
                this.deleteFile(path_1.default.join('uploads/avatars', user.avatarImage));
            user.avatarImage = updateData.avatarImage;
        }
        await this.userRepository.save(user);
        const { password, ...userResponse } = user;
        return userResponse;
    }
    // === Методы для Администратора ===
    // Получить список всех пользователей (только для Администратора)
    async getAllUsers() {
        return await this.userRepository.find({
            select: ['userId', 'login', 'email', 'registrationDate', 'isAdmin'],
            order: { registrationDate: 'DESC' }
        });
    }
    // Назначить пользователя администратором (только для Администратора)
    async makeAdmin(userId) {
        const user = await this.userRepository.findOne({ where: { userId } });
        if (!user)
            throw new Error('Пользователь не найден');
        user.isAdmin = 'Y';
        await this.userRepository.save(user);
        const { password, ...userResponse } = user;
        return userResponse;
    }
    // Снять права администратора
    async removeAdmin(userId) {
        const user = await this.userRepository.findOne({ where: { userId } });
        if (!user)
            throw new Error('Пользователь не найден');
        user.isAdmin = 'N';
        await this.userRepository.save(user);
        const { password, ...userResponse } = user;
        return userResponse;
    }
    // Удалить аккаунт пользователя (только для Администратора)
    async deleteUser(userId) {
        const user = await this.userRepository.findOne({ where: { userId } });
        if (!user)
            throw new Error('Пользователь не найден');
        if (user.avatarImage)
            this.deleteFile(path_1.default.join('uploads/avatars', user.avatarImage));
        await this.userRepository.remove(user);
    }
    deleteFile(filePath) {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlink(filePath, (err) => {
                if (err)
                    console.error(`Ошибка удаления файла ${filePath}:`, err);
            });
        }
    }
    // Генерация JWT токена
    generateToken(user) {
        return jsonwebtoken_1.default.sign({
            userId: user.userId,
            login: user.login,
            email: user.email,
            isAdmin: user.isAdmin
        }, process.env.JWT_SECRET || 'secret123', { expiresIn: '24h' });
    }
}
exports.UserService = UserService;
//# sourceMappingURL=UserService.js.map