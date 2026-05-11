import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

interface UserData {
  userId: number;
  login: string;
  email: string;
  isAdmin: string;
  registrationDate: string;
}

interface Ticket {
  ticketId: number;
  price: number;
  purchaseTime: string;
  seat: { rowNumber: number; seatNumber: number; seatType: string };
  session: {
    sessionId: number;
    startTime: string;
    movie: { title: string };
    hall: { hallName: string; cinema: { name: string } };
  };
}

export default function Profile() {
  const [user, setUser] = useState<UserData | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [newLogin, setNewLogin] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [editMsg, setEditMsg] = useState('');
  const [editErr, setEditErr] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, ticketsRes] = await Promise.all([
          apiClient.get('/users/profile'),
          apiClient.get('/tickets/my'),
        ]);
        setUser(profileRes.data);
        setNewLogin(profileRes.data.login);
        setTickets(ticketsRes.data);
      } catch {
        setError('Не авторизован! Перенаправляем...');
        localStorage.removeItem('token');
        setTimeout(() => navigate('/login'), 1500);
      }
    };
    fetchAll();
  }, [navigate]);

  // Сохранение изменений профиля
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditMsg(''); setEditErr('');
    try {
      const formData = new FormData();
      if (newLogin !== user?.login) formData.append('login', newLogin);
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await apiClient.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(prev => ({ ...prev!, login: res.data.login }));
      setEditMsg('✅ Профиль успешно обновлён!');
      setEditMode(false);
    } catch (e: any) {
      setEditErr(e.response?.data?.message || 'Ошибка обновления');
    }
  };

  // Отмена билета
  const handleCancel = async (ticketId: number) => {
    if (!confirm('Отменить билет?')) return;
    try {
      await apiClient.delete(`/tickets/${ticketId}`);
      setTickets(prev => prev.filter(t => t.ticketId !== ticketId));
    } catch (e: any) {
      alert('❌ ' + (e.response?.data?.message || 'Ошибка'));
    }
  };

  // Генерация QR-кода через бесплатный API (без доп. пакетов)
  const getQrUrl = (ticket: Ticket) => {
    // Используем только латиницу и цифры, чтобы избежать проблем с кодировкой кириллицы
    const data = encodeURIComponent(
      `KINOAFISHA|TICKET_ID:${ticket.ticketId}|SESSION_ID:${ticket.session?.sessionId}|TIME:${ticket.session?.startTime}|ROW:${ticket.seat?.rowNumber}|SEAT:${ticket.seat?.seatNumber}`
    );
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data}`;
  };

  if (error) return (
    <div className="auth-page"><div className="card"><p style={{color:'var(--primary)'}}>{error}</p></div></div>
  );
  if (!user) return (
    <div className="auth-page"><div className="card"><p>Загрузка...</p></div></div>
  );

  return (
    <div className="profile-page">
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="logo">🎬 Киноафиша</Link>
          <nav className="header-nav">
            {user.isAdmin === 'Y' && (
              <Link to="/admin" className="nav-link nav-link--primary">⚙ Админ</Link>
            )}
            <button
              className="nav-link"
              style={{background:'transparent',border:'1px solid var(--border)',borderRadius:'10px',cursor:'pointer',fontFamily:'inherit',color:'var(--text-muted)'}}
              onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
            >Выйти</button>
          </nav>
        </div>
      </header>

      <main className="profile-main">
        {/* Карточка пользователя */}
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <img 
                src={`/api/users/avatar/${user.userId}?t=${Date.now()}`} 
                alt="Avatar" 
                className="avatar-img"
                onError={(e) => { (e.target as any).src = ''; (e.target as any).parentElement.innerHTML = '👤'; }}
              />
            </div>
            <div>
              <div className="profile-name">{user.login}</div>
              <div className="profile-role">
                {user.isAdmin === 'Y'
                  ? <span style={{color:'#fbbf24'}}>⭐ Администратор</span>
                  : <span style={{color:'#22c55e'}}>Клиент</span>}
              </div>
            </div>
            <button
              className="btn btn--sm btn--outline"
              style={{marginLeft:'auto'}}
              onClick={() => setEditMode(!editMode)}
            >{editMode ? 'Отмена' : 'Редактировать'}</button>
          </div>

          <div className="profile-info">
            <div className="info-row"><span className="info-label">Email:</span><span>{user.email}</span></div>
            <div className="info-row">
              <span className="info-label">Дата рег.:</span>
              <span>{new Date(user.registrationDate).toLocaleDateString('ru-RU')}</span>
            </div>
          </div>

          {/* Форма редактирования профиля */}
          {editMode && (
            <form onSubmit={handleUpdateProfile} style={{marginTop:'1.5rem',borderTop:'1px solid var(--border)',paddingTop:'1.5rem'}}>
              <h3 style={{marginBottom:'1rem',fontWeight:700}}>Редактирование профиля</h3>
              <div className="input-group">
                <label>Новый никнейм</label>
                <input className="input-field" value={newLogin} onChange={e => setNewLogin(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Аватар (изображение)</label>
                <input
                  className="input-field"
                  type="file"
                  accept="image/*"
                  onChange={e => setAvatarFile(e.target.files?.[0] || null)}
                  style={{padding:'10px'}}
                />
              </div>
              {editMsg && <p style={{color:'#22c55e',margin:'0 0 1rem'}}>{editMsg}</p>}
              {editErr && <p style={{color:'var(--primary)',margin:'0 0 1rem'}}>{editErr}</p>}
              <button type="submit" className="btn" style={{width:'auto',padding:'12px 28px'}}>Сохранить</button>
            </form>
          )}
        </div>

        {/* История билетов с QR-кодами */}
        <h2 className="section-title">Мои билеты ({tickets.length})</h2>
        {tickets.length === 0 ? (
          <div className="empty-state">
            <span>🎟️</span>
            <p>У вас пока нет купленных билетов</p>
            <Link to="/" className="btn" style={{display:'inline-block',marginTop:'1rem',width:'auto',padding:'12px 24px'}}>
              Смотреть фильмы
            </Link>
          </div>
        ) : (
          <div className="tickets-list">
            {tickets.map(t => (
              <div key={t.ticketId} className="ticket-card">
                {/* QR-код билета */}
                <div className="ticket-qr">
                  <img
                    src={getQrUrl(t)}
                    alt={`QR-код билета #${t.ticketId}`}
                    width={100}
                    height={100}
                    style={{borderRadius:'8px',background:'white',padding:'4px'}}
                  />
                </div>
                <div style={{flex:1}}>
                  <div className="ticket-movie">{t.session?.movie?.title}</div>
                  <div className="ticket-meta">
                    📅 {new Date(t.session?.startTime).toLocaleString('ru-RU', {day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit'})}
                    {' · '}🏛 {t.session?.hall?.cinema?.name} — {t.session?.hall?.hallName}
                  </div>
                  <div className="ticket-meta">
                    💺 Ряд {t.seat?.rowNumber}, Место {t.seat?.seatNumber}
                    {t.seat?.seatType === 'vip' && <span style={{color:'#fbbf24',marginLeft:'.4rem'}}>★ VIP</span>}
                  </div>
                  <div className="ticket-meta" style={{color:'var(--text-muted)',fontSize:'.8rem'}}>
                    Билет #{t.ticketId} · Куплен {new Date(t.purchaseTime).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'.5rem'}}>
                  <span className="ticket-price">{t.price} руб.</span>
                  <button className="btn btn--sm btn--danger" onClick={() => handleCancel(t.ticketId)}>Отменить</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
