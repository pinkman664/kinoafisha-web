import { Ticket } from './Ticket';
import { Comment } from './Comment';
import { Rating } from './Rating';
export declare enum UserRole {
    USER = "user",
    ADMIN = "admin"
}
export declare class User {
    userId: number;
    login: string;
    password: string;
    email: string;
    registrationDate: Date;
    isAdmin: string;
    avatarImage: string;
    tickets: Ticket[];
    comments: Comment[];
    ratings: Rating[];
}
