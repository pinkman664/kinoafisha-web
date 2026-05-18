import { User } from '../entities/User';
export declare class UserService {
    private userRepository;
    register(userData: Partial<User>): Promise<{
        user: User;
        token: string;
    }>;
    login(login: string, password: string): Promise<{
        user: User;
        token: string;
    }>;
    getProfile(userId: number): Promise<User>;
    updateProfile(userId: number, updateData: {
        login?: string;
        avatarImage?: string;
    }): Promise<User>;
    getAllUsers(): Promise<User[]>;
    makeAdmin(userId: number): Promise<User>;
    removeAdmin(userId: number): Promise<User>;
    deleteUser(userId: number): Promise<void>;
    private deleteFile;
    private generateToken;
}
