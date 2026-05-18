import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { Loader } from '../components/Layout';
import { CustomSelect } from '../components/CustomSelect';
import { useModal } from '../context/ModalContext';

interface Session {
  sessionId: number;
  startTime: string;
  price: number;
  hall: { hallId: number; hallName: string; cinema: { name: string; address: string } };
}

interface Movie {
  movieId: number;
  title: string;
  description: string;
  duration: number;
  ageRating: string;
  releaseDate: string;
  genres: { genreId: number; nameRu: string }[];
  coverImage?: string;
  trailer?: string;
}

interface Comment {
  commentId: number;
  commentText: string;
  commentDate: string;
  user: { login: string; avatarImage?: string };
  userRating?: number;
}

export default function MovieDetail() {
  const { id } = useParams();
  const { showConfirm, showAlert } = useModal();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [rating, setRating] = useState<{ averageRating: string; totalVotes: number } | null>(null);
  const [newComment, setNewComment] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [sessionSortType, setSessionSortType] = useState('dateAsc');
  const [loading, setLoading] = useState(true);
  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [movieRes, sessionsRes, commentsRes, ratingRes] = await Promise.all([
          apiClient.get(`/movies/${id}`),
          apiClient.get(`/sessions/movie/${id}`),
          apiClient.get(`/reviews/movie/${id}/comments`),
          apiClient.get(`/reviews/movie/${id}/rating`),
        ]);
        setMovie(movieRes.data);
        setSessions(sessionsRes.data);
        setComments(commentsRes.data);
        setRating(ratingRes.data);
      } catch {
        setMovie(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await apiClient.post(`/reviews/movie/${id}/comments`, { text: newComment });
      setComments([res.data, ...comments]);
      setNewComment('');
    } catch { }
  };

  const submitRating = async (val: number) => {
    setUserRating(val);
    try {
      const res = await apiClient.post(`/reviews/movie/${id}/rating`, { value: val });
      setRating({ averageRating: res.data.averageRating, totalVotes: res.data.totalVotes });
      showAlert('Рейтинг успешно сохранен!', 'success');
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Ошибка при сохранении рейтинга', 'error');
    }
  };

  if (loading) return <Loader />;
  if (!movie) return <div className="loading-center">Фильм не найден</div>;

  const posterUrl = movie.coverImage ? `/uploads/posters/${movie.coverImage}` : `/api/movies/${id}/poster`;

  const sortedSessions = [...sessions].sort((a, b) => {
    if (sessionSortType === 'dateAsc') {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    } else if (sessionSortType === 'dateDesc') {
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    } else if (sessionSortType === 'priceAsc') {
      return a.price - b.price;
    }
    return 0;
  });

  const groupedSessions = sortedSessions.reduce((acc, session) => {
    const cinemaName = session.hall?.cinema?.name || 'Неизвестный кинотеатр';
    if (!acc[cinemaName]) acc[cinemaName] = [];
    acc[cinemaName].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  return (
    <div className="detail-container page-fade">

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '48px', alignItems: 'start', marginBottom: '64px' }}>
        <div className="glass card" style={{ padding: '0', overflow: 'hidden', border: 'none' }}>
          <img src={posterUrl} alt={movie.title} style={{ width: '100%', display: 'block' }} />
        </div>

        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {movie.genres?.map(g => (
              <span key={g.genreId} className="nav-link" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', padding: '4px 12px' }}>
                {g.nameRu}
              </span>
            ))}
          </div>
          
          <h1 style={{ 
            fontSize: movie.title.length > 25 ? '2.3rem' : movie.title.length > 15 ? '2.8rem' : '3.5rem', 
            fontWeight: 800, 
            fontFamily: 'var(--font-title)', 
            marginBottom: '16px', 
            lineHeight: 1.1,
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}>
            {movie.title}
          </h1>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '32px' }}>
            {movie.ageRating && <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>{movie.ageRating}+</span>}
            {movie.releaseDate && <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>{new Date(movie.releaseDate).getFullYear()}</span>}
            <span style={{ color: 'var(--text-muted)' }}>⏱ {movie.duration} мин</span>
            {rating && rating.totalVotes > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>⭐ {rating.averageRating}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({rating.totalVotes} голосов)</span>
              </div>
            ) : rating && rating.totalVotes === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Нет оценок</span>
              </div>
            ) : null}
          </div>

          <p style={{ fontSize: '1.15rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', marginBottom: '40px' }}>
            {movie.description}
          </p>

          {isLoggedIn && (
            <div className="glass card" style={{ padding: '16px 24px', display: 'inline-block' }}>
              <p style={{ fontWeight: 700, marginBottom: '12px', fontSize: '0.9rem' }}>Оцените кино</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <button
                    key={n}
                    onClick={() => submitRating(n)}
                    style={{
                      width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--glass-border)',
                      background: userRating >= n ? 'var(--primary)' : 'transparent',
                      color: '#fff',
                      cursor: 'pointer', fontWeight: 700, transition: '0.2s', fontSize: '0.8rem'
                    }}
                  >{n}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {movie.trailer && (
        <section style={{ marginBottom: '64px' }}>
          <h2 className="section-title" style={{ fontSize: '1.8rem' }}>Трейлер</h2>
          <div className="glass card" style={{ padding: '12px', borderRadius: '24px', background: '#000', overflow: 'hidden' }}>
            <video
              controls
              style={{ width: '100%', borderRadius: '16px', display: 'block', maxHeight: '600px' }}
            >
              <source src={`/uploads/trailers/${movie.trailer}`} type="video/mp4" />
              Ваш браузер не поддерживает видео.
            </video>
          </div>
        </section>
      )}

      <div style={{ marginBottom: '64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="section-title" style={{ marginBottom: 0, fontSize: '1.8rem' }}>Расписание сеансов</h2>
          {sessions.length > 0 && (
            <CustomSelect
              style={{ width: '220px' }}
              value={sessionSortType}
              onChange={val => setSessionSortType(val)}
              options={[
                { value: 'dateAsc', label: 'Сначала ближайшие' },
                { value: 'dateDesc', label: 'Сначала дальние' },
                { value: 'priceAsc', label: 'Сначала дешевые' }
              ]}
            />
          )}
        </div>
        
        {sessions.length === 0 ? (
          <p className="muted">Сеансов пока нет</p>
        ) : (
          <div style={{ display: 'grid', gap: '40px' }}>
            {Object.entries(groupedSessions).map(([cinemaName, cinemaSessions]) => (
              <div key={cinemaName}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
                  🎥 {cinemaName}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  {cinemaSessions.map(s => (
                    <div key={s.sessionId} className="glass card" style={{ padding: '16px 20px', width: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                            {new Date(s.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {new Date(s.startTime).toLocaleDateString('ru-RU', { year: 'numeric', day: '2-digit', month: 'long' })}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{s.price} BYN</div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>{s.hall?.hallName}</div>
                        <Link to={isLoggedIn ? `/session/${s.sessionId}/seats` : '/login'} className="btn btn--sm" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                          Билеты
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <section style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '48px' }}>
        <h2 className="section-title" style={{ fontSize: '1.8rem' }}>Отзывы зрителей</h2>
        {isLoggedIn && (
          <form onSubmit={handleComment} style={{ marginBottom: '48px', maxWidth: '800px' }}>
            <textarea
              className="input-field"
              placeholder="Ваше мнение..."
              style={{ minHeight: '100px', marginBottom: '16px' }}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <button className="btn btn--sm">Отправить отзыв</button>
          </form>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '24px' }}>
          {comments.length === 0 ? (
            <p className="muted">Отзывов пока нет. Будьте первым!</p>
          ) : comments.map(c => (
            <div key={c.commentId} className="glass card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img 
                    src={c.user?.avatarImage ? `/uploads/avatars/${c.user.avatarImage}` : 'https://api.dicebear.com/7.x/avataaars/svg?seed=placeholder'} 
                    alt={c.user?.login} 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>{c.user?.login}</span>
                    {c.userRating && (
                      <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ⭐ Оценка: {c.userRating}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{new Date(c.commentDate).toLocaleDateString()}</span>
              </div>
              <p style={{ opacity: 0.9 }}>{c.commentText}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
