import fs from 'fs';
import path from 'path';

const logFile = path.join(process.cwd(), 'error.log');


export const logger = {
    error: (message: string, error?: any) => {
        const timestamp = new Date().toISOString();
        
        // Очистка данных от Buffer перед логированием
        const cleanError = error ? JSON.parse(JSON.stringify(error, (key, value) => {
            if (value && value.type === 'Buffer') return '[Binary Data]';
            if (Buffer.isBuffer(value)) return '[Binary Data]';
            return value;
        })) : '';

        const logMessage = `[${timestamp}] ERROR: ${message}\n${error ? JSON.stringify(cleanError, null, 2) : ''}\n${'-'.repeat(50)}\n`;
        
        fs.appendFileSync(logFile, logMessage);
        console.error(`[${timestamp}] ❌ ${message}`, error?.message || '');
    },  
    info: (message: string) => {
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logFile, `[${timestamp}] INFO: ${message}\n`);
        console.log(`[${timestamp}] ℹ️ ${message}`);
    }
};
