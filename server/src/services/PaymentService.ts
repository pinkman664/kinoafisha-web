import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface CreatePaymentResult {
  paymentId: string;
  confirmationUrl: string;
}

export interface PaymentStatus {
  paymentId: string;
  status: 'pending' | 'succeeded' | 'canceled';
}

export class PaymentService {
  private shopId = process.env.YOOKASSA_SHOP_ID!;
  private secretKey = process.env.YOOKASSA_SECRET_KEY!;
  private baseUrl = 'https://api.yookassa.ru/v3';

  private get auth() {
    return { username: this.shopId, password: this.secretKey };
  }

  async createPayment(
    ticketId: number,
    amount: number,
    returnUrl: string
  ): Promise<CreatePaymentResult> {
    console.log('SHOP_ID:', this.shopId);
    console.log('SECRET_KEY:', this.secretKey ? 'есть' : 'НЕТ');
    const idempotenceKey = uuidv4();

    const response = await axios.post(
      `${this.baseUrl}/payments`,
      {
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
      },
      {
        auth: this.auth,
        headers: { 'Idempotence-Key': idempotenceKey },
      }
    );

    return {
      paymentId: response.data.id,
      confirmationUrl: response.data.confirmation.confirmation_url,
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const response = await axios.get(
      `${this.baseUrl}/payments/${paymentId}`,
      { auth: this.auth }
    );

    return {
      paymentId: response.data.id,
      status: response.data.status, // 'pending' | 'succeeded' | 'canceled'
    };
  }
}