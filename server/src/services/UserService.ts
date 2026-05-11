import { AppDataSource } from '../database/data-source';
import { User } from '../entities/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

export class UserService {
    private userRepository = AppDataSource.getRepository(User);

    // Регистрация нового пользователя
    async register(userData: Partial<User>): Promise<{ user: User, token: string }> {
        const existingUser = await this.userRepository.findOne({
            where: [{ login: userData.login }, { email: userData.email }]
        });

        if (existingUser) {
            throw new Error('Пользователь с таким логином или email уже существует');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password!, salt);

        const newUser = this.userRepository.create({
            ...userData,
            password: hashedPassword,
            isAdmin: 'N', // По умолчанию обычный пользователь
        });

        await this.userRepository.save(newUser);

        const token = this.generateToken(newUser);
        const { password, ...userResponse } = newUser;
        return { user: userResponse as User, token };
    }

    // Вход в систему
    async login(login: string, password: string): Promise<{ user: User, token: string }> {
        const user = await this.userRepository.findOne({ where: { login } });

        if (!user) throw new Error('Неверный логин или пароль');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error('Неверный логин или пароль');

        const token = this.generateToken(user);
        const { password: _, ...userResponse } = user;
        return { user: userResponse as User, token };
    }

    // Получить профиль текущего пользователя
    async getProfile(userId: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { userId },
            select: ['userId', 'login', 'email', 'registrationDate', 'isAdmin', 'avatarImage']
        });

        if (!user) throw new Error('Пользователь не найден');
        return user;
    }

    // Обновить профиль (никнейм и/или аватар)
    async updateProfile(userId: number, updateData: { login?: string, avatarImage?: string }): Promise<User> {
        const user = await this.userRepository.findOne({ where: { userId } });

        if (!user) throw new Error('Пользователь не найден');

        if (updateData.login && updateData.login !== user.login) {
            const existingUser = await this.userRepository.findOne({ where: { login: updateData.login } });
            if (existingUser) throw new Error('Пользователь с таким логином уже существует');
            user.login = updateData.login;
        }

        if (updateData.avatarImage !== undefined) {
            if (user.avatarImage) this.deleteFile(path.join('uploads/avatars', user.avatarImage));
            user.avatarImage = updateData.avatarImage;
        }

        await this.userRepository.save(user);
        const { password, ...userResponse } = user;
        return userResponse as User;
    }

    // === Методы для Администратора ===

    // Получить список всех пользователей (только для Администратора)
    async getAllUsers(): Promise<User[]> {
        return await this.userRepository.find({
            select: ['userId', 'login', 'email', 'registrationDate', 'isAdmin'],
            order: { registrationDate: 'DESC' }
        });
    }

    // Назначить пользователя администратором (только для Администратора)
    async makeAdmin(userId: number): Promise<User> {
        const user = await this.userRepository.findOne({ where: { userId } });
        if (!user) throw new Error('Пользователь не найден');
        user.isAdmin = 'Y';
        await this.userRepository.save(user);
        const { password, ...userResponse } = user;
        return userResponse as User;
    }

    // Снять права администратора
    async removeAdmin(userId: number): Promise<User> {
        const user = await this.userRepository.findOne({ where: { userId } });
        if (!user) throw new Error('Пользователь не найден');
        user.isAdmin = 'N';
        await this.userRepository.save(user);
        const { password, ...userResponse } = user;
        return userResponse as User;
    }

    // Удалить аккаунт пользователя (только для Администратора)
    async deleteUser(userId: number): Promise<void> {
        const user = await this.userRepository.findOne({ where: { userId } });
        if (!user) throw new Error('Пользователь не найден');
        if (user.avatarImage) this.deleteFile(path.join('uploads/avatars', user.avatarImage));
        await this.userRepository.remove(user);
    }

    private deleteFile(filePath: string) {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) console.error(`Ошибка удаления файла ${filePath}:`, err);
            });
        }
    }

    // Генерация JWT токена
    private generateToken(user: User): string {
        return jwt.sign(
            {
                userId: user.userId,
                login: user.login,
                email: user.email,
                isAdmin: user.isAdmin
            },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '24h' }
        );
    }
}
