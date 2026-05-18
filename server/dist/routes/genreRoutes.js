"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const GenreController_1 = require("../controllers/GenreController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const adminMiddleware_1 = require("../middlewares/adminMiddleware");
const router = (0, express_1.Router)();
const gc = new GenreController_1.GenreController();
router.get('/', gc.getAll); // Все могут видеть жанры
router.post('/', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, gc.create); // Только Администратор
router.put('/:id', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, gc.update); // Только Администратор
router.delete('/:id', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, gc.remove); // Только Администратор
exports.default = router;
//# sourceMappingURL=genreRoutes.js.map