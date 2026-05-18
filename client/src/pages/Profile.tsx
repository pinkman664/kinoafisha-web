import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { Loader } from '../components/Layout';
import { CustomSelect } from '../components/CustomSelect';
import { useModal } from '../context/ModalContext';

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
  const { showConfirm, showAlert } = useModal();
  const [user, setUser] = useState<UserData | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [newLogin, setNewLogin] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [editMsg, setEditMsg] = useState('');
  const [editErr, setEditErr] = useState('');
  const [error, setError] = useState('');
  const [avatarError, setAvatarError] = useState(false);
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
        setError('Сессия истекла. Перенаправляем...');
        localStorage.removeItem('token');
        setTimeout(() => navigate('/login'), 1500);
      }
    };
    fetchAll();
  }, [navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditMsg(''); setEditErr('');
    if (!newLogin.trim()) {
      setEditErr('Никнейм не может быть пустым');
      return;
    }
    try {
      const formData = new FormData();
      if (newLogin !== user?.login) formData.append('login', newLogin);
      if (avatarFile) formData.append('avatar', avatarFile);

      if (!formData.has('login') && !formData.has('avatar')) {
        setEditMode(false);
        return;
      }

      const res = await apiClient.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUser(prev => ({ ...prev!, login: res.data.login || newLogin }));
      setAvatarError(false); // Reset error to try reloading new avatar
      setEditMsg('✅ Обновлено');
      setEditMode(false);
      setAvatarFile(null);
    } catch (err: any) {
      setEditErr(err.response?.data?.message || 'Ошибка обновления');
    }
  };

  const handleCancel = async (ticketId: number) => {
    if (!await showConfirm('Вы действительно хотите отменить этот билет?', 'Отмена билета')) return;
    try {
      await apiClient.delete(`/tickets/${ticketId}`);
      setTickets(prev => prev.filter(t => t.ticketId !== ticketId));
      showAlert('Билет успешно отменен!', 'success');
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Ошибка отмены билета', 'error');
    }
  };

  const getQrUrl = (ticket: Ticket) => {
    const data = encodeURIComponent(
      `TID:${ticket.ticketId}|${ticket.session?.movie?.title}|R:${ticket.seat?.rowNumber}|S:${ticket.seat?.seatNumber}`
    );
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data}`;
  };

  const [sortType, setSortType] = useState('dateAsc');

  const sortedTickets = [...tickets].sort((a, b) => {
    if (sortType === 'dateAsc') {
      return new Date(a.session.startTime).getTime() - new Date(b.session.startTime).getTime();
    } else if (sortType === 'dateDesc') {
      return new Date(b.session.startTime).getTime() - new Date(a.session.startTime).getTime();
    } else if (sortType === 'cinema') {
      return a.session.hall.cinema.name.localeCompare(b.session.hall.cinema.name);
    }
    return 0;
  });

  if (error) return (
    <div className="auth-page"><div className="glass card"><p style={{ color: 'var(--primary)', fontWeight: 700 }}>{error}</p></div></div>
  );
  if (!user) return <Loader />;

  return (
    <div className="profile-page page-fade" style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      <main className="main-content" style={{ maxWidth: '1100px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '48px', alignItems: 'start' }}>
          
           
          <aside style={{ position: 'sticky', top: '120px' }}>
            <div className="glass card" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ 
                width: '120px', height: '120px', borderRadius: '50%', 
                background: 'linear-gradient(45deg, var(--primary), #fb7185)', 
                margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: '3rem', fontWeight: 800, color: '#fff', 
                boxShadow: '0 10px 30px rgba(244, 63, 94, 0.4)',
                overflow: 'hidden', border: '4px solid rgba(255,255,255,0.1)'
              }}>
                {!avatarError ? (
                  <img 
                    src={`/api/users/avatar/${user.userId}?t=${Date.now()}`} 
                    alt="" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  user.login[0].toUpperCase()
                )}
              </div>

              {!editMode ? (
                <>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px', fontFamily: 'var(--font-title)' }}>{user.login}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '32px' }}>{user.email}</p>
                  
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <button className="btn btn--outline" onClick={() => setEditMode(true)}>Редактировать</button>
                    {user.isAdmin === 'Y' && (
                      <Link to="/admin" className="btn" style={{ textDecoration: 'none' }}>Управление</Link>
                    )}
                  </div>
                </>
              ) : (
                <form onSubmit={handleUpdate} noValidate style={{ display: 'grid', gap: '16px' }}>
                  <div className="input-group" style={{ textAlign: 'left' }}>
                    <label>Никнейм</label>
                    <input className="input-field" value={newLogin} onChange={e => setNewLogin(e.target.value)} required />
                  </div>
                  <div className="input-group" style={{ textAlign: 'left' }}>
                    <label>Новый аватар</label>
                    <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] || null)} className="input-field" style={{ padding: '8px' }} />
                  </div>
                  {editErr && <p style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>{editErr}</p>}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button type="submit" className="btn" style={{ flex: 1 }}>Ок</button>
                    <button type="button" className="btn btn--outline" style={{ flex: 1 }} onClick={() => setEditMode(false)}>Отмена</button>
                  </div>
                </form>
              )}

              <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid var(--glass-border)' }} />
              
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '1px' }}>ДЕТАЛИ АККАУНТА</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Статус:</span>
                  <span style={{ fontWeight: 700, color: user.isAdmin === 'Y' ? 'var(--primary)' : '#fff' }}>
                    {user.isAdmin === 'Y' ? '👑 Админ' : '🍿 Клиент'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Регистрация:</span>
                  <span style={{ fontWeight: 600 }}>{new Date(user.registrationDate).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            </div>
          </aside>

           
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Мои билеты</h2>
              {tickets.length > 0 && (
                <CustomSelect
                  style={{ width: '220px' }}
                  value={sortType}
                  onChange={val => setSortType(val)}
                  options={[
                    { value: 'dateAsc', label: 'Сначала ближайшие' },
                    { value: 'dateDesc', label: 'Сначала дальние' },
                    { value: 'cinema', label: 'По кинотеатру' }
                  ]}
                />
              )}
            </div>
            
            {tickets.length === 0 ? (
              <div className="glass card" style={{ textAlign: 'center', padding: '80px 40px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '24px', opacity: 0.5 }}>🎟️</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '32px' }}>У вас пока нет активных билетов</p>
                <Link to="/" className="btn" style={{ textDecoration: 'none' }}>Смотреть афишу</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '24px' }}>
                {sortedTickets.map(t => (
                  <div key={t.ticketId} className="glass card" style={{ padding: '0', overflow: 'hidden', display: 'flex' }}>
                    
                     
                    <div style={{ padding: '32px', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ 
                          fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', 
                          letterSpacing: '1.5px', background: 'rgba(244, 63, 94, 0.1)', 
                          padding: '4px 12px', borderRadius: '100px' 
                        }}>
                          {new Date(t.session?.startTime).toLocaleDateString('ru-RU', { year: 'numeric', day: '2-digit', month: 'long' }).toUpperCase()}
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>ID #{t.ticketId}</span>
                      </div>

                      <h3 style={{ 
                        fontSize: t.session?.movie?.title && t.session.movie.title.length > 25 ? '1.2rem' : '1.6rem', 
                        fontWeight: 800, 
                        marginBottom: '24px', 
                        fontFamily: 'var(--font-title)',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word'
                      }}>
                        {t.session?.movie?.title}
                      </h3>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                          <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>ВРЕМЯ</p>
                          <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{new Date(t.session?.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>МЕСТО</p>
                          <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            Ряд {t.seat?.rowNumber}, Место {t.seat?.seatNumber}
                            {t.seat?.seatType === 'vip' && <span style={{ color: '#fbbf24', marginLeft: '8px' }}>★</span>}
                          </p>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.5px' }}>КИНОТЕАТР</p>
                          <p style={{ fontWeight: 600, color: '#fff' }}>{t.session?.hall?.cinema?.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>— {t.session?.hall?.hallName}</span></p>
                        </div>
                      </div>

                      <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{t.price} BYN</span>
                        <button 
                          className="btn btn--sm btn--outline" 
                          style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '10px' }}
                          onClick={() => handleCancel(t.ticketId)}
                        >
                          Отменить
                        </button>
                      </div>
                    </div>
                    
                     
                    <div style={{ 
                      width: '200px', 
                      background: 'rgba(255,255,255,0.02)', 
                      borderLeft: '1px dashed var(--glass-border)', 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      padding: '32px',
                      position: 'relative'
                    }}>
                       
                      <div style={{ position: 'absolute', top: '-10px', left: '-10px', width: '20px', height: '20px', background: 'var(--bg-color)', borderRadius: '50%' }}></div>
                      <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '20px', height: '20px', background: 'var(--bg-color)', borderRadius: '50%' }}></div>
                      
                      <div style={{ background: '#fff', padding: '12px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <img src={getQrUrl(t)} alt="QR" style={{ width: '120px', height: '120px', display: 'block' }} />
                      </div>
                      <p style={{ marginTop: '16px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '2px' }}>CONTROL CODE</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
