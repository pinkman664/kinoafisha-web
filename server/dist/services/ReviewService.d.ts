import { Movie } from '../entities/Movie';
import { User } from '../entities/User';
export declare class ReviewService {
    private commentRepo;
    private ratingRepo;
    private movieRepo;
    private userRepo;
    getMovieComments(movieId: number): Promise<{
        userRating: any;
        commentId: number;
        movie: Movie;
        user: User;
        commentText: string;
        commentDate: Date;
    }[]>;
    addComment(userId: number, movieId: number, text: string): Promise<{
        userRating: number | null;
        commentId: number;
        movie: Movie;
        user: User;
        commentText: string;
        commentDate: Date;
    }>;
    deleteComment(commentId: number, userId: number, isAdmin: boolean): Promise<void>;
    setRating(userId: number, movieId: number, value: number): Promise<{
        ratingValue: number;
        averageRating: string;
        totalVotes: number;
    }>;
    getMovieRating(movieId: number): Promise<{
        averageRating: string;
        totalVotes: number;
    }>;
}
