import { Genre } from '../entities/Genre';
export declare class GenreService {
    private genreRepo;
    getAllGenres(): Promise<Genre[]>;
    createGenre(nameRu: string, nameEn?: string): Promise<Genre>;
    updateGenre(genreId: number, data: {
        nameRu?: string;
        nameEn?: string;
    }): Promise<Genre>;
    deleteGenre(genreId: number): Promise<void>;
}
