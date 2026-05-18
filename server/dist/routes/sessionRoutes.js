"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SessionController_1 = require("../controllers/SessionController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const adminMiddleware_1 = require("../middlewares/adminMiddleware");
const router = (0, express_1.Router)();
const sc = new SessionController_1.SessionController();
// Открытые
router.get('/movie/:movieId', sc.getByMovie);
router.get('/:id', sc.getOne);
router.get('/', sc.getAll);
// Только для Админа
router.post('/', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, sc.create);
router.put('/:id', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, sc.update);
router.delete('/:id', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, sc.remove);
exports.default = router;
//# sourceMappingURL=sessionRoutes.js.map