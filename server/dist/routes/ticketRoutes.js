"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TicketController_1 = require("../controllers/TicketController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const adminMiddleware_1 = require("../middlewares/adminMiddleware");
const router = (0, express_1.Router)();
const tc = new TicketController_1.TicketController();
router.post('/reserve', authMiddleware_1.authMiddleware, tc.reserve);
router.post('/initiate-multiple', authMiddleware_1.authMiddleware, tc.initiate);
router.post('/confirm-multiple', authMiddleware_1.authMiddleware, tc.confirm);
router.get('/:id/status', authMiddleware_1.authMiddleware, tc.getStatus);
router.get('/my', authMiddleware_1.authMiddleware, tc.myTickets);
router.delete('/:id', authMiddleware_1.authMiddleware, tc.cancel);
router.get('/stats', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, tc.getStats);
exports.default = router;
//# sourceMappingURL=ticketRoutes.js.map