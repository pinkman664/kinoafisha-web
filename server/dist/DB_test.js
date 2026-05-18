"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const data_source_1 = require("./database/data-source");
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const movieRoutes_1 = __importDefault(require("./routes/movieRoutes"));
const cinemaRoutes_1 = __importDefault(require("./routes/cinemaRoutes"));
const sessionRoutes_1 = __importDefault(require("./routes/sessionRoutes"));
const ticketRoutes_1 = __importDefault(require("./routes/ticketRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const genreRoutes_1 = __importDefault(require("./routes/genreRoutes"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
// Раздача статических файлов из папки uploads
app.use('/uploads', express_1.default.static(path_1.default.resolve('uploads')));
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'API is running', timestamp: new Date().toISOString() });
});
app.use('/api/users', userRoutes_1.default);
app.use('/api/movies', movieRoutes_1.default);
app.use('/api/cinemas', cinemaRoutes_1.default);
app.use('/api/sessions', sessionRoutes_1.default);
app.use('/api/tickets', ticketRoutes_1.default);
app.use('/api/reviews', reviewRoutes_1.default);
app.use('/api/genres', genreRoutes_1.default);
// Error handling
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
    });
});
// Initialize DB and start server
const startServer = async () => {
    try {
        await data_source_1.AppDataSource.initialize();
        console.log('✅ Database connection established');
        // Умное и бесшумное добавление колонки vipMultiplier в таблицу sessions
        try {
            const check = await data_source_1.AppDataSource.query(`
        SELECT COUNT(*) AS "cnt" FROM user_tab_cols 
        WHERE UPPER(table_name) = 'SESSIONS' AND UPPER(column_name) = 'VIPMULTIPLIER'
      `);
            const count = Number(check[0]?.cnt || check[0]?.CNT || 0);
            if (count === 0) {
                await data_source_1.AppDataSource.query('ALTER TABLE "sessions" ADD "vipMultiplier" NUMBER(5,2) DEFAULT 1.50');
                console.log('✅ Column vipMultiplier successfully added to SESSIONS table');
            }
            else {
                console.log('ℹ️ Column vipMultiplier already exists in SESSIONS table');
            }
        }
        catch (err) {
            // Резервный случай: если системный каталог недоступен, пробуем напрямую
            try {
                await data_source_1.AppDataSource.query('ALTER TABLE "sessions" ADD "vipMultiplier" NUMBER(5,2) DEFAULT 1.50');
            }
            catch (innerErr) {
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
                }
                catch (err) {
                    console.error('Ошибка очистки броней:', err);
                }
            }, 30000);
        });
    }
    catch (error) {
        console.error('❌ Error starting server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
//# sourceMappingURL=DB_test.js.map