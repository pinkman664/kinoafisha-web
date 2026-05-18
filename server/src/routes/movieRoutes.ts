import { Router } from 'express';
import { MovieController } from '../controllers/MovieController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import multer from 'multer';

import path from 'path';
import fs from 'fs';

const router = Router();
const mc = new MovieController();

// Настройка Multer для сохранения на диск
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = file.fieldname === 'coverImage' ? 'uploads/posters' : 'uploads/trailers';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB (трейлеры)
});

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
router.post('/', 
  authMiddleware, 
  adminMiddleware, 
  upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'trailer', maxCount: 1 }]), 
  mc.create
);

// Обновление фильма
router.put('/:id', 
  authMiddleware, 
  adminMiddleware, 
  upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'trailer', maxCount: 1 }]), 
  mc.update
);

// Удаление фильма
router.delete('/:id', authMiddleware, adminMiddleware, mc.delete);

export default router;
