"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenreController = void 0;
const GenreService_1 = require("../services/GenreService");
const genreService = new GenreService_1.GenreService();
class GenreController {
    async getAll(req, res) {
        try {
            res.json(await genreService.getAllGenres());
        }
        catch (e) {
            res.status(500).json({ message: e.message });
        }
    }
    async create(req, res) {
        try {
            const { nameRu, nameEn } = req.body;
            if (!nameRu)
                return res.status(400).json({ message: 'nameRu обязателен' });
            res.status(201).json(await genreService.createGenre(nameRu, nameEn));
        }
        catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
    async update(req, res) {
        try {
            res.json(await genreService.updateGenre(Number(req.params.id), req.body));
        }
        catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
    async remove(req, res) {
        try {
            await genreService.deleteGenre(Number(req.params.id));
            res.json({ message: 'Жанр удалён' });
        }
        catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
}
exports.GenreController = GenreController;
//# sourceMappingURL=GenreController.js.map