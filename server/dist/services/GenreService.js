"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenreService = void 0;
const data_source_1 = require("../database/data-source");
const Genre_1 = require("../entities/Genre");
// Сервис для управления жанрами фильмов
class GenreService {
    constructor() {
        this.genreRepo = data_source_1.AppDataSource.getRepository(Genre_1.Genre);
    }
    // Получить все жанры
    async getAllGenres() {
        return await this.genreRepo.find({ order: { nameRu: 'ASC' } });
    }
    // Создать новый жанр (только для Администратора)
    async createGenre(nameRu, nameEn) {
        const existing = await this.genreRepo.findOne({ where: { nameRu } });
        if (existing)
            throw new Error('Жанр с таким названием уже существует');
        const genre = this.genreRepo.create({ nameRu, nameEn: nameEn || nameRu });
        return await this.genreRepo.save(genre);
    }
    // Обновить жанр (только для Администратора)
    async updateGenre(genreId, data) {
        const genre = await this.genreRepo.findOne({ where: { genreId } });
        if (!genre)
            throw new Error('Жанр не найден');
        if (data.nameRu)
            genre.nameRu = data.nameRu;
        if (data.nameEn)
            genre.nameEn = data.nameEn;
        return await this.genreRepo.save(genre);
    }
    // Удалить жанр (только для Администратора)
    async deleteGenre(genreId) {
        const genre = await this.genreRepo.findOne({ where: { genreId } });
        if (!genre)
            throw new Error('Жанр не найден');
        await this.genreRepo.remove(genre);
    }
}
exports.GenreService = GenreService;
//# sourceMappingURL=GenreService.js.map