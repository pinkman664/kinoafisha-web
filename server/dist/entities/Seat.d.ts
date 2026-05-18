import { Hall } from './Hall';
import { Ticket } from './Ticket';
export declare class Seat {
    seatId: number;
    hall: Hall;
    rowNumber: number;
    seatNumber: number;
    seatType: string;
    tickets: Ticket[];
}
