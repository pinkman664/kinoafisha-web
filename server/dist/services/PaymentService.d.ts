export interface CreatePaymentResult {
    paymentId: string;
    confirmationUrl: string;
}
export interface PaymentStatus {
    paymentId: string;
    status: 'pending' | 'succeeded' | 'canceled';
}
export declare class PaymentService {
    private shopId;
    private secretKey;
    private baseUrl;
    private get auth();
    createPayment(ticketId: number, amount: number, returnUrl: string): Promise<CreatePaymentResult>;
    getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
}
