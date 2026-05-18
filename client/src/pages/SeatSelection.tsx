import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { Loader } from '../components/Layout';
import { useModal } from '../context/ModalContext';

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
  const { showConfirm, showAlert } = useModal();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [session, setSession] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
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

  const toggleSeat = (seat: Seat) => {
    if (seat.isTaken) return;
    if (selectedSeats.some(s => s.seatId === seat.seatId)) {
      setSelectedSeats(prev => prev.filter(s => s.seatId !== seat.seatId));
    } else {
      if (selectedSeats.length >= 5) {
        showAlert('Максимум можно выбрать 5 мест', 'warning');
        return;
      }
      setSelectedSeats(prev => [...prev, seat]);
    }
  };

  const handleReserve = async () => {
    if (selectedSeats.length === 0) return;
    setReserving(true);
    setError('');
    try {
      const seatIds = selectedSeats.map(s => s.seatId);
      const res = await apiClient.post('/tickets/reserve', {
        sessionId: Number(sessionId),
        seatIds,
      });
      const ticketIds = res.data.map((t: any) => t.ticketId);
      navigate(`/payment/${ticketIds.join(',')}`);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Ошибка бронирования');
      setReserving(false);
    }
  };

  const rows: Record<number, Seat[]> = {};
  seats.forEach(s => {
    if (!rows[s.rowNumber]) rows[s.rowNumber] = [];
    rows[s.rowNumber].push(s);
  });

  if (loading) return <Loader />;

  return (
    <div className="seat-container" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '120px' }}>
      {session && (
        <div className="glass card" style={{ marginBottom: '64px', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: session.movie?.title && session.movie.title.length > 25 ? '1.5rem' : '2rem', 
            fontWeight: 800, 
            marginBottom: '8px',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}>
            {session.movie?.title}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
            {new Date(session.startTime).toLocaleString('ru-RU', { year: 'numeric', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false })} · {session.hall?.hallName}
          </p>
        </div>
      )}

      <div style={{ position: 'relative', marginBottom: '80px' }}>
        <div style={{
          height: '6px',
          background: 'linear-gradient(90deg, transparent, #fff, transparent)',
          borderRadius: '10px',
          boxShadow: '0 0 20px rgba(255,255,255,0.4)',
          marginBottom: '20px'
        }}></div>
        <p style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '4px' }}>ЭКРАН</p>
      </div>

      <div style={{ display: 'grid', gap: '16px', marginBottom: '64px' }}>
        {Object.entries(rows).map(([row, rowSeats]) => (
          <div key={row} style={{ display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', width: '60px', textAlign: 'right' }}>РЯД {row}</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              {rowSeats.sort((a, b) => a.seatNumber - b.seatNumber).map((seat, index, arr) => {
                const prevSeatNumber = index === 0 ? 0 : arr[index - 1].seatNumber;
                const gapCount = seat.seatNumber - prevSeatNumber - 1;
                return (
                  <React.Fragment key={seat.seatId}>
                    {gapCount > 0 && Array.from({ length: gapCount }).map((_, i) => (
                      <div key={`empty-${seat.seatId}-${i}`} style={{ width: '38px', height: '38px' }} />
                    ))}
                    <button
                      disabled={seat.isTaken}
                      onClick={() => toggleSeat(seat)}
                      title={seat.isTaken ? 'Занято' : seat.seatType === 'vip' ? `VIP-место (наценка x${session?.vipMultiplier || 1.5})` : 'Стандартное место'}
                      style={{
                        width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--glass-border)',
                        background: seat.isTaken ? 'rgba(255,255,255,0.05)' : selectedSeats.some(s => s.seatId === seat.seatId) ? 'var(--primary)' : seat.seatType === 'vip' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255,255,255,0.02)',
                        color: seat.isTaken ? 'rgba(255,255,255,0.1)' : selectedSeats.some(s => s.seatId === seat.seatId) ? '#fff' : seat.seatType === 'vip' ? '#fbbf24' : '#fff',
                        cursor: seat.isTaken ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.2s',
                        borderColor: seat.seatType === 'vip' && !seat.isTaken ? '#fbbf2499' : 'var(--glass-border)',
                        boxShadow: seat.seatType === 'vip' && !seat.isTaken ? '0 0 10px rgba(251, 191, 36, 0.2)' : 'none'
                      }}
                    >
                      {seat.seatNumber}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', width: '60px' }}>РЯД {row}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
        <LegendItem color="rgba(255,255,255,0.1)" label="Занято" />
        <LegendItem color="rgba(255,255,255,0.02)" label="Свободно" />
        <LegendItem color="#fbbf2422" label={`VIP (x${session?.vipMultiplier || 1.5})`} />
        <LegendItem color="var(--primary)" label="Ваш выбор" />
      </div>

      {selectedSeats.length > 0 && (
        <div className="glass" style={{
          position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
          width: 'calc(100% - 40px)', maxWidth: '600px', padding: '24px 32px', borderRadius: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 30px 60px -12px rgba(0,0,0,0.8)', zIndex: 100
        }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>ВЫБРАНО МЕСТ: {selectedSeats.length}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxWidth: '340px' }}>
              {selectedSeats.map(s => {
                const itemPrice = s.seatType === 'vip' ? (session?.price || 0) * (session?.vipMultiplier || 1.5) : (session?.price || 0);
                return (
                  <div key={s.seatId} style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: s.seatType === 'vip' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${s.seatType === 'vip' ? 'rgba(251, 191, 36, 0.3)' : 'var(--glass-border)'}`,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {s.rowNumber}р, {s.seatNumber}м ({itemPrice.toFixed(2)} BYN)
                    {s.seatType === 'vip' && <span style={{ color: '#fbbf24' }}></span>}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>
              {selectedSeats.reduce((sum, s) => sum + (s.seatType === 'vip' ? (session?.price || 0) * (session?.vipMultiplier || 1.5) : (session?.price || 0)), 0).toFixed(2)} BYN
            </div>
            <button className="btn" onClick={handleReserve} disabled={reserving}>
              {reserving ? 'Бронирование...' : 'Купить билеты'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const LegendItem = ({ color, label }: { color: string, label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: color, border: '1px solid var(--glass-border)' }}></div>
    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</span>
  </div>
);
