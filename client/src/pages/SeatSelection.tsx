import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

interface Seat {
  seatId: number;
  rowNumber: number;
  seatNumber: number;
  seatType: string;
  isTaken: boolean;
}

export default function SeatSelection() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [session, setSession] = useState<any>(null);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        // Загружаем сеанс с информацией о занятых местах
        const res = await apiClient.get(`/sessions/${sessionId}`);
        setSession(res.data.session);
        setSeats(res.data.seats);
      } catch {
        setError('Сеанс не найден');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [sessionId]);

  const handleReserve = async () => {
    if (!selectedSeat) return;
    setReserving(true);
    setError('');
    try {
      const res = await apiClient.post('/tickets/reserve', {
        sessionId: Number(sessionId),
        seatId: selectedSeat.seatId,
      });
      // Перенаправляем на страницу оплаты с таймером
      navigate(`/payment/${res.data.ticketId}`);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Ошибка при бронировании');
      setReserving(false);
    }
  };

  // Группируем места по рядам для отображения схемы зала
  const rows: Record<number, Seat[]> = {};
  seats.forEach(s => {
    if (!rows[s.rowNumber]) rows[s.rowNumber] = [];
    rows[s.rowNumber].push(s);
  });

  if (loading) return <div className="loading-center">Загружаем схему зала...</div>;
  if (error && !session) return <div className="loading-center" style={{color:'var(--primary)'}}>{error}</div>;

  return (
    <div className="seat-page">
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="logo">🎬 Киноафиша</Link>
        </div>
      </header>

      <main className="seat-main">
        {/* Информация о сеансе */}
        {session && (
          <div className="seat-info-card">
            <h1 className="seat-movie-title">{session.movie?.title}</h1>
            <div className="seat-meta">
              <span>🕐 {new Date(session.startTime).toLocaleString('ru-RU', {
                day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
              })}</span>
              <span>🏛 {session.hall?.cinema?.name} — {session.hall?.hallName}</span>
              <span className="seat-price-badge">{session.price} руб. / место</span>
            </div>
          </div>
        )}

        {/* Экран (ориентир) */}
        <div className="screen-label">ЭКРАН</div>
        <div className="screen-bar"></div>

        {/* Схема зала */}
        <div className="seats-hall">
          {Object.entries(rows).map(([row, rowSeats]) => (
            <div key={row} className="seat-row">
              <span className="row-label">Ряд {row}</span>
              <div className="row-seats">
                {rowSeats.sort((a, b) => a.seatNumber - b.seatNumber).map(seat => (
                  <button
                    key={seat.seatId}
                    disabled={seat.isTaken}
                    onClick={() => !seat.isTaken && setSelectedSeat(seat)}
                    className={`seat-btn ${seat.isTaken ? 'taken' : ''} ${selectedSeat?.seatId === seat.seatId ? 'chosen' : ''} ${seat.seatType === 'vip' ? 'vip' : ''}`}
                    title={seat.isTaken ? 'Место занято' : `Место ${seat.seatNumber}${seat.seatType === 'vip' ? ' (VIP)' : ''}`}
                  >
                    {seat.seatNumber}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Легенда */}
        <div className="seat-legend">
          <span className="legend-item"><span className="legend-box free"></span> Свободно</span>
          <span className="legend-item"><span className="legend-box chosen"></span> Выбрано</span>
          <span className="legend-item"><span className="legend-box taken"></span> Занято</span>
          <span className="legend-item"><span className="legend-box vip"></span> VIP</span>
        </div>

        {/* Панель бронирования */}
        {selectedSeat && (
          <div className="buy-panel">
            <div className="buy-info">
              <span>✅ Выбрано: Ряд <strong>{selectedSeat.rowNumber}</strong>, Место <strong>{selectedSeat.seatNumber}</strong></span>
              {selectedSeat.seatType === 'vip' && <span className="vip-label">⭐ VIP</span>}
              <span className="buy-price">Итого: {session?.price} руб.</span>
            </div>
            {error && <p style={{color:'var(--primary)',margin:'0'}}>{error}</p>}
            <button className="btn" style={{width:'auto',padding:'13px 32px'}} onClick={handleReserve} disabled={reserving}>
              {reserving ? 'Бронируем...' : '🎟 Забронировать место'}
            </button>
            <p style={{color:'var(--text-muted)', fontSize: '0.8rem', margin: '8px 0 0'}}>
              После бронирования у вас будет 6 минут на оплату
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
