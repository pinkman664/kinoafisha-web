"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'oracle',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '1521', 10),
    username: process.env.DB_USER || 'system',
    password: process.env.DB_PASSWORD || '1111',
    serviceName: process.env.DB_SERVICE_NAME || 'CINEMA_PDB',
    synchronize: false,
    logging: true,
    entities: [
        process.env.NODE_ENV === 'production'
            ? 'dist/entities/**/*.js'
            : 'src/entities/**/*.ts',
    ],
    migrations: ['src/migrations/**/*.ts'],
});
//# sourceMappingURL=data-source.js.map