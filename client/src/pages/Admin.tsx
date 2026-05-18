import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { Loader } from '../components/Layout';
import { CustomSelect } from '../components/CustomSelect';
import { useModal } from '../context/ModalContext';

type Tab = 'movies' | 'genres' | 'cinemas' | 'sessions' | 'users' | 'stats' | 'comments';
type SeatType = 'standard' | 'vip';

interface ConstructorSeat {
  row: number;
  col: number;
  type: SeatType;
  isActive: boolean;
}

export default function Admin() {
  const navigate = useNavigate();
  const { showConfirm, showAlert } = useModal();
  const [tab, setTab] = useState<Tab>('movies');
  const [loading, setLoading] = useState(true);

  // Данные
  const [movies, setMovies] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Формы
  const [movieForm, setMovieForm] = useState({ title: '', description: '', duration: '', ageRating: '', releaseDate: '', genreIds: [] as number[] });
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [trailerFile, setTrailerFile] = useState<File | null>(null);
  const [editMovieId, setEditMovieId] = useState<number | null>(null);

  const [genreForm, setGenreForm] = useState({ nameRu: '', nameEn: '' });
  const [cinemaForm, setCinemaForm] = useState({ name: '', address: '', city: '', contactPhone: '' });

  // Конструктор зала
  const [hallForm, setHallForm] = useState({ cinemaId: '', hallName: '', rows: 5, cols: 10 });
  const [constructorSeats, setConstructorSeats] = useState<ConstructorSeat[]>([]);
  const [showConstructor, setShowConstructor] = useState(false);
  const [sessionForm, setSessionForm] = useState({ movieId: '', hallId: '', startTime: '', price: '', vipMultiplier: '1.5' });
  const [editSessionId, setEditSessionId] = useState<number | null>(null);
  const [commentMovieId, setCommentMovieId] = useState('');

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFieldErrors({});
  }, [tab]);

  useEffect(() => {
    apiClient.get('/users/profile')
      .then(r => { if (r.data.isAdmin !== 'Y') navigate('/'); else setLoading(false); })
      .catch(() => navigate('/login'));
  }, [navigate]);

  const loadData = async () => {
    try {
      if (tab === 'movies' || tab === 'genres') { const r = await apiClient.get('/genres'); setGenres(r.data); }
      if (tab === 'movies') { const r = await apiClient.get('/movies'); setMovies(r.data); }
      if (tab === 'genres') { const r = await apiClient.get('/genres'); setGenres(r.data); }
      if (tab === 'cinemas') { const r = await apiClient.get('/cinemas'); setCinemas(r.data); }
      if (tab === 'users') { const r = await apiClient.get('/users'); setUsers(r.data); }
      if (tab === 'sessions') {
        const [sRes, mRes, cRes] = await Promise.all([apiClient.get('/sessions'), apiClient.get('/movies'), apiClient.get('/cinemas')]);
        setSessions(sRes.data); setMovies(mRes.data); setCinemas(cRes.data);
      }
      if (tab === 'stats') { const r = await apiClient.get('/tickets/stats'); setStats(r.data); }
    } catch (e) { }
  };

  useEffect(() => { if (!loading) loadData(); }, [tab, loading]);

  const ok = (text: string) => { setMsg(text); setErr(''); setTimeout(() => setMsg(''), 3000); };
  const fail = (text: string) => { setErr(text); setMsg(''); setTimeout(() => setErr(''), 4000); };

  // ── ФИЛЬМЫ ──
  const handleMovieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!movieForm.title.trim()) errors.movieTitle = 'Название фильма обязательно';
    if (!movieForm.duration) {
      errors.movieDuration = 'Укажите длительность';
    } else {
      const dur = Number(movieForm.duration);
      if (isNaN(dur) || dur < 1 || dur > 900) {
        errors.movieDuration = 'Длительность должна быть от 1 до 900 минут';
      }
    }
    if (!movieForm.genreIds || movieForm.genreIds.length === 0) {
      errors.movieGenres = 'Выберите хотя бы один жанр';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      const fd = new FormData();
      Object.entries(movieForm).forEach(([k, v]) => {
        if (k === 'genreIds') fd.append(k, JSON.stringify(v));
        else if (v) fd.append(k, String(v));
      });
      if (posterFile) fd.append('coverImage', posterFile);
      if (trailerFile) fd.append('trailer', trailerFile);
      if (editMovieId) await apiClient.put(`/movies/${editMovieId}`, fd);
      else await apiClient.post('/movies', fd);
      ok('✅ Сохранено');
      setEditMovieId(null); setMovieForm({ title: '', description: '', duration: '', ageRating: '', releaseDate: '', genreIds: [] });
      setPosterFile(null); setTrailerFile(null); loadData();
    } catch (e) { fail('Ошибка сохранения'); }
  };

  // ── ЖАНРЫ ──
  const handleGenreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!genreForm.nameRu.trim()) errors.genreNameRu = 'Название на русском обязательно';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try { await apiClient.post('/genres', genreForm); ok('✅ Жанр добавлен'); setGenreForm({ nameRu: '', nameEn: '' }); loadData(); } catch (e) { fail('Ошибка'); }
  };

  // ── КИНОТЕАТРЫ ──
  const handleCinemaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!cinemaForm.name.trim()) errors.cinemaName = 'Название кинотеатра обязательно';
    if (!cinemaForm.address.trim()) errors.cinemaAddress = 'Адрес обязателен';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try { await apiClient.post('/cinemas', cinemaForm); ok('✅ Кинотеатр добавлен'); setCinemaForm({ name: '', address: '', city: '', contactPhone: '' }); loadData(); } catch (e) { fail('Ошибка'); }
  };

  // --- HALL CONSTRUCTOR ---
  const initConstructor = () => {
    const errors: Record<string, string> = {};
    if (!hallForm.cinemaId) errors.hallCinemaId = 'Выберите кинотеатр';
    if (!hallForm.hallName.trim()) errors.hallName = 'Укажите название зала';
    if (!hallForm.rows || Number(hallForm.rows) <= 0) errors.hallRows = 'Ряды должны быть > 0';
    if (!hallForm.cols || Number(hallForm.cols) <= 0) errors.hallCols = 'Места должны быть > 0';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const seats: ConstructorSeat[] = [];
    for (let r = 1; r <= hallForm.rows; r++) {
      for (let c = 1; c <= hallForm.cols; c++) {
        seats.push({ row: r, col: c, type: 'standard', isActive: true });
      }
    }
    setConstructorSeats(seats);
    setShowConstructor(true);
  };

  const toggleSeatActive = (row: number, col: number) => {
    setConstructorSeats(prev => prev.map(s => (s.row === row && s.col === col) ? { ...s, isActive: !s.isActive } : s));
  };

  const toggleSeatType = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    setConstructorSeats(prev => prev.map(s => (s.row === row && s.col === col) ? { ...s, type: s.type === 'standard' ? 'vip' : 'standard' } : s));
  };

  const handleHallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const activeSeats = constructorSeats.filter(s => s.isActive);
      await apiClient.post(`/cinemas/${hallForm.cinemaId}/halls`, {
        hallName: hallForm.hallName,
        rows: Number(hallForm.rows),
        cols: Number(hallForm.cols),
        seats: activeSeats
      });
      ok('✅ Зал создан!');
      setHallForm({ cinemaId: '', hallName: '', rows: 5, cols: 10 });
      setShowConstructor(false);
      loadData();
    } catch (e) {
      fail('Ошибка создания зала');
    }
  };

  const handleDeleteHall = async (hallId: number, hallName: string) => {
    const hallSessions = sessions.filter(s => s.hall?.hallId === hallId);
    let confirmMsg = `Вы действительно хотите удалить зал "${hallName}"?`;
    if (hallSessions.length > 0) {
      confirmMsg = `В зале "${hallName}" запланировано сеансов: ${hallSessions.length}.\nПри удалении зала все эти сеансы и забронированные билеты будут стерты безвозвратно!\n\nВы действительно хотите полностью удалить этот зал?`;
    }
    if (await showConfirm(confirmMsg, 'Удаление зала')) {
      try {
        await apiClient.delete(`/cinemas/halls/${hallId}`);
        ok(`✅ Зал "${hallName}" успешно удален`);
        loadData();
      } catch (e: any) {
        fail(e.response?.data?.message || 'Ошибка удаления зала');
      }
    }
  };

  // ── СЕАНСЫ ──
  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!sessionForm.movieId) errors.sessionMovieId = 'Выберите фильм';
    if (!sessionForm.hallId) errors.sessionHallId = 'Выберите зал';
    if (!sessionForm.startTime) {
      errors.sessionStartTime = 'Укажите время начала';
    } else {
      const selDate = new Date(sessionForm.startTime);
      const now = new Date();
      if (selDate < now) {
        errors.sessionStartTime = 'Дата и время сеанса не могут быть в прошлом';
      }
    }
    if (!sessionForm.price || Number(sessionForm.price) <= 0) errors.sessionPrice = 'Укажите корректную цену сеанса (>0)';
    if (sessionForm.vipMultiplier) {
      const mult = Number(sessionForm.vipMultiplier);
      if (isNaN(mult) || mult < 1 || mult > 10) {
        errors.sessionVipMultiplier = 'Коэффициент должен быть числом от 1 до 10';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      const data = {
        movieId: Number(sessionForm.movieId),
        hallId: Number(sessionForm.hallId),
        startTime: sessionForm.startTime,
        price: Number(sessionForm.price),
        vipMultiplier: Number(sessionForm.vipMultiplier || 1.5)
      };

      if (editSessionId) await apiClient.put(`/sessions/${editSessionId}`, data);
      else await apiClient.post('/sessions', data);
      ok('✅ Сеанс сохранен'); setSessionForm({ movieId: '', hallId: '', startTime: '', price: '', vipMultiplier: '1.5' }); setEditSessionId(null); loadData();
    } catch (e: any) { fail(e.response?.data?.message || 'Ошибка'); }
  };

  // ── ПОЛЬЗОВАТЕЛИ ──
  const toggleAdmin = async (id: number, current: string) => {
    try { const endpoint = current === 'Y' ? 'remove-admin' : 'make-admin'; await apiClient.patch(`/users/${id}/${endpoint}`); loadData(); ok('✅ Права изменены'); } catch (e) { fail('Ошибка'); }
  };

  // ── КОММЕНТАРИИ ──
  const fetchComments = async () => {
    if (!commentMovieId) return;
    try { const r = await apiClient.get(`/reviews/movie/${commentMovieId}/comments`); setComments(r.data); } catch { }
  };

  if (loading) return <Loader />;

  return (
    <div className="admin-container page-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 className="section-title" style={{ margin: 0, fontSize: '1.8rem' }}>⚙️ Администратор</h1>
        <div className="glass" style={{ padding: '4px', borderRadius: '12px', display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.02)', overflowX: 'auto' }}>
          {(['movies', 'genres', 'cinemas', 'sessions', 'users', 'stats', 'comments'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className="nav-link" style={{ border: 'none', background: tab === t ? 'var(--primary)' : 'transparent', color: tab === t ? '#fff' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, padding: '8px 14px', borderRadius: '10px' }}>
              {t === 'movies' ? 'ФИЛЬМЫ' : t === 'genres' ? 'ЖАНРЫ' : t === 'cinemas' ? 'КИНОТЕАТРЫ' : t === 'sessions' ? 'СЕАНСЫ' : t === 'users' ? 'ПОЛЬЗОВАТЕЛИ' : t === 'stats' ? 'СТАТИСТИКА' : 'КОММЕНТАРИИ'}
            </button>
          ))}
        </div>
      </div>

      {msg && <div className="glass" style={{ padding: '12px 24px', borderRadius: '12px', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', marginBottom: '24px' }}>{msg}</div>}
      {err && <div className="glass" style={{ padding: '12px 24px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--primary)', marginBottom: '24px' }}>{err}</div>}

       
      {tab === 'movies' && (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '32px' }}>
          <div className="glass card">
            <h3 style={{ marginBottom: '20px' }}>{editMovieId ? 'Редактировать' : 'Новый фильм'}</h3>
            <form onSubmit={handleMovieSubmit} noValidate style={{ display: 'grid', gap: '16px' }}>
              <Field label="Название">
                <input className="input-field" value={movieForm.title} onChange={e => { setMovieForm({ ...movieForm, title: e.target.value }); setFieldErrors(p => ({ ...p, movieTitle: '' })); }} />
                {fieldErrors.movieTitle && <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.movieTitle}</p>}
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Мин.">
                  <input className="input-field" type="number" min="1" max="900" value={movieForm.duration} onChange={e => { setMovieForm({ ...movieForm, duration: e.target.value }); setFieldErrors(p => ({ ...p, movieDuration: '' })); }} />
                  {fieldErrors.movieDuration && <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.movieDuration}</p>}
                </Field>
                <Field label="Рейтинг">
                  <CustomSelect
                    value={movieForm.ageRating}
                    onChange={val => setMovieForm({ ...movieForm, ageRating: val })}
                    options={[
                      { value: '0+', label: '0+' },
                      { value: '6+', label: '6+' },
                      { value: '12+', label: '12+' },
                      { value: '16+', label: '16+' },
                      { value: '18+', label: '18+' }
                    ]}
                  />
                </Field>
              </div>
              <Field label="Дата выпуска"><input className="input-field" type="date" max="9999-12-31" value={movieForm.releaseDate} onChange={e => setMovieForm({ ...movieForm, releaseDate: e.target.value })} /></Field>
              <Field label="Описание"><textarea className="input-field" style={{ minHeight: '80px' }} value={movieForm.description} onChange={e => setMovieForm({ ...movieForm, description: e.target.value })} /></Field>
              <Field label="Постер"><input type="file" accept="image/*" className="input-field" style={{ fontSize: '0.7rem' }} onChange={e => setPosterFile(e.target.files?.[0] || null)} /></Field>
              <Field label="Трейлер"><input type="file" accept="video/*" className="input-field" style={{ fontSize: '0.7rem' }} onChange={e => setTrailerFile(e.target.files?.[0] || null)} /></Field>
              <Field label="Жанры">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {genres.map(g => (
                    <label key={g.genreId} style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: movieForm.genreIds.includes(g.genreId) ? 'var(--primary)' : 'transparent', cursor: 'pointer' }}>
                      <input type="checkbox" style={{ display: 'none' }} checked={movieForm.genreIds.includes(g.genreId)} onChange={e => {
                        const ids = e.target.checked ? [...movieForm.genreIds, g.genreId] : movieForm.genreIds.filter(id => id !== g.genreId);
                        setMovieForm({ ...movieForm, genreIds: ids });
                        setFieldErrors(p => ({ ...p, movieGenres: '' }));
                      }} />{g.nameRu}
                    </label>
                  ))}
                </div>
                {fieldErrors.movieGenres && <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.movieGenres}</p>}
              </Field>
              <button className="btn btn--sm">{editMovieId ? 'Обновить' : 'Создать'}</button>
            </form>
          </div>
          <div className="glass card" style={{ padding: '0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {movies.map(m => (
                  <tr key={m.movieId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <img src={m.coverImage ? `/uploads/posters/${m.coverImage}` : `/api/movies/${m.movieId}/poster`} alt="" style={{ width: '40px', height: '56px', borderRadius: '6px', objectFit: 'cover' }} onError={e => (e.target as any).src = 'https://via.placeholder.com/40x56'} />
                        <div style={{ maxWidth: '300px' }}>
                          <div style={{ 
                            fontWeight: 600, 
                            fontSize: m.title.length > 25 ? '0.85rem' : m.title.length > 15 ? '0.92rem' : '1rem',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            lineHeight: 1.2
                          }}>
                            {m.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            ID: {m.movieId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button className="btn btn--sm btn--outline" style={{ marginRight: '8px' }} onClick={() => {
                        setEditMovieId(m.movieId);
                        setMovieForm({
                          title: m.title,
                          description: m.description || '',
                          duration: String(m.duration),
                          ageRating: m.ageRating || '',
                          releaseDate: m.releaseDate ? new Date(m.releaseDate).toISOString().split('T')[0] : '',
                          genreIds: m.genres?.map((g: any) => g.genreId) || []
                        });
                      }}>✏️</button>
                      <button className="btn btn--sm btn--outline" style={{ color: 'var(--primary)' }} onClick={async () => { if (await showConfirm('Вы действительно хотите удалить этот фильм?', 'Удаление')) { await apiClient.delete(`/movies/${m.movieId}`); loadData(); } }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

       
      {tab === 'genres' && (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '32px' }}>
          <div className="glass card">
            <h3 style={{ marginBottom: '20px' }}>Новый жанр</h3>
            <form onSubmit={handleGenreSubmit} noValidate style={{ display: 'grid', gap: '16px' }}>
              <Field label="RU">
                <input className="input-field" value={genreForm.nameRu} onChange={e => { setGenreForm({ ...genreForm, nameRu: e.target.value }); setFieldErrors(p => ({ ...p, genreNameRu: '' })); }} />
                {fieldErrors.genreNameRu && <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.genreNameRu}</p>}
              </Field>
              <Field label="EN"><input className="input-field" value={genreForm.nameEn} onChange={e => setGenreForm({ ...genreForm, nameEn: e.target.value })} /></Field>
              <button className="btn btn--sm">Добавить</button>
            </form>
          </div>
          <div className="glass card" style={{ padding: '0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {genres.map(g => (
                  <tr key={g.genreId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '12px 24px' }}>{g.nameRu} <span style={{ opacity: 0.5 }}>({g.nameEn})</span></td>
                    <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                      <button className="btn btn--sm btn--outline" style={{ color: 'var(--primary)' }} onClick={async () => { if (await showConfirm(`Вы действительно хотите удалить жанр "${g.nameRu}"?`, 'Удаление')) { await apiClient.delete(`/genres/${g.genreId}`); loadData(); } }}>Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

       
      {tab === 'cinemas' && (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '32px' }}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div className="glass card">
              <h3 style={{ marginBottom: '16px' }}>Кинотеатр</h3>
              <form onSubmit={handleCinemaSubmit} noValidate style={{ display: 'grid', gap: '12px' }}>
                <Field label="Название">
                  <input className="input-field" value={cinemaForm.name} onChange={e => { setCinemaForm({ ...cinemaForm, name: e.target.value }); setFieldErrors(p => ({ ...p, cinemaName: '' })); }} />
                  {fieldErrors.cinemaName && <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.cinemaName}</p>}
                </Field>
                <Field label="Адрес">
                  <input className="input-field" value={cinemaForm.address} onChange={e => { setCinemaForm({ ...cinemaForm, address: e.target.value }); setFieldErrors(p => ({ ...p, cinemaAddress: '' })); }} />
                  {fieldErrors.cinemaAddress && <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.cinemaAddress}</p>}
                </Field>
                <Field label="Телефон"><input className="input-field" value={cinemaForm.contactPhone} onChange={e => setCinemaForm({ ...cinemaForm, contactPhone: e.target.value })} /></Field>
                <button className="btn btn--sm">Создать</button>
              </form>
            </div>
            <div className="glass card">
              <h3 style={{ marginBottom: '16px' }}>Новый зал</h3>
              {!showConstructor ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                  <Field label="Кинотеатр">
                    <CustomSelect
                      value={hallForm.cinemaId}
                      onChange={val => { setHallForm({ ...hallForm, cinemaId: val }); setFieldErrors(p => ({ ...p, hallCinemaId: '' })); }}
                      options={[
                        { value: '', label: 'Выберите' },
                        ...cinemas.map(c => ({ value: String(c.cinemaId), label: c.name }))
                      ]}
                    />
                    {fieldErrors.hallCinemaId && <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.hallCinemaId}</p>}
                  </Field>
                  <Field label="Название зала">
                    <input className="input-field" value={hallForm.hallName} onChange={e => { setHallForm({ ...hallForm, hallName: e.target.value }); setFieldErrors(p => ({ ...p, hallName: '' })); }} />
                    {fieldErrors.hallName && <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.hallName}</p>}
                  </Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <Field label="Ряды">
                      <input type="number" className="input-field" value={hallForm.rows} onChange={e => { setHallForm({ ...hallForm, rows: Number(e.target.value) }); setFieldErrors(p => ({ ...p, hallRows: '' })); }} />
                      {fieldErrors.hallRows && <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.hallRows}</p>}
                    </Field>
                    <Field label="Места">
                      <input type="number" className="input-field" value={hallForm.cols} onChange={e => { setHallForm({ ...hallForm, cols: Number(e.target.value) }); setFieldErrors(p => ({ ...p, hallCols: '' })); }} />
                      {fieldErrors.hallCols && <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.hallCols}</p>}
                    </Field>
                  </div>
                  <button className="btn btn--sm btn--outline" onClick={initConstructor}>Открыть конструктор</button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    🖱️ ЛКМ: Место / Пусто<br />🖱️ ПКМ: Standard / VIP
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${hallForm.cols}, 20px)`,
                    gap: '4px',
                    justifyContent: 'center',
                    marginBottom: '24px',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '12px',
                    borderRadius: '12px',
                    overflowX: 'auto'
                  }}>
                    {constructorSeats.map((s, i) => (
                      <div
                        key={i}
                        onClick={() => toggleSeatActive(s.row, s.col)}
                        onContextMenu={(e) => toggleSeatType(e, s.row, s.col)}
                        style={{
                          width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer',
                          background: !s.isActive ? 'transparent' : s.type === 'vip' ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
                          border: s.isActive ? 'none' : '1px dashed rgba(255,255,255,0.1)'
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn--sm" style={{ flex: 1 }} onClick={handleHallSubmit}>Создать</button>
                    <button className="btn btn--sm btn--outline" style={{ flex: 1 }} onClick={() => setShowConstructor(false)}>Назад</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="glass card" style={{ padding: '0' }}>
            {cinemas.map(c => (
              <div key={c.cinemaId} style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      ID: {c.cinemaId} · {c.city}, {c.address}
                    </div>
                  </div>
                  <button className="btn btn--sm btn--outline" style={{ color: 'var(--primary)', padding: '8px' }} onClick={async () => { if (await showConfirm(`Вы действительно хотите удалить кинотеатр "${c.name}"?`, 'Удаление')) { await apiClient.delete(`/cinemas/${c.cinemaId}`); loadData(); } }}>🗑️</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                  {c.halls?.map((h: any) => (
                    <span key={h.hallId} className="glass" style={{
                      fontSize: '0.7rem',
                      padding: '6px 36px 6px 12px',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      background: 'rgba(255,255,255,0.02)',
                      position: 'relative'
                    }}>
                      <strong style={{ color: '#fff' }}>{h.hallName}</strong>
                      <span style={{ opacity: 0.5, fontSize: '0.6rem' }}>ID: {h.hallId} · {h.rows}×{h.cols}</span>
                      <button
                        onClick={() => handleDeleteHall(h.hallId, h.hallName)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          padding: '4px',
                          lineHeight: 1
                        }}
                        title="Удалить зал"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

       
      {tab === 'sessions' && (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '32px' }}>
          <div className="glass card">
            <h3 style={{ marginBottom: '20px' }}>Сеанс</h3>
            <form onSubmit={handleSessionSubmit} noValidate style={{ display: 'grid', gap: '16px' }}>
              <Field label="Фильм">
                <CustomSelect
                  value={sessionForm.movieId}
                  onChange={val => { setSessionForm({ ...sessionForm, movieId: val }); setFieldErrors(p => ({ ...p, sessionMovieId: '' })); }}
                  options={[
                    { value: '', label: 'Выберите' },
                    ...movies.map(m => ({ value: String(m.movieId), label: m.title }))
                  ]}
                />
                {fieldErrors.sessionMovieId && <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.sessionMovieId}</p>}
              </Field>
              <Field label="Зал">
                <CustomSelect
                  value={sessionForm.hallId}
                  onChange={val => { setSessionForm({ ...sessionForm, hallId: val }); setFieldErrors(p => ({ ...p, sessionHallId: '' })); }}
                  options={[
                    { value: '', label: 'Выберите' },
                    ...cinemas.flatMap(c => c.halls.map((h: any) => ({ value: String(h.hallId), label: `${c.name} — ${h.hallName}` })))
                  ]}
                />
                {fieldErrors.sessionHallId && <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.sessionHallId}</p>}
              </Field>
              <Field label="Начало">
                <input 
                  type="datetime-local" 
                  min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} 
                  max="9999-12-31T23:59" 
                  className="input-field" 
                  value={sessionForm.startTime} 
                  onChange={e => { setSessionForm({ ...sessionForm, startTime: e.target.value }); setFieldErrors(p => ({ ...p, sessionStartTime: '' })); }} 
                />
                {fieldErrors.sessionStartTime && <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.sessionStartTime}</p>}
              </Field>
              <Field label="Цена">
                <input type="number" className="input-field" value={sessionForm.price} onChange={e => { setSessionForm({ ...sessionForm, price: e.target.value }); setFieldErrors(p => ({ ...p, sessionPrice: '' })); }} />
                {fieldErrors.sessionPrice && <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.sessionPrice}</p>}
              </Field>
              <Field label="Коэффициент VIP">
                <input 
                  type="number" 
                  step="0.1" 
                  min="1" 
                  max="10" 
                  className="input-field" 
                  value={sessionForm.vipMultiplier} 
                  onChange={e => { setSessionForm({ ...sessionForm, vipMultiplier: e.target.value }); setFieldErrors(p => ({ ...p, sessionVipMultiplier: '' })); }} 
                />
                {fieldErrors.sessionVipMultiplier && <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.sessionVipMultiplier}</p>}
              </Field>
              <button className="btn btn--sm">{editSessionId ? 'Сохранить' : 'Создать'}</button>
            </form>
          </div>
          <div className="glass card" style={{ padding: '0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.sessionId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600 }}>{s.movie?.title}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                        {new Date(s.startTime).toLocaleString('ru-RU', { year: 'numeric', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })} · {s.hall?.hallName}
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button className="btn btn--sm btn--outline" style={{ marginRight: '8px' }} onClick={() => {
                        setEditSessionId(s.sessionId);
                        // Форматируем дату для datetime-local (YYYY-MM-DDTHH:mm)
                        const d = new Date(s.startTime);
                        const tzOffset = d.getTimezoneOffset() * 60000;
                        const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);

                        setSessionForm({
                          movieId: String(s.movie?.movieId),
                          hallId: String(s.hall?.hallId),
                          startTime: localISOTime,
                          price: String(s.price),
                          vipMultiplier: String(s.vipMultiplier || 1.5)
                        });
                      }}>✏️</button>
                      <button className="btn btn--sm btn--outline" style={{ color: 'var(--primary)' }} onClick={async () => { if (await showConfirm('Вы действительно хотите удалить этот сеанс?', 'Удаление')) { await apiClient.delete(`/sessions/${s.sessionId}`); loadData(); } }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

       
      {tab === 'users' && (
        <div className="glass card" style={{ padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {users.map(u => (
                <tr key={u.userId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '16px 20px' }}><strong>{u.login}</strong><br /><span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{u.email}</span></td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button className="btn btn--sm btn--outline" style={{ marginRight: '8px', color: u.isAdmin === 'Y' ? '#fbbf24' : '#fff' }} onClick={() => toggleAdmin(u.userId, u.isAdmin)}>{u.isAdmin === 'Y' ? 'Снять админа' : 'Сделать админом'}</button>
                    <button className="btn btn--sm btn--outline" style={{ color: 'var(--primary)' }} onClick={async () => { if (await showConfirm(`Вы действительно хотите удалить пользователя "${u.login}"?`, 'Удаление')) { await apiClient.delete(`/users/${u.userId}`); loadData(); } }}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

       
      {tab === 'stats' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <div className="glass card" style={{ textAlign: 'center' }}><p style={{ fontSize: '0.7rem', opacity: 0.6 }}>БИЛЕТЫ</p><p style={{ fontSize: '3rem', fontWeight: 800 }}>{stats.totalTickets}</p></div>
          <div className="glass card" style={{ textAlign: 'center' }}><p style={{ fontSize: '0.7rem', opacity: 0.6 }}>ВЫРУЧКА</p><p style={{ fontSize: '3rem', fontWeight: 800, color: '#4ade80' }}>{stats.totalRevenue} BYN</p></div>
          <div className="glass card"><p style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '16px' }}>ТОП ПРОДАЖ</p>{stats.topMovies?.map((m: any, i: number) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>{m.title}</span><span style={{ fontWeight: 800, color: 'var(--primary)' }}>{m.ticketCount}</span></div>))}</div>
        </div>
      )}

       
      {tab === 'comments' && (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '32px' }}>
          <div className="glass card">
            <Field label="ID фильма"><input type="number" className="input-field" value={commentMovieId} onChange={e => setCommentMovieId(e.target.value)} /></Field>
            <button className="btn btn--sm" onClick={fetchComments}>Загрузить</button>
          </div>
          <div className="glass card" style={{ padding: '0' }}>
            {comments.map((c: any) => (<div key={c.commentId} style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)' }}><strong>{c.user?.login}</strong><p style={{ margin: '8px 0' }}>{c.commentText}</p><button className="btn btn--sm btn--outline" style={{ color: 'var(--primary)' }} onClick={async () => { if (await showConfirm('Вы действительно хотите удалить этот комментарий?', 'Удаление')) { await apiClient.delete(`/reviews/comments/${c.commentId}`); fetchComments(); } }}>Удалить</button></div>))}
          </div>
        </div>
      )}
    </div>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="input-group" style={{ marginBottom: '10px' }}><label style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', display: 'block' }}>{label}</label>{children}</div>
);
