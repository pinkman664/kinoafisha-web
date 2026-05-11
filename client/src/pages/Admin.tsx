import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

type Tab = 'movies' | 'cinemas' | 'sessions' | 'genres' | 'users' | 'stats' | 'comments';

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('movies');

  // Данные
  const [movies, setMovies] = useState<any[]>([]);
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Формы
  const [movieForm, setMovieForm] = useState({ title: '', description: '', duration: '', ageRating: '', releaseDate: '', genreIds: [] as number[] });
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [trailerFile, setTrailerFile] = useState<File | null>(null);
  const [editMovieId, setEditMovieId] = useState<number | null>(null);

  const [cinemaForm, setCinemaForm] = useState({ name: '', address: '', city: '', contactPhone: '' });
  const [hallForm, setHallForm] = useState({ cinemaId: '', hallName: '', rows: '5', cols: '10' });
  const [sessionForm, setSessionForm] = useState({ movieId: '', hallId: '', startTime: '', price: '' });
  const [editSessionId, setEditSessionId] = useState<number | null>(null);
  const [genreForm, setGenreForm] = useState({ nameRu: '', nameEn: '' });
  const [commentMovieId, setCommentMovieId] = useState('');

  const [posterPreview, setPosterPreview] = useState<string | null>(null);

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  // Проверка прав: только Администратор
  useEffect(() => {
    apiClient.get('/users/profile')
      .then(r => { if (r.data.isAdmin !== 'Y') navigate('/'); })
      .catch(() => navigate('/login'));
  }, [navigate]);

  // Загрузка данных при смене вкладки
  useEffect(() => {
    const load = async () => {
      try {
        if (tab === 'movies' || tab === 'genres') { const r = await apiClient.get('/genres'); setGenres(r.data); }
        if (tab === 'movies') { const r = await apiClient.get('/movies'); setMovies(r.data); }
        if (tab === 'cinemas') { const r = await apiClient.get('/cinemas'); setCinemas(r.data); }
        if (tab === 'users') { const r = await apiClient.get('/users'); setUsers(r.data); }
        if (tab === 'sessions') { const r = await apiClient.get('/sessions'); setSessions(r.data); }
        if (tab === 'stats') {
          try {
            const r = await apiClient.get('/tickets/stats');
            setStats(r.data || { totalTickets: 0, totalRevenue: 0, topMovies: [] });
          } catch (e) {
            setStats({ totalTickets: 0, totalRevenue: 0, topMovies: [] });
            throw e;
          }
        }
      } catch (e) {
        console.error('Ошибка загрузки вкладки:', tab, e);
      }
    };
    load();
  }, [tab]);

  const ok = (m: string) => { setMsg(m); setErr(''); setTimeout(() => setMsg(''), 3000); };
  const fail = (e: any) => { setErr(e?.response?.data?.message || 'Ошибка'); setTimeout(() => setErr(''), 4000); };

  // ── Фильмы ──
  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(movieForm).forEach(([k, v]) => { 
        if (k === 'genreIds') fd.append(k, JSON.stringify(v));
        else if (v) fd.append(k, k === 'duration' ? String(Number(v)) : (v as string)); 
      });
      if (posterFile) fd.append('coverImage', posterFile);
      if (trailerFile) fd.append('trailer', trailerFile);
      if (editMovieId) {
        await apiClient.put(`/movies/${editMovieId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        ok('✅ Фильм обновлён!');
        setEditMovieId(null);
      } else {
        await apiClient.post('/movies', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        ok('✅ Фильм добавлен!');
      }
      setMovieForm({ title: '', description: '', duration: '', ageRating: '', releaseDate: '', genreIds: [] });
      setPosterFile(null);
      setTrailerFile(null);
      setPosterPreview(null);
      const r = await apiClient.get('/movies'); setMovies(r.data);
    } catch (e) { fail(e); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      setPosterPreview(URL.createObjectURL(file));
    }
  };

  const handleEditMovie = (m: any) => {
    setEditMovieId(m.movieId);
    setMovieForm({ 
      title: m.title, 
      description: m.description || '', 
      duration: String(m.duration), 
      ageRating: m.ageRating || '', 
      releaseDate: m.releaseDate ? m.releaseDate.split('T')[0] : '',
      genreIds: m.genres?.map((g: any) => g.genreId) || []
    });
    setTab('movies');
  };

  const handleDeleteMovie = async (id: number) => {
    if (!confirm('Удалить фильм?')) return;
    try { await apiClient.delete(`/movies/${id}`); setMovies(p => p.filter(m => m.movieId !== id)); ok('✅ Удалён'); } catch (e) { fail(e); }
  };

  // ── Жанры ──
  const handleCreateGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/genres', genreForm);
      ok('✅ Жанр добавлен!');
      setGenreForm({ nameRu: '', nameEn: '' });
      const r = await apiClient.get('/genres'); setGenres(r.data);
    } catch (e) { fail(e); }
  };

  const handleDeleteGenre = async (id: number) => {
    if (!confirm('Удалить жанр?')) return;
    try { await apiClient.delete(`/genres/${id}`); setGenres(p => p.filter(g => g.genreId !== id)); ok('✅ Удалён'); } catch (e) { fail(e); }
  };

  // ── Кинотеатры ──
  const handleCreateCinema = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/cinemas', cinemaForm);
      ok('✅ Кинотеатр добавлен!');
      setCinemaForm({ name: '', address: '', city: '', contactPhone: '' });
      const r = await apiClient.get('/cinemas'); setCinemas(r.data);
    } catch (e) { fail(e); }
  };

  const handleDeleteCinema = async (id: number) => {
    if (!confirm('Удалить кинотеатр?')) return;
    try { await apiClient.delete(`/cinemas/${id}`); setCinemas(p => p.filter(c => c.cinemaId !== id)); ok('✅ Удалён'); } catch (e) { fail(e); }
  };

  const handleCreateHall = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post(`/cinemas/${hallForm.cinemaId}/halls`, {
        hallName: hallForm.hallName,
        rows: Number(hallForm.rows),
        cols: Number(hallForm.cols)
      });
      ok(`✅ Зал "${hallForm.hallName}" создан (${Number(hallForm.rows) * Number(hallForm.cols)} мест)`);
      setHallForm({ cinemaId: '', hallName: '', rows: '5', cols: '10' });
    } catch (e) { fail(e); }
  };

  // ── Сеансы ──
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        movieId: Number(sessionForm.movieId),
        hallId: Number(sessionForm.hallId),
        startTime: sessionForm.startTime,
        price: Number(sessionForm.price)
      };

      if (editSessionId) {
        await apiClient.put(`/sessions/${editSessionId}`, data);
        ok('✅ Сеанс обновлён!');
        setEditSessionId(null);
      } else {
        await apiClient.post('/sessions', data);
        ok('✅ Сеанс создан!');
      }
      setSessionForm({ movieId: '', hallId: '', startTime: '', price: '' });
      const r = await apiClient.get('/sessions'); setSessions(r.data);
    } catch (e) { fail(e); }
  };

  const handleEditSession = (s: any) => {
    setEditSessionId(s.sessionId);
    // Преобразуем дату для input datetime-local
    const date = new Date(s.startTime);
    const dateStr = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    setSessionForm({
      movieId: String(s.movie?.movieId || ''),
      hallId: String(s.hall?.hallId || ''),
      startTime: dateStr,
      price: String(s.price)
    });
    setTab('sessions');
  };

  const handleDeleteSession = async (id: number) => {
    if (!confirm('Удалить сеанс?')) return;
    try { await apiClient.delete(`/sessions/${id}`); setSessions(p => p.filter(s => s.sessionId !== id)); ok('✅ Удалён'); } catch (e) { fail(e); }
  };

  // ── Пользователи ──
  const handleMakeAdmin = async (id: number) => {
    try { await apiClient.patch(`/users/${id}/make-admin`); const r = await apiClient.get('/users'); setUsers(r.data); ok('✅ Права выданы'); } catch (e) { fail(e); }
  };

  const handleRemoveAdmin = async (id: number) => {
    try { await apiClient.patch(`/users/${id}/remove-admin`); const r = await apiClient.get('/users'); setUsers(r.data); ok('✅ Права сняты'); } catch (e) { fail(e); }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Удалить пользователя?')) return;
    try { await apiClient.delete(`/users/${id}`); setUsers(p => p.filter(u => u.userId !== id)); ok('✅ Удалён'); } catch (e) { fail(e); }
  };

  // ── Комментарии ──
  const loadComments = async () => {
    if (!commentMovieId) return;
    try { const r = await apiClient.get(`/reviews/movie/${commentMovieId}/comments`); setComments(r.data); } catch { }
  };

  const handleDeleteComment = async (commentId: number) => {
    try { await apiClient.delete(`/reviews/comments/${commentId}`); setComments(p => p.filter(c => c.commentId !== commentId)); ok('✅ Комментарий удалён'); } catch (e) { fail(e); }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'movies', label: '🎬 Фильмы' },
    { id: 'genres', label: '🏷 Жанры' },
    { id: 'cinemas', label: '🏛 Кинотеатры' },
    { id: 'sessions', label: '🕐 Сеансы' },
    { id: 'users', label: '👥 Пользователи' },
    { id: 'stats', label: '📊 Статистика' },
    { id: 'comments', label: '💬 Комментарии' },
  ];

  return (
    <div className="profile-page">
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="logo">🎬 Киноафиша</Link>
          <nav className="header-nav">
            <Link to="/profile" className="nav-link">Профиль</Link>
            <button className="nav-link" style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-muted)' }}
              onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>Выйти</button>
          </nav>
        </div>
      </header>

      <main className="profile-main" style={{ maxWidth: '950px' }}>
        <h1 className="section-title" style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>⚙ Панель администратора</h1>

        {msg && <div className="admin-alert admin-alert--ok">{msg}</div>}
        {err && <div className="admin-alert admin-alert--err">{err}</div>}

        {/* Вкладки */}
        <div className="admin-tabs">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`admin-tab ${tab === t.id ? 'active' : ''}`}>{t.label}</button>
          ))}
        </div>

        {/* ── ФИЛЬМЫ ── */}
        {tab === 'movies' && (
          <div>
            <div className="profile-card">
              <h3 style={{ marginBottom: '1.2rem' }}>{editMovieId ? `Редактирование фильма #${editMovieId}` : 'Добавить фильм'}</h3>
              <form onSubmit={handleCreateMovie}>
                <div className="grid-2">
                  <Field label="Название *"><input className="input-field" value={movieForm.title} onChange={e => setMovieForm({ ...movieForm, title: e.target.value })} required /></Field>
                  <Field label="Длительность (мин) *"><input className="input-field" type="number" value={movieForm.duration} onChange={e => setMovieForm({ ...movieForm, duration: e.target.value })} required /></Field>
                  <Field label="Возрастной рейтинг"><input className="input-field" placeholder="16" value={movieForm.ageRating} onChange={e => setMovieForm({ ...movieForm, ageRating: e.target.value })} /></Field>
                  <Field label="Дата выхода"><input className="input-field" type="date" value={movieForm.releaseDate} onChange={e => setMovieForm({ ...movieForm, releaseDate: e.target.value })} /></Field>
                </div>
                <Field label="Описание"><textarea className="input-field textarea" value={movieForm.description} onChange={e => setMovieForm({ ...movieForm, description: e.target.value })} /></Field>
                <Field label="Постер (изображение)">
                  <input className="input-field" type="file" accept="image/*" style={{ padding: '10px' }} onChange={handleFileChange} />
                  {posterPreview && (
                    <div style={{ marginTop: '10px' }}>
                      <img src={posterPreview} alt="Preview" style={{ maxWidth: '150px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    </div>
                  )}
                </Field>
                <Field label="Трейлер (видео MP4)">
                  <input className="input-field" type="file" accept="video/mp4" style={{ padding: '10px' }} onChange={e => setTrailerFile(e.target.files?.[0] || null)} />
                  {trailerFile && <p className="ticket-meta">✅ Файл выбран: {trailerFile.name}</p>}
                </Field>

                <Field label="Жанры">
                  <div className="genre-selection" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '5px' }}>
                    {genres.map(g => (
                      <label key={g.genreId} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', cursor: 'pointer', background: 'var(--bg-card)', padding: '5px 10px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                        <input 
                          type="checkbox" 
                          checked={movieForm.genreIds.includes(g.genreId)}
                          onChange={e => {
                            const newIds = e.target.checked 
                              ? [...movieForm.genreIds, g.genreId]
                              : movieForm.genreIds.filter(id => id !== g.genreId);
                            setMovieForm({ ...movieForm, genreIds: newIds });
                          }}
                        />
                        {g.nameRu}
                      </label>
                    ))}
                  </div>
                </Field>

                <div style={{ display: 'flex', gap: '.8rem' }}>
                  <button type="submit" className="btn" style={{ width: 'auto', padding: '12px 24px' }}>{editMovieId ? 'Сохранить изменения' : 'Добавить фильм'}</button>
                  {editMovieId && <button type="button" className="btn btn--outline" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => { setEditMovieId(null); setMovieForm({ title: '', description: '', duration: '', ageRating: '', releaseDate: '', genreIds: [] }); }}>Отмена</button>}
                </div>
              </form>
            </div>

            <h3 className="section-title" style={{ marginTop: '1.5rem' }}>Список фильмов ({movies.length})</h3>
            <div className="admin-list">
              {movies.length === 0 && <p className="muted">Нет фильмов</p>}
              {movies.map(m => (
                <div key={m.movieId} className="admin-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '60px', background: 'var(--panel-bg2)', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <img 
                        src={`/api/movies/${m.movieId}/poster`} 
                        alt="" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as any).style.display = 'none'; (e.target as any).parentElement.innerHTML = '🎬'; }}
                      />
                    </div>
                    <div>
                      <div className="ticket-movie">{m.title}</div>
                      <div className="ticket-meta">⏱ {m.duration} мин · ID: {m.movieId}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button className="btn btn--sm btn--outline" onClick={() => handleEditMovie(m)}>✏ Изменить</button>
                    <button className="btn btn--sm btn--danger" onClick={() => handleDeleteMovie(m.movieId)}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ЖАНРЫ ── */}
        {tab === 'genres' && (
          <div>
            <div className="profile-card">
              <h3 style={{ marginBottom: '1.2rem' }}>Добавить жанр</h3>
              <form onSubmit={handleCreateGenre}>
                <div className="grid-2">
                  <Field label="Название (рус) *"><input className="input-field" placeholder="Боевик" value={genreForm.nameRu} onChange={e => setGenreForm({ ...genreForm, nameRu: e.target.value })} required /></Field>
                  <Field label="Название (eng)"><input className="input-field" placeholder="Action" value={genreForm.nameEn} onChange={e => setGenreForm({ ...genreForm, nameEn: e.target.value })} /></Field>
                </div>
                <button type="submit" className="btn" style={{ width: 'auto', padding: '12px 24px' }}>Добавить жанр</button>
              </form>
            </div>
            <div className="admin-list" style={{ marginTop: '1.5rem' }}>
              {genres.map(g => (
                <div key={g.genreId} className="admin-row">
                  <div><span className="ticket-movie">{g.nameRu}</span>{g.nameEn && <span className="ticket-meta"> / {g.nameEn}</span>}</div>
                  <button className="btn btn--sm btn--danger" onClick={() => handleDeleteGenre(g.genreId)}>Удалить</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── КИНОТЕАТРЫ ── */}
        {tab === 'cinemas' && (
          <div>
            <div className="profile-card">
              <h3 style={{ marginBottom: '1.2rem' }}>Добавить кинотеатр</h3>
              <form onSubmit={handleCreateCinema}>
                <div className="grid-2">
                  <Field label="Название *"><input className="input-field" value={cinemaForm.name} onChange={e => setCinemaForm({ ...cinemaForm, name: e.target.value })} required /></Field>
                  <Field label="Город"><input className="input-field" value={cinemaForm.city} onChange={e => setCinemaForm({ ...cinemaForm, city: e.target.value })} /></Field>
                  <Field label="Адрес"><input className="input-field" value={cinemaForm.address} onChange={e => setCinemaForm({ ...cinemaForm, address: e.target.value })} /></Field>
                  <Field label="Телефон"><input className="input-field" value={cinemaForm.contactPhone} onChange={e => setCinemaForm({ ...cinemaForm, contactPhone: e.target.value })} /></Field>
                </div>
                <button type="submit" className="btn" style={{ width: 'auto', padding: '12px 24px' }}>Добавить</button>
              </form>
            </div>

            <div className="profile-card" style={{ marginTop: '1.2rem' }}>
              <h3 style={{ marginBottom: '1.2rem' }}>Создать зал</h3>
              <form onSubmit={handleCreateHall}>
                <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                  <Field label="ID кинотеатра *"><input className="input-field" type="number" value={hallForm.cinemaId} onChange={e => setHallForm({ ...hallForm, cinemaId: e.target.value })} required /></Field>
                  <Field label="Название зала *"><input className="input-field" value={hallForm.hallName} onChange={e => setHallForm({ ...hallForm, hallName: e.target.value })} required /></Field>
                  <Field label="Рядов *"><input className="input-field" type="number" value={hallForm.rows} onChange={e => setHallForm({ ...hallForm, rows: e.target.value })} required /></Field>
                  <Field label="Мест в ряду *"><input className="input-field" type="number" value={hallForm.cols} onChange={e => setHallForm({ ...hallForm, cols: e.target.value })} required /></Field>
                </div>
                <button type="submit" className="btn" style={{ width: 'auto', padding: '12px 24px' }}>Создать зал</button>
              </form>
            </div>

            <div className="admin-list" style={{ marginTop: '1.5rem' }}>
              {cinemas.map(c => (
                <div key={c.cinemaId} className="cinema-group" style={{ marginBottom: '1.5rem' }}>
                  <div className="admin-row">
                    <div><div className="ticket-movie">{c.name}</div><div className="ticket-meta">📍 {c.city}, {c.address} · ID: {c.cinemaId}</div></div>
                    <button className="btn btn--sm btn--danger" onClick={() => handleDeleteCinema(c.cinemaId)}>Удалить</button>
                  </div>
                  {c.halls && c.halls.length > 0 && (
                    <div className="halls-list" style={{ marginLeft: '1.5rem', marginTop: '0.5rem', borderLeft: '2px solid var(--border)', paddingLeft: '1rem' }}>
                      <p className="muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Залы:</p>
                      {c.halls.map((h: any) => (
                        <div key={h.hallId} className="admin-row" style={{ padding: '8px 0', borderBottom: 'none' }}>
                          <div className="ticket-meta">🎬 {h.hallName} · Вместимость: {h.capacity} · ID: {h.hallId}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── СЕАНСЫ ── */}
        {tab === 'sessions' && (
          <div>
            <div className="profile-card">
              <h3 style={{ marginBottom: '1.2rem' }}>{editSessionId ? `Редактирование сеанса #${editSessionId}` : 'Создать сеанс'}</h3>
              <form onSubmit={handleCreateSession}>
                <div className="grid-2">
                  <Field label="ID фильма *"><input className="input-field" type="number" value={sessionForm.movieId} onChange={e => setSessionForm({ ...sessionForm, movieId: e.target.value })} required /></Field>
                  <Field label="ID зала *"><input className="input-field" type="number" value={sessionForm.hallId} onChange={e => setSessionForm({ ...sessionForm, hallId: e.target.value })} required /></Field>
                  <Field label="Дата и время *"><input className="input-field" type="datetime-local" value={sessionForm.startTime} onChange={e => setSessionForm({ ...sessionForm, startTime: e.target.value })} required /></Field>
                  <Field label="Цена (руб.) *"><input className="input-field" type="number" step="0.01" value={sessionForm.price} onChange={e => setSessionForm({ ...sessionForm, price: e.target.value })} required /></Field>
                </div>
                <div style={{ display: 'flex', gap: '.8rem' }}>
                  <button type="submit" className="btn" style={{ width: 'auto', padding: '12px 24px' }}>{editSessionId ? 'Сохранить изменения' : 'Создать сеанс'}</button>
                  {editSessionId && <button type="button" className="btn btn--outline" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => { setEditSessionId(null); setSessionForm({ movieId: '', hallId: '', startTime: '', price: '' }); }}>Отмена</button>}
                </div>
              </form>
              <div style={{ marginTop: '1rem', padding: '12px', background: 'rgba(244,63,94,.05)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '.88rem', margin: 0 }}>
                  💡 ID фильма и зала смотри во вкладках «Фильмы» и «Кинотеатры»
                </p>
              </div>
            </div>

            <h3 className="section-title" style={{ marginTop: '1.5rem' }}>Список сеансов ({sessions.length})</h3>
            <div className="admin-list">
              {sessions.length === 0 && <p className="muted">Нет сеансов</p>}
              {sessions.map(s => (
                <div key={s.sessionId} className="admin-row">
                  <div>
                    <div className="ticket-movie">{s.movie?.title}</div>
                    <div className="ticket-meta">
                      🕐 {new Date(s.startTime).toLocaleString('ru-RU')} · 🏛 {s.hall?.cinema?.name} ({s.hall?.hallName})
                    </div>
                    <div className="ticket-meta">Цена: {s.price} руб. · ID: {s.sessionId}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button className="btn btn--sm btn--outline" onClick={() => handleEditSession(s)}>✏ Изменить</button>
                    <button className="btn btn--sm btn--danger" onClick={() => handleDeleteSession(s.sessionId)}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ПОЛЬЗОВАТЕЛИ ── */}
        {tab === 'users' && (
          <div>
            <h3 className="section-title">Пользователи ({users.length})</h3>
            <div className="admin-list">
              {users.map(u => (
                <div key={u.userId} className="admin-row">
                  <div>
                    <div className="ticket-movie">{u.login} {u.isAdmin === 'Y' && <span style={{ color: '#fbbf24', fontSize: '.8rem' }}>★ Админ</span>}</div>
                    <div className="ticket-meta">{u.email} · ID: {u.userId}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                    {u.isAdmin !== 'Y'
                      ? <button className="btn btn--sm btn--outline" onClick={() => handleMakeAdmin(u.userId)}>Сделать админом</button>
                      : <button className="btn btn--sm btn--outline" onClick={() => handleRemoveAdmin(u.userId)}>Снять права</button>
                    }
                    <button className="btn btn--sm btn--danger" onClick={() => handleDeleteUser(u.userId)}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── СТАТИСТИКА ── */}
        {tab === 'stats' && (
          <div>
            {stats ? (
              <>
                <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                  <div className="profile-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.totalTickets}</div>
                    <div style={{ color: 'var(--text-muted)' }}>Продано билетов</div>
                  </div>
                  <div className="profile-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 800, color: '#22c55e' }}>{stats.totalRevenue} <span style={{ fontSize: '1.5rem' }}>руб.</span></div>
                    <div style={{ color: 'var(--text-muted)' }}>Общая выручка</div>
                  </div>
                </div>
                <h3 className="section-title">Топ фильмов по продажам</h3>
                <div className="admin-list">
                  {stats.topMovies?.map((m: any, i: number) => (
                    <div key={i} className="admin-row">
                      <div>
                        <div className="ticket-movie">{i + 1}. {m.title}</div>
                        <div className="ticket-meta">Выручка: {parseFloat(m.revenue || 0).toFixed(2)} руб.</div>
                      </div>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{m.ticketCount} шт.</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="muted">Загрузка...</p>}
          </div>
        )}

        {/* ── КОММЕНТАРИИ ── */}
        {tab === 'comments' && (
          <div>
            <div className="profile-card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Загрузить комментарии фильма</h3>
              <div style={{ display: 'flex', gap: '.8rem' }}>
                <input className="input-field" type="number" placeholder="ID фильма" style={{ maxWidth: '200px', margin: 0 }}
                  value={commentMovieId} onChange={e => setCommentMovieId(e.target.value)} />
                <button className="btn" style={{ width: 'auto', padding: '12px 24px' }} onClick={loadComments}>Загрузить</button>
              </div>
            </div>
            <div className="admin-list">
              {comments.length === 0 && <p className="muted">Введите ID фильма и нажмите «Загрузить»</p>}
              {comments.map((c: any) => (
                <div key={c.commentId} className="admin-row">
                  <div>
                    <div className="ticket-movie">👤 {c.user?.login}</div>
                    <div className="ticket-meta">{c.commentText}</div>
                    <div className="ticket-meta" style={{ fontSize: '.78rem' }}>{new Date(c.commentDate).toLocaleDateString('ru-RU')}</div>
                  </div>
                  <button className="btn btn--sm btn--danger" onClick={() => handleDeleteComment(c.commentId)}>Удалить</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="input-group"><label>{label}</label>{children}</div>
);
