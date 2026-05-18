import 'reflect-metadata';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './database/data-source';
import userRoutes from './routes/userRoutes';
import movieRoutes from './routes/movieRoutes';
import cinemaRoutes from './routes/cinemaRoutes';
import sessionRoutes from './routes/sessionRoutes';
import ticketRoutes from './routes/ticketRoutes';
import reviewRoutes from './routes/reviewRoutes';
import genreRoutes from './routes/genreRoutes';

import path from 'path';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Раздача статических файлов из папки uploads
app.use('/uploads', express.static(path.resolve('uploads')));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'API is running', timestamp: new Date().toISOString() });
});

app.use('/api/users', userRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/cinemas', cinemaRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/genres', genreRoutes);

// Error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Initialize DB and start server
const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Умное и бесшумное добавление колонки vipMultiplier в таблицу sessions
    try {
      const check = await AppDataSource.query(`
        SELECT COUNT(*) AS "cnt" FROM user_tab_cols 
        WHERE UPPER(table_name) = 'SESSIONS' AND UPPER(column_name) = 'VIPMULTIPLIER'
      `);
      const count = Number(check[0]?.cnt || check[0]?.CNT || 0);
      if (count === 0) {
        await AppDataSource.query('ALTER TABLE "sessions" ADD "vipMultiplier" NUMBER(5,2) DEFAULT 1.50');
        console.log('✅ Column vipMultiplier successfully added to SESSIONS table');
      } else {
        console.log('ℹ️ Column vipMultiplier already exists in SESSIONS table');
      }
    } catch (err: any) {
      // Резервный случай: если системный каталог недоступен, пробуем напрямую
      try {
        await AppDataSource.query('ALTER TABLE "sessions" ADD "vipMultiplier" NUMBER(5,2) DEFAULT 1.50');
      } catch (innerErr: any) {
        if (innerErr.message && !innerErr.message.includes('01430') && !innerErr.message.includes('already exists') && !innerErr.message.includes('name is already used')) {
          console.warn('⚠️ Column alteration warning:', innerErr.message);
        }
      }
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);

      // Фоновая очистка просроченных броней каждые 30 секунд
      const { TicketService } = require('./services/TicketService');
      const ticketService = new TicketService();
      setInterval(async () => {
        try {
          const cleaned = await ticketService.cleanExpiredReservations();
          if (cleaned > 0) {
            console.log(`🧹 Очищено просроченных броней: ${cleaned}`);
          }
        } catch (err) {
          console.error('Ошибка очистки броней:', err);
        }
      }, 30_000);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

startServer();

export default app;