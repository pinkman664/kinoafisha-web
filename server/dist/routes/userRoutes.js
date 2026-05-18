"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const adminMiddleware_1 = require("../middlewares/adminMiddleware");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const userController = new UserController_1.UserController();
// Настройка Multer для сохранения на диск
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/avatars';
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
// Публичные маршруты
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/avatar/:id', userController.getAvatar);
// Маршруты для авторизованных пользователей
router.get('/profile', authMiddleware_1.authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware_1.authMiddleware, upload.single('avatar'), userController.updateProfile);
// Маршруты только для Администратора
router.get('/', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, userController.getAllUsers);
router.patch('/:id/make-admin', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, userController.makeAdmin);
router.patch('/:id/remove-admin', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, userController.removeAdmin);
router.delete('/:id', authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, userController.deleteUser);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map