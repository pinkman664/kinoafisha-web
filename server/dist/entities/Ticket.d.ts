import { Session } from './Session';
import { Seat } from './Seat';
import { User } from './User';
export declare class Ticket {
    ticketId: number;
    status: string;
    reservedAt: Date;
    expiresAt: Date;
    paymentId: string;
    session: Session;
    seat: Seat;
    user: User;
    purchaseTime: Date;
    price: number;
}
