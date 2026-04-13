import { AppDataSource } from '../database/data-source';
import { User } from '../entities/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class UserService {
    private userRepository = AppDataSource.getRepository(User);

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

    async login(login: string, password: string): Promise<{ user: User, token: string }> {
        const user = await this.userRepository.findOne({ where: { login } });
        
        if (!user) {
            throw new Error('Неверный логин или пароль');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Неверный логин или пароль');
        }

        const token = this.generateToken(user);

        const { password: _, ...userResponse } = user;
        return { user: userResponse as User, token };
    }

    async getProfile(userId: number): Promise<User> {
        const user = await this.userRepository.findOne({ 
            where: { userId },
            select: ['userId', 'login', 'email', 'registrationDate', 'isAdmin', 'avatarImage']
        });

        if (!user) {
            throw new Error('Пользователь не найден');
        }

        return user;
    }

    async updateProfile(userId: number, updateData: { login?: string, avatarImage?: Buffer }): Promise<User> {
        const user = await this.userRepository.findOne({ where: { userId } });

        if (!user) {
            throw new Error('Пользователь не найден');
        }

        if (updateData.login && updateData.login !== user.login) {
             const existingUser = await this.userRepository.findOne({ where: { login: updateData.login } });
             if (existingUser) {
                 throw new Error('Пользователь с таким логином уже существует');
             }
             user.login = updateData.login;
        }

        if (updateData.avatarImage !== undefined) {
             user.avatarImage = updateData.avatarImage;
        }

        await this.userRepository.save(user);

        const { password, ...userResponse } = user;
        return userResponse as User;
    }

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
