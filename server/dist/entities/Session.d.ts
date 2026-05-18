import { Movie } from './Movie';
import { Hall } from './Hall';
import { Ticket } from './Ticket';
export declare class Session {
    sessionId: number;
    movie: Movie;
    hall: Hall;
    startTime: Date;
    endTime: Date;
    price: number;
    vipMultiplier: number;
    tickets: Ticket[];
}
