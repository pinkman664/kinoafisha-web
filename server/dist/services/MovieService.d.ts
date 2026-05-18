import { Movie } from '../entities/Movie';
import { Genre } from '../entities/Genre';
import { Rating } from '../entities/Rating';
import { Comment } from '../entities/Comment';
import { Session } from '../entities/Session';
export declare class MovieService {
    private movieRepo;
    private genreRepo;
    getAllMovies(filters: {
        search?: string;
        genreId?: number;
        minRating?: number;
    }): Promise<{
        averageRating: number;
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
    }[]>;
    getMovieById(movieId: number): Promise<Movie>;
    getMovieRaw(movieId: number): Promise<Movie | null>;
    createMovie(movieData: any, files: {
        coverImage?: string;
        trailer?: string;
    }): Promise<Movie>;
    updateMovie(movieId: number, data: any, files?: {
        coverImage?: string;
        trailer?: string;
    }): Promise<Movie>;
    deleteMovie(movieId: number): Promise<{
        success: boolean;
    }>;
    private deleteFile;
}
