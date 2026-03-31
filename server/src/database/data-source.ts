import { DataSource } from "typeorm";   
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'oracle',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '1521', 10),
    username: process.env.DB_USER || 'system',
    password: process.env.DB_PASSWORD || '1111',
    serviceName: process.env.DB_SERVICE_NAME || 'CINEMA_PDB',
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    entities: ['src/entities/**/*.ts'],
    migrations: ['src/migrations/**/*.ts'],
})