/**
 * Mock-сервис оплаты.
 *
 * Имитирует работу платёжного шлюза. Легко заменяется на реальный
 * (Stripe, ЮKassa и т.д.) — достаточно реализовать тот же интерфейс
 * processPayment() → { success, transactionId, message }.
 */

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  message: string;
}

export interface PaymentData {
  cardNumber: string;
  expiry: string;   // "MM/YY"
  cvv: string;
  amount: number;
}

export class PaymentService {
  /**
   * Имитация обработки платежа.
   * - Номер карты, начинающийся с 4242 → всегда успех
   * - Номер карты, начинающийся с 4000 → всегда отказ (для тестирования)
   * - Остальные → 80% успех, 20% случайный отказ
   */
  async processPayment(data: PaymentData): Promise<PaymentResult> {
    // Валидация формата
    const cleaned = data.cardNumber.replace(/\s/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) {
      return { success: false, transactionId: '', message: 'Некорректный номер карты' };
    }
    if (!/^\d{2}\/\d{2}$/.test(data.expiry)) {
      return { success: false, transactionId: '', message: 'Некорректный срок действия (MM/YY)' };
    }
    if (!/^\d{3,4}$/.test(data.cvv)) {
      return { success: false, transactionId: '', message: 'Некорректный CVV' };
    }
    if (data.amount <= 0) {
      return { success: false, transactionId: '', message: 'Сумма должна быть больше 0' };
    }

    // Имитация задержки (как у реального банка)
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

    // Тестовые сценарии
    if (cleaned.startsWith('4242')) {
      return {
        success: true,
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        message: 'Оплата успешно проведена',
      };
    }

    if (cleaned.startsWith('4000')) {
      return {
        success: false,
        transactionId: '',
        message: 'Карта отклонена банком',
      };
    }

    // Случайный исход для остальных
    const success = Math.random() > 0.2;
    return {
      success,
      transactionId: success ? `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` : '',
      message: success ? 'Оплата успешно проведена' : 'Недостаточно средств',
    };
  }
}
