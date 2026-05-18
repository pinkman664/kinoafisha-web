import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { Loader } from '../components/Layout';

interface TicketData {
  ticketId: number;
  status: string;
  price: number;
  expiresAt: string;
  seat: { rowNumber: number; seatNumber: number; seatType: string };
  session: {
    startTime: string;
    movie: { title: string };
    hall: { hallName: string; cinema: { name: string } };
  };
}

export default function Payment() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReturn = searchParams.get('status') === 'return';

  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paySuccess, setPaySuccess] = useState(false);
  const [initiating, setInitiating] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Загрузка билета + если редирект с ЮKassa — сразу confirm
  useEffect(() => {
    const init = async () => {
      try {
        const ticketIdsArray = ticketId?.split(',').map(Number) || [];
        if (ticketIdsArray.length === 0) throw new Error('Билеты не найдены');

        const resList = await Promise.all(ticketIdsArray.map(id => apiClient.get(`/tickets/${id}/status`)));
        const dataList = resList.map(res => res.data);
        setTickets(dataList);

        if (dataList.every(t => t.status === 'paid')) {
          setPaySuccess(true);
          return;
        }

        if (dataList.some(t => t.status === 'expired' || t.status === 'cancelled')) {
          setError('Бронирование одного или нескольких билетов аннулировано');
          return;
        }

        // Вернулись с ЮKassa — проверяем статус платежа
        if (isReturn) {
          const confirmRes = await apiClient.post(`/tickets/confirm-multiple`, { ticketIds: ticketIdsArray });
          if (confirmRes.data.status === 'paid') {
            setPaySuccess(true);
            return;
          }
          if (confirmRes.data.status === 'canceled') {
            setError('Оплата отменена. Можете попробовать снова.');
          }
        }

        const diff = Math.max(
          0,
          Math.floor((new Date(dataList[0].expiresAt).getTime() - Date.now()) / 1000)
        );
        setSecondsLeft(diff);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Билеты не найдены');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [ticketId]);

  const redirectingToPayment = useRef(false);

  // Таймер обратного отсчёта
  useEffect(() => {
    if (secondsLeft <= 0 || paySuccess) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [secondsLeft > 0, paySuccess]);

  // Отмена при закрытии вкладки
  useEffect(() => {
    const cancelOnUnload = () => {
      if (!paySuccess && !redirectingToPayment.current && ticketId) {
        const token = localStorage.getItem('token');
        const ids = ticketId.split(',');
        ids.forEach(id => {
          fetch(`/api/tickets/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
            keepalive: true,
          });
        });
      }
    };
    window.addEventListener('beforeunload', cancelOnUnload);
    return () => window.removeEventListener('beforeunload', cancelOnUnload);
  }, [ticketId, paySuccess]);

  const handlePay = async () => {
    if (secondsLeft <= 0) return;
    setInitiating(true);
    try {
      const ticketIdsArray = ticketId?.split(',').map(Number) || [];
      const res = await apiClient.post(`/tickets/initiate-multiple`, { ticketIds: ticketIdsArray });
      redirectingToPayment.current = true; // ← говорим что уходим на оплату
      window.location.href = res.data.confirmationUrl;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Ошибка при создании платежа');
      setInitiating(false);
    }
  };

  const handleCancel = async () => {
    try {
      const ticketIdsArray = ticketId?.split(',').map(Number) || [];
      await Promise.all(ticketIdsArray.map(id => apiClient.delete(`/tickets/${id}`)));
      navigate(-1);
    } catch {
      navigate('/');
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) return <Loader />;

  if (paySuccess) {
    return (
      <div className="payment-result page-fade" style={{ maxWidth: '500px', margin: '80px auto', textAlign: 'center' }}>
        <div className="glass card">
          <div style={{ fontSize: '4rem', marginBottom: '24px' }}>✅</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>Оплата прошла!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Ваш билет уже ждёт в личном кабинете</p>
          <button className="btn" style={{ width: '100%' }} onClick={() => navigate('/profile')}>
            К моим билетам
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container page-fade" style={{ maxWidth: '500px', margin: '40px auto' }}>
       
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-block', padding: '12px 32px', borderRadius: '16px',
          background: secondsLeft < 60 ? 'rgba(244, 63, 94, 0.1)' : 'rgba(255,255,255,0.05)',
          border: '1px solid', borderColor: secondsLeft < 60 ? 'var(--primary)' : 'var(--glass-border)',
          color: secondsLeft < 60 ? 'var(--primary)' : '#fff',
          fontWeight: 800, fontSize: '1.5rem', fontFamily: 'monospace'
        }}>
          {formatTime(secondsLeft)}
        </div>
        <p style={{ marginTop: '12px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '1px' }}>
          ВРЕМЯ НА ОПЛАТУ
        </p>
      </div>

      <div className="glass card" style={{ padding: '40px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '32px', textAlign: 'center' }}>
          💳 ОПЛАТА БИЛЕТА
        </h1>

         
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '20px', marginBottom: '32px', border: '1px solid var(--glass-border)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>СУММА К ОПЛАТЕ</p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{tickets.reduce((sum, t) => sum + t.price, 0)} BYN</p>
          <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--glass-border)' }} />
          <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>{tickets[0]?.session?.movie?.title}</p>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Места: {tickets.map(t => `Ряд ${t.seat?.rowNumber}, Место ${t.seat?.seatNumber}`).join('; ')}
          </div>
        </div>

        {error && (
          <p style={{ color: 'var(--primary)', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600, marginBottom: '20px' }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn"
            style={{ flex: 2 }}
            onClick={handlePay}
            disabled={initiating || secondsLeft <= 0}
          >
            {initiating ? 'ПЕРЕХОД К ОПЛАТЕ...' : 'ОПЛАТИТЬ ЧЕРЕЗ ЮKASSA'}
          </button>
          <button className="btn btn--outline" style={{ flex: 1 }} onClick={handleCancel}>
            ОТМЕНА
          </button>
        </div>
      </div>

      <div style={{ marginTop: '32px', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
        <p>🔒 Безопасная оплата через ЮKassa</p>
      </div>
    </div>
  );
}