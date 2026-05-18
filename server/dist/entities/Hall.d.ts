import { Cinema } from './Cinema';
import { Seat } from './Seat';
import { Session } from './Session';
export declare class Hall {
    hallId: number;
    cinema: Cinema;
    hallName: string;
    capacity: number;
    seats: Seat[];
    sessions: Session[];
}
