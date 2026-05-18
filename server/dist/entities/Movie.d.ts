import { Genre } from './Genre';
import { Session } from './Session';
import { Comment } from './Comment';
import { Rating } from './Rating';
export declare class Movie {
    movieId: number;
    title: string;
    description: string;
    coverImage: string;
    rating: number;
    duration: number;
    releaseDate: Date;
    ageRating: string;
    trailer: string;
    genres: Genre[];
    sessions: Session[];
    comments: Comment[];
    ratings: Rating[];
}
