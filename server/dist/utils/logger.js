"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logFile = path_1.default.join(process.cwd(), 'error.log');
exports.logger = {
    error: (message, error) => {
        const timestamp = new Date().toISOString();
        // Очистка данных от Buffer перед логированием
        const cleanError = error ? JSON.parse(JSON.stringify(error, (key, value) => {
            if (value && value.type === 'Buffer')
                return '[Binary Data]';
            if (Buffer.isBuffer(value))
                return '[Binary Data]';
            return value;
        })) : '';
        const logMessage = `[${timestamp}] ERROR: ${message}\n${error ? JSON.stringify(cleanError, null, 2) : ''}\n${'-'.repeat(50)}\n`;
        fs_1.default.appendFileSync(logFile, logMessage);
        console.error(`[${timestamp}] ❌ ${message}`, error?.message || '');
    },
    info: (message) => {
        const timestamp = new Date().toISOString();
        fs_1.default.appendFileSync(logFile, `[${timestamp}] INFO: ${message}\n`);
        console.log(`[${timestamp}] ℹ️ ${message}`);
    }
};
//# sourceMappingURL=logger.js.map