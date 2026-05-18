"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ReviewController_1 = require("../controllers/ReviewController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const rc = new ReviewController_1.ReviewController();
// Комментарии
router.get('/movie/:movieId/comments', rc.getComments);
router.post('/movie/:movieId/comments', authMiddleware_1.authMiddleware, rc.addComment);
router.delete('/comments/:commentId', authMiddleware_1.authMiddleware, rc.deleteComment);
// Рейтинг
router.get('/movie/:movieId/rating', rc.getRating);
router.post('/movie/:movieId/rating', authMiddleware_1.authMiddleware, rc.setRating);
exports.default = router;
//# sourceMappingURL=reviewRoutes.js.map