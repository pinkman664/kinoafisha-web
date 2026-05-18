import { Movie } from './Movie';
import { User } from './User';
export declare class Comment {
    commentId: number;
    movie: Movie;
    user: User;
    commentText: string;
    commentDate: Date;
}
