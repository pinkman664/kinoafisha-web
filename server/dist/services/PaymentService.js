"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
class PaymentService {
    constructor() {
        this.shopId = process.env.YOOKASSA_SHOP_ID;
        this.secretKey = process.env.YOOKASSA_SECRET_KEY;
        this.baseUrl = 'https://api.yookassa.ru/v3';
    }
    get auth() {
        return { username: this.shopId, password: this.secretKey };
    }
    async createPayment(ticketId, amount, returnUrl) {
        console.log('SHOP_ID:', this.shopId);
        console.log('SECRET_KEY:', this.secretKey ? 'есть' : 'НЕТ');
        const idempotenceKey = (0, uuid_1.v4)();
        const response = await axios_1.default.post(`${this.baseUrl}/payments`, {
            amount: {
                value: amount.toFixed(2),
                currency: 'RUB',
            },
            confirmation: {
                type: 'redirect',
                return_url: returnUrl,
            },
            capture: true,
            description: `Билет #${ticketId}`,
            metadata: { ticketId },
        }, {
            auth: this.auth,
            headers: { 'Idempotence-Key': idempotenceKey },
        });
        return {
            paymentId: response.data.id,
            confirmationUrl: response.data.confirmation.confirmation_url,
        };
    }
    async getPaymentStatus(paymentId) {
        const response = await axios_1.default.get(`${this.baseUrl}/payments/${paymentId}`, { auth: this.auth });
        return {
            paymentId: response.data.id,
            status: response.data.status, // 'pending' | 'succeeded' | 'canceled'
        };
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=PaymentService.js.map