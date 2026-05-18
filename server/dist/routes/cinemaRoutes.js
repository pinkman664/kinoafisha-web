"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CinemaController_1 = require("../controllers/CinemaController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const adminMiddleware_1 = require("../middlewares/adminMiddleware");
const router = (0, express_1.Router)();
const cc = new CinemaController_1.CinemaController();
// Открытые
router.get('/', cc.getAll);
router.get('/:id', cc.getOne);
router.get('/:id/halls/:hallId/seats', cc.getHallSeats);
// Только для Админа
router.post('/', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, cc.create);
router.put('/:id', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, cc.update);
router.delete('/:id', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, cc.remove);
router.post('/:id/halls', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, cc.createHall);
router.delete('/halls/:hallId', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, cc.removeHall);
exports.default = router;
//# sourceMappingURL=cinemaRoutes.js.map