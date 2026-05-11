import { AppDataSource } from '../database/data-source';
import { Genre } from '../entities/Genre';

// Сервис для управления жанрами фильмов
export class GenreService {
  private genreRepo = AppDataSource.getRepository(Genre);

  // Получить все жанры
  async getAllGenres() {
    return await this.genreRepo.find({ order: { nameRu: 'ASC' } });
  }

  // Создать новый жанр (только для Администратора)
  async createGenre(nameRu: string, nameEn?: string) {
    const existing = await this.genreRepo.findOne({ where: { nameRu } });
    if (existing) throw new Error('Жанр с таким названием уже существует');
    const genre = this.genreRepo.create({ nameRu, nameEn: nameEn || nameRu });
    return await this.genreRepo.save(genre);
  }

  // Обновить жанр (только для Администратора)
  async updateGenre(genreId: number, data: { nameRu?: string; nameEn?: string }) {
    const genre = await this.genreRepo.findOne({ where: { genreId } });
    if (!genre) throw new Error('Жанр не найден');
    if (data.nameRu) genre.nameRu = data.nameRu;
    if (data.nameEn) genre.nameEn = data.nameEn;
    return await this.genreRepo.save(genre);
  }

  // Удалить жанр (только для Администратора)
  async deleteGenre(genreId: number) {
    const genre = await this.genreRepo.findOne({ where: { genreId } });
    if (!genre) throw new Error('Жанр не найден');
    await this.genreRepo.remove(genre);
  }
}
