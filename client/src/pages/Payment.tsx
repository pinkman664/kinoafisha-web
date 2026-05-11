import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

interface TicketData {
  ticketId: number;
  status: string;
  price: number;
  expiresAt: string;
  seat: { rowNumber: number; seatNumber: number; seatType: string };
  session: {
    startTime: string;
    price: number;
    movie: { title: string };
    hall: { hallName: string; cinema: { name: string } };
  };
}

export default function Payment() {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Форма оплаты
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  // Таймер
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Загружаем данные билета
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await apiClient.get(`/tickets/${ticketId}/status`);
        const data = res.data;
        setTicket(data);

        if (data.status === 'paid') {
          setPaySuccess(true);
        } else if (data.status === 'expired' || data.status === 'cancelled') {
          setError('Бронь истекла или была отменена');
        } else {
          // Считаем оставшееся время
          const expiresMs = new Date(data.expiresAt).getTime();
          const nowMs = Date.now();
          const diff = Math.max(0, Math.floor((expiresMs - nowMs) / 1000));
          setSecondsLeft(diff);
        }
      } catch (e: any) {
        setError(e.response?.data?.message || 'Билет не найден');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId]);

  // Запуск таймера обратного отсчёта
  useEffect(() => {
    if (secondsLeft <= 0 || paySuccess) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setError('Время бронирования истекло!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [secondsLeft > 0, paySuccess]);

  // Форматирование номера карты (4242 4242 4242 4242)
  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  // Форматирование срока действия (MM/YY)
  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  // Оплата
  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (secondsLeft <= 0) {
      setPayError('Время бронирования истекло');
      return;
    }
    setPaying(true);
    setPayError('');
    try {
      const res = await apiClient.post(`/tickets/${ticketId}/pay`, {
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiry,
        cvv,
      });
      setPaySuccess(true);
      setTransactionId(res.data.transactionId);
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (e: any) {
      setPayError(e.response?.data?.message || 'Ошибка оплаты');
    } finally {
      setPaying(false);
    }
  };

  // Отмена бронирования
  const handleCancel = async () => {
    try {
      await apiClient.delete(`/tickets/${ticketId}`);
      navigate(-1);
    } catch {
      navigate('/');
    }
  };

  // Форматирование таймера
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Цвет таймера
  const timerColor = secondsLeft <= 60 ? '#ef4444' : secondsLeft <= 120 ? '#f59e0b' : '#22c55e';

  if (loading) return <div className="loading-center">Загрузка...</div>;

  // Бронь истекла
  if (error && !paySuccess) {
    return (
      <div className="payment-page">
        <header className="site-header">
          <div className="header-inner">
            <Link to="/" className="logo">🎬 Киноафиша</Link>
          </div>
        </header>
        <main className="payment-main">
          <div className="payment-card payment-expired">
            <div className="payment-expired-icon">⏰</div>
            <h2>{error}</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Место снова доступно для бронирования
            </p>
            <button className="btn" onClick={() => navigate(-1)} style={{width:'auto', padding:'12px 28px'}}>
              ← Вернуться к выбору мест
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Оплата прошла
  if (paySuccess) {
    return (
      <div className="payment-page">
        <header className="site-header">
          <div className="header-inner">
            <Link to="/" className="logo">🎬 Киноафиша</Link>
          </div>
        </header>
        <main className="payment-main">
          <div className="payment-card payment-success">
            <div className="payment-success-icon">✅</div>
            <h2>Оплата прошла успешно!</h2>
            {transactionId && (
              <p className="transaction-id">Транзакция: {transactionId}</p>
            )}
            <div className="payment-ticket-summary">
              <p><strong>{ticket?.session?.movie?.title}</strong></p>
              <p>📅 {ticket && new Date(ticket.session.startTime).toLocaleString('ru-RU', {
                day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
              })}</p>
              <p>💺 Ряд {ticket?.seat?.rowNumber}, Место {ticket?.seat?.seatNumber}</p>
              <p>💰 {ticket?.price} руб.</p>
            </div>
            <button className="btn" onClick={() => navigate('/profile')} style={{width:'auto', padding:'12px 28px'}}>
              🎟 Перейти к моим билетам
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Основная форма оплаты
  return (
    <div className="payment-page">
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="logo">🎬 Киноафиша</Link>
        </div>
      </header>

      <main className="payment-main">
        <div className="payment-card">
          <h1 className="payment-title">💳 Оплата билета</h1>

          {/* Таймер */}
          <div className="payment-timer" style={{ borderColor: timerColor }}>
            <span className="timer-icon">⏱️</span>
            <span className="timer-text">Осталось:</span>
            <span className="timer-value" style={{ color: timerColor }}>
              {formatTime(secondsLeft)}
            </span>
          </div>

          {/* Информация о билете */}
          <div className="payment-info">
            <div className="payment-info-row">
              <span className="payment-label">Фильм</span>
              <span className="payment-value">{ticket?.session?.movie?.title}</span>
            </div>
            <div className="payment-info-row">
              <span className="payment-label">Сеанс</span>
              <span className="payment-value">
                {ticket && new Date(ticket.session.startTime).toLocaleString('ru-RU', {
                  day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
                })}
              </span>
            </div>
            <div className="payment-info-row">
              <span className="payment-label">Кинотеатр</span>
              <span className="payment-value">
                {ticket?.session?.hall?.cinema?.name} — {ticket?.session?.hall?.hallName}
              </span>
            </div>
            <div className="payment-info-row">
              <span className="payment-label">Место</span>
              <span className="payment-value">
                Ряд {ticket?.seat?.rowNumber}, Место {ticket?.seat?.seatNumber}
                {ticket?.seat?.seatType === 'vip' && ' ⭐ VIP'}
              </span>
            </div>
            <div className="payment-info-row payment-total">
              <span className="payment-label">Итого</span>
              <span className="payment-value payment-price">{ticket?.price} руб.</span>
            </div>
          </div>

          {/* Форма карты */}
          <form onSubmit={handlePay} className="payment-form">
            <div className="card-field">
              <label>Номер карты</label>
              <input
                type="text"
                className="input-field"
                placeholder="4242 4242 4242 4242"
                value={cardNumber}
                onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
                required
              />
            </div>
            <div className="card-row">
              <div className="card-field">
                <label>Срок действия</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={e => setExpiry(formatExpiry(e.target.value))}
                  maxLength={5}
                  required
                />
              </div>
              <div className="card-field">
                <label>CVV</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="•••"
                  value={cvv}
                  onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  required
                />
              </div>
            </div>

            {payError && (
              <div className="payment-error">
                ❌ {payError}
              </div>
            )}

            <button
              type="submit"
              className="btn payment-btn"
              disabled={paying || secondsLeft <= 0}
            >
              {paying ? '⏳ Обработка...' : `💳 Оплатить ${ticket?.price} руб.`}
            </button>
          </form>

          {/* Тестовые подсказки */}
          <div className="payment-test-info">
            <p className="test-title">🧪 Тестовые карты:</p>
            <p><code>4242 4242 4242 4242</code> — всегда успех</p>
            <p><code>4000 0000 0000 0000</code> — всегда отказ</p>
          </div>

          {/* Кнопка отмены */}
          <button className="payment-cancel" onClick={handleCancel}>
            Отменить бронирование
          </button>
        </div>
      </main>
    </div>
  );
}
