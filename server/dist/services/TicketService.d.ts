import { Ticket } from '../entities/Ticket';
import { Seat } from '../entities/Seat';
export declare class TicketService {
    private ticketRepo;
    private sessionRepo;
    private seatRepo;
    private userRepo;
    reserveSeats(userId: number, sessionId: number, seatIds: number[]): Promise<{
        ticketId: number;
        status: string;
        price: number;
        expiresAt: Date;
        seat: Seat;
    }[]>;
    initiatePaymentMultiple(ticketIds: number[], userId: number): Promise<{
        confirmationUrl: string;
    }>;
    confirmPaymentMultiple(ticketIds: number[], userId: number): Promise<{
        status: string;
        tickets: Ticket[];
    } | {
        status: string;
        tickets?: undefined;
    }>;
    getTicketStatus(ticketId: number, userId: number): Promise<Ticket>;
    getUserTickets(userId: number): Promise<Ticket[]>;
    cancelTicket(ticketId: number, userId: number): Promise<void>;
    cleanExpiredReservations(): Promise<number>;
    getStatistics(): Promise<{
        totalTickets: number;
        totalRevenue: number;
        topMovies: any[];
    }>;
}
