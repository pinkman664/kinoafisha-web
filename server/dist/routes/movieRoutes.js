"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MovieController_1 = require("../controllers/MovieController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const adminMiddleware_1 = require("../middlewares/adminMiddleware");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const mc = new MovieController_1.MovieController();
// Настройка Multer для сохранения на диск
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const dir = file.fieldname === 'coverImage' ? 'uploads/posters' : 'uploads/trailers';
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage });
/**
 * ПУБЛИЧНЫЕ РОУТЫ
 */
// Получение всех фильмов
router.get('/', mc.getAll);
// Получение одного фильма по ID
router.get('/:id', mc.getOne);
// Стриминг трейлера фильма
router.get('/:id/trailer', mc.getTrailer);
// Получение обложки фильма
router.get('/:id/poster', mc.getPoster);
/**
 * АДМИН-РОУТЫ (требуют токен и права администратора)
 */
// Создание фильма с загрузкой файлов
router.post('/', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'trailer', maxCount: 1 }]), mc.create);
// Обновление фильма
router.put('/:id', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'trailer', maxCount: 1 }]), mc.update);
// Удаление фильма
router.delete('/:id', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, mc.delete);
exports.default = router;
//# sourceMappingURL=movieRoutes.js.map