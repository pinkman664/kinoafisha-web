"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = void 0;
const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ message: 'Пользователь не авторизован' });
        return;
    }
    if (req.user.isAdmin !== 'Y') {
        res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора.' });
        return;
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
//# sourceMappingURL=adminMiddleware.js.map