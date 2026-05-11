import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import multer from 'multer';

import path from 'path';
import fs from 'fs';

const router = Router();
const userController = new UserController();

// Настройка Multer для сохранения на диск
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/avatars';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Публичные маршруты
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/avatar/:id', userController.getAvatar);

// Маршруты для авторизованных пользователей
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, upload.single('avatar'), userController.updateProfile);

// Маршруты только для Администратора
router.get('/', authMiddleware, adminMiddleware, userController.getAllUsers);
router.patch('/:id/make-admin', authMiddleware, adminMiddleware, userController.makeAdmin);
router.patch('/:id/remove-admin', authMiddleware, adminMiddleware, userController.removeAdmin);
router.delete('/:id', authMiddleware, adminMiddleware, userController.deleteUser);

export default router;
