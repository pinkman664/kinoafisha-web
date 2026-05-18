import { Session } from '../entities/Session';
import { Hall } from '../entities/Hall';
import { Ticket } from '../entities/Ticket';
export declare class SessionService {
    private sessionRepo;
    private movieRepo;
    private hallRepo;
    private ticketRepo;
    getAllSessions(): Promise<Session[]>;
    getSessionsByMovie(movieId: number): Promise<Session[]>;
    getSessionById(sessionId: number): Promise<Session>;
    getSessionWithAvailableSeats(sessionId: number): Promise<{
        session: Session;
        seats: {
            isTaken: boolean;
            seatId: number;
            hall: Hall;
            rowNumber: number;
            seatNumber: number;
            seatType: string;
            tickets: Ticket[];
        }[];
    }>;
    private parseLocalDate;
    private checkOverlap;
    createSession(data: {
        movieId: number;
        hallId: number;
        startTime: string;
        endTime?: string;
        price: number;
        vipMultiplier?: number;
    }): Promise<Session>;
    updateSession(sessionId: number, data: Partial<{
        startTime: string;
        endTime: string;
        price: number;
        vipMultiplier: number;
    }>): Promise<Session>;
    deleteSession(sessionId: number): Promise<void>;
}
