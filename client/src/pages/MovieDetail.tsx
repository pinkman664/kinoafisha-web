import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

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
  user: { login: string };
}

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [rating, setRating] = useState<{ averageRating: string; totalVotes: number } | null>(null);
  const [newComment, setNewComment] = useState('');
  const [userRating, setUserRating] = useState(0);
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
    } catch {}
  };

  const handleRatingSelect = (value: number) => {
    setUserRating(value);
  };

  const submitRating = async () => {
    if (userRating === 0) return;
    try {
      const res = await apiClient.post(`/reviews/movie/${id}/rating`, { value: userRating });
      setRating(prev => ({ ...prev!, averageRating: res.data.averageRating }));
      alert('Рейтинг успешно сохранен!');
    } catch (err: any) {
      alert(`Ошибка: ${err?.response?.data?.message || err.message}`);
      console.error(err);
    }
  };

  if (loading) return <div className="loading-center">Загружаем фильм...</div>;
  if (!movie) return <div className="loading-center">Фильм не найден</div>;

  return (
    <div className="movie-detail-page">
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="logo">🎬 Киноафиша</Link>
          <nav className="header-nav">
            {isLoggedIn
              ? <Link to="/profile" className="nav-link">Профиль</Link>
              : <Link to="/login" className="nav-link nav-link--primary">Войти</Link>
            }
          </nav>
        </div>
      </header>

      <main className="detail-main">
        {/* Герой секция с информацией о фильме */}
        <div className="movie-hero">
          <div className="movie-hero-poster">
            <img 
              src={movie.coverImage ? `/uploads/posters/${movie.coverImage}` : `/api/movies/${id}/poster`} 
              alt={movie.title}
              className="movie-poster-img"
              onError={(e) => { 
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('/api/')) {
                  target.src = `/api/movies/${id}/poster`;
                } else {
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '🎬';
                }
              }} 
            />
          </div>
          <div className="movie-hero-info">
            <div className="movie-hero-genres">
              {movie.genres?.map(g => <span key={g.genreId} className="genre-tag">{g.nameRu}</span>)}
            </div>
            <h1 className="movie-hero-title">{movie.title}</h1>
            <div className="movie-meta">
              {movie.ageRating && <span className="meta-badge">{movie.ageRating}+</span>}
              <span className="meta-item">⏱ {movie.duration} мин</span>
              {movie.releaseDate && (
                <span className="meta-item">📅 {new Date(movie.releaseDate).getFullYear()}</span>
              )}
            </div>

            {/* Средний рейтинг */}
            {rating && (
              <div className="rating-display">
                <span className="rating-star">⭐</span>
                <span className="rating-value">{rating.averageRating}</span>
                <span className="rating-votes">({rating.totalVotes} голосов)</span>
              </div>
            )}

            <p className="movie-desc">{movie.description}</p>

            {/* Пользовательская оценка (только для авторизованных) */}
            {isLoggedIn && (
              <div className="user-rating">
                <p>Ваша оценка:</p>
                <div className="stars">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button
                      key={n}
                      className={`star-btn ${userRating >= n ? 'active' : ''}`}
                      onClick={() => handleRatingSelect(n)}
                    >{n}</button>
                  ))}
                </div>
                {userRating > 0 && (
                  <button 
                    onClick={submitRating} 
                    className="btn btn--sm" 
                    style={{ marginTop: '10px' }}
                  >
                    Подтвердить рейтинг
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Трейлер (если загружен в БД) */}
        {movie.trailer && (
          <section className="section">
            <h2 className="section-title">Трейлер</h2>
            <video
              controls
              style={{ width: '100%', maxWidth: '800px', borderRadius: '12px', background: '#000' }}
            >
              <source src={movie.trailer ? `/uploads/trailers/${movie.trailer}` : `/api/movies/${id}/trailer`} type="video/mp4" />
              Ваш браузер не поддерживает воспроизведение видео.
            </video>
          </section>
        )}

        {/* Расписание сеансов */}
        <section className="section">
          <h2 className="section-title">Расписание сеансов</h2>
          {sessions.length === 0 ? (
            <p className="muted">Сеансов пока нет</p>
          ) : (
            <div className="sessions-list">
              {sessions.map(s => (
                <div key={s.sessionId} className="session-card">
                  <div className="session-info">
                    <span className="session-time">
                      🕐 {new Date(s.startTime).toLocaleString('ru-RU', {
                        day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                    <span className="session-cinema">
                      🏛 {s.hall?.cinema?.name} — {s.hall?.hallName}
                    </span>
                  </div>
                  <div className="session-right">
                    <span className="session-price">{s.price} руб.</span>
                    {isLoggedIn ? (
                      // Переходим на страницу выбора места в зале
                      <Link to={`/session/${s.sessionId}/seats`} className="btn btn--sm">
                        Выбрать место
                      </Link>
                    ) : (
                      <Link to="/login" className="btn btn--sm btn--outline">Войти</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Комментарии */}
        <section className="section">
          <h2 className="section-title">Отзывы</h2>
          {isLoggedIn && (
            <form onSubmit={handleComment} className="comment-form">
              <textarea
                className="input-field textarea"
                placeholder="Напишите ваш отзыв..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
              />
              <button type="submit" className="btn" style={{width:'auto',padding:'12px 24px'}}>
                Оставить отзыв
              </button>
            </form>
          )}
          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="muted">Отзывов пока нет. Будьте первым!</p>
            ) : comments.map(c => (
              <div key={c.commentId} className="comment-card">
                <div className="comment-header">
                  <span className="comment-author">👤 {c.user?.login}</span>
                  <span className="comment-date">
                    {new Date(c.commentDate).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <p className="comment-text">{c.commentText}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
