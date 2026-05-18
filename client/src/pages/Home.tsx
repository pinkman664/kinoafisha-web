import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { Loader } from '../components/Layout';
import { CustomMultiSelect } from '../components/CustomMultiSelect';

interface Movie {
  movieId: number;
  title: string;
  coverImage?: string;
  duration: number;
  ageRating: string;
  genres: { genreId: number; nameRu: string }[];
  description?: string;
  releaseDate?: string;
}

interface Cinema {
  cinemaId: number;
  name: string;
  address: string;
}

interface Session {
  sessionId: number;
  startTime: string;
  movie?: { movieId: number };
  hall?: { hallId: number; cinema?: { cinemaId: number } };
}

export default function Home() {
  const getTitleFontSize = (title: string, defaultSize = '1.2rem') => {
    if (title.length > 25) return '0.9rem';
    if (title.length > 18) return '1.05rem';
    return defaultSize;
  };

  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<{ genreId: number; nameRu: string }[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  const [selectedGenres, setSelectedGenres] = useState<number[]>(() => {
    const saved = sessionStorage.getItem('selectedGenres');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedCinemas, setSelectedCinemas] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sessionStorage.setItem('selectedGenres', JSON.stringify(selectedGenres));
  }, [selectedGenres]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [mRes, gRes, cRes, sRes] = await Promise.all([
          apiClient.get('/movies'),
          apiClient.get('/genres'),
          apiClient.get('/cinemas'),
          apiClient.get('/sessions')
        ]);
        setMovies(mRes.data);
        setGenres(gRes.data);
        setCinemas(cRes.data);
        setSessions(sRes.data);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filteredMovies = movies.filter(movie => {
    // 1. По нескольким жанрам
    if (selectedGenres.length > 0) {
      const matchesGenre = movie.genres.some(g => selectedGenres.includes(g.genreId));
      if (!matchesGenre) return false;
    }

    // Получаем все сеансы для этого фильма
    const movieSessions = sessions.filter(s => s.movie?.movieId === movie.movieId);

    // 2. По кинотеатрам
    if (selectedCinemas.length > 0) {
      const hasSessionInSelectedCinema = movieSessions.some(s =>
        s.hall?.cinema?.cinemaId && selectedCinemas.includes(s.hall.cinema.cinemaId)
      );
      if (!hasSessionInSelectedCinema) return false;
    }

    // 3. По дате сеанса
    if (selectedDate) {
      const hasSessionOnSelectedDate = movieSessions.some(s => {
        const d = new Date(s.startTime);
        const offset = d.getTimezoneOffset() * 60000;
        const localDateStr = new Date(d.getTime() - offset).toISOString().split('T')[0];
        return localDateStr === selectedDate;
      });
      if (!hasSessionOnSelectedDate) return false;
    }

    // 4. По минимальной оценке (averageRating вычислен на сервере)
    if (minRating !== null) {
      const avg = (movie as any).averageRating ?? 0;
      if (avg < minRating) return false;
    }

    return true;
  });

  // Вычисляем популярные фильмы на основе количества сеансов (топ-3)
  const popularMovies = [...movies]
    .map(movie => {
      const sessionCount = sessions.filter(s => s.movie?.movieId === movie.movieId).length;
      return { ...movie, sessionCount };
    })
    .sort((a, b) => b.sessionCount - a.sessionCount)
    .slice(0, 3);

  // Вычисляем новинки на основе даты выхода (последние 4 фильма)
  const newReleases = [...movies]
    .filter(m => m.releaseDate)
    .sort((a, b) => {
      return new Date(b.releaseDate!).getTime() - new Date(a.releaseDate!).getTime();
    })
    .slice(0, 4);

  // Проверяем, применен ли хотя бы один фильтр
  const isFiltering = selectedDate || selectedCinemas.length > 0 || selectedGenres.length > 0 || minRating !== null;

  // Разбиваем отфильтрованные фильмы на порции для стандартного отображения (когда нет фильтров):
  const regularMoviesChunk1 = filteredMovies.slice(0, 8);
  const regularMoviesChunk2 = filteredMovies.slice(8, 20);
  const regularMoviesChunk3 = filteredMovies.slice(20);

  if (loading) return <Loader />;

  return (
    <div className="home-container page-fade" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }}>



       
      <div className="glass card" style={{
        padding: '16px 24px',
        borderRadius: '20px',
        marginBottom: '48px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        alignItems: 'center',
        position: 'relative',
        zIndex: 50
      }}>
         
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="date"
            className="input-field"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ paddingRight: selectedDate ? '40px' : '16px', width: '100%' }}
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              style={{
                position: 'absolute', right: '12px', background: 'transparent', border: 'none',
                color: 'var(--primary)', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700
              }}
            >
              ✕
            </button>
          )}
        </div>

         
        <CustomMultiSelect
          placeholder="Все кинотеатры"
          selectedValues={selectedCinemas}
          onChange={setSelectedCinemas}
          options={cinemas.map(c => ({ value: c.cinemaId, label: c.name }))}
        />

         
        <CustomMultiSelect
          placeholder="Все жанры"
          selectedValues={selectedGenres}
          onChange={setSelectedGenres}
          options={genres.map(g => ({ value: g.genreId, label: g.nameRu }))}
        />

         
        {(selectedDate || selectedCinemas.length > 0 || selectedGenres.length > 0 || minRating !== null) && (
          <button
            onClick={() => {
              setSelectedDate('');
              setSelectedCinemas([]);
              setSelectedGenres([]);
              setMinRating(null);
            }}
            className="btn btn--outline btn--sm"
            style={{
              borderColor: 'rgba(244, 63, 94, 0.4)',
              color: 'var(--primary)',
              whiteSpace: 'nowrap',
              padding: '12px 18px',
              borderRadius: '16px',
              fontWeight: 700,
              width: '100%'
            }}
          >
            Сбросить всё
          </button>
        )}
      </div>

       
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
          Оценка от:
        </span>
        {[2, 4, 6, 8].map(rating => (
          <button
            key={rating}
            onClick={() => setMinRating(minRating === rating ? null : rating)}
            style={{
              padding: '6px 16px',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: minRating === rating ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
              background: minRating === rating
                ? 'rgba(244, 63, 94, 0.15)'
                : 'rgba(255,255,255,0.04)',
              color: minRating === rating ? 'var(--primary)' : 'rgba(255,255,255,0.6)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backdropFilter: 'blur(8px)'
            }}
            onMouseEnter={e => {
              if (minRating !== rating) {
                e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.4)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={e => {
              if (minRating !== rating) {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
              }
            }}
          >
            {rating}+
          </button>
        ))}
      </div>

       
      {isFiltering ? (
        // ── ОТОБРАЖЕНИЕ ПРИ АКТИВНОЙ ФИЛЬТРАЦИИ ──
        filteredMovies.length === 0 ? (
          <div className="glass card" style={{ textAlign: 'center', padding: '64px 32px', borderRadius: '28px', border: '1px dashed var(--glass-border)' }}>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>Сеансы не найдены</p>
            <p className="muted" style={{ fontSize: '0.9rem' }}>Попробуйте изменить параметры поиска или сбросить активные фильтры</p>
          </div>
        ) : (
          <section>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '24px', fontFamily: 'var(--font-title)' }}>
              Результаты поиска
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '32px',
              justifyContent: 'center'
            }}>
              {filteredMovies.map(movie => (
                <Link
                  key={`filtered-${movie.movieId}`}
                  to={`/movie/${movie.movieId}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'block',
                    borderRadius: '28px',
                    overflow: 'visible'
                  }}
                >
                  <div className="movie-card glass" style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '28px',
                    border: '1px solid var(--glass-border)',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.borderColor = 'var(--glass-border)';
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
                    }}
                  >
                    <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden' }}>
                      <img
                        src={movie.coverImage ? `/uploads/posters/${movie.coverImage}` : `/api/movies/${movie.movieId}/poster`}
                        alt={movie.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as any).src = 'https://via.placeholder.com/300x450?text=No+Poster' }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'rgba(244, 63, 94, 0.9)',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 900,
                        backdropFilter: 'blur(10px)',
                        color: '#fff'
                      }}>
                        {movie.ageRating}+
                      </div>
                    </div>

                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1, justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          {movie.genres?.[0]?.nameRu || 'Кино'}
                        </div>
                        <h3 style={{ fontSize: getTitleFontSize(movie.title), fontWeight: 800, margin: '4px 0 0 0', color: '#fff', lineHeight: 1.2, fontFamily: 'var(--font-title)' }}>
                          {movie.title}
                        </h3>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                        {movie.duration} мин
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )
      ) : (
        // ── СТАНДАРТНОЕ ОТОБРАЖЕНИЕ (БЕЗ ФИЛЬТРОВ) ──
        <>
           
          {filteredMovies.length > 0 && (
            <section style={{ marginBottom: '56px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '24px', fontFamily: 'var(--font-title)' }}>
                Сейчас в кино
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '32px',
                justifyContent: 'center'
              }}>
                {regularMoviesChunk1.map(movie => (
                  <Link
                    key={`reg1-${movie.movieId}`}
                    to={`/movie/${movie.movieId}`}
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'block',
                      borderRadius: '28px',
                      overflow: 'visible'
                    }}
                  >
                    <div className="movie-card glass" style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '28px',
                      border: '1px solid var(--glass-border)',
                      overflow: 'hidden',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.borderColor = 'var(--glass-border)';
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
                      }}
                    >
                      <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden' }}>
                        <img
                          src={movie.coverImage ? `/uploads/posters/${movie.coverImage}` : `/api/movies/${movie.movieId}/poster`}
                          alt={movie.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.target as any).src = 'https://via.placeholder.com/300x450?text=No+Poster' }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '16px',
                          right: '16px',
                          background: 'rgba(244, 63, 94, 0.9)',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 900,
                          backdropFilter: 'blur(10px)',
                          color: '#fff'
                        }}>
                          {movie.ageRating}+
                        </div>
                      </div>

                      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1, justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {movie.genres?.[0]?.nameRu || 'Кино'}
                          </div>
                          <h3 style={{ fontSize: getTitleFontSize(movie.title), fontWeight: 800, margin: '4px 0 0 0', color: '#fff', lineHeight: 1.2, fontFamily: 'var(--font-title)' }}>
                            {movie.title}
                          </h3>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                          {movie.duration} мин
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

           
          {newReleases.length > 0 && (
            <hr style={{ border: 'none', height: '1px', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)', margin: '40px 0 48px' }} />
          )}
          {newReleases.length > 0 && (
            <section style={{ marginBottom: '64px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '24px', fontFamily: 'var(--font-title)' }}>
                Новинки проката
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '32px'
              }}>
                {newReleases.map(movie => {
                  const relDate = movie.releaseDate
                    ? new Date(movie.releaseDate).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : 'Скоро в прокате';
                  return (
                    <Link
                      key={`new-${movie.movieId}`}
                      to={`/movie/${movie.movieId}`}
                      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                    >
                      <div className="glass card" style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '28px',
                        border: '1px solid rgba(244, 63, 94, 0.15)',
                        background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.02), rgba(255, 255, 255, 0.01))',
                        overflow: 'hidden',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                      }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                          e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.45)';
                          e.currentTarget.style.boxShadow = '0 20px 40px rgba(244, 63, 94, 0.1)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.15)';
                          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
                        }}
                      >
                        <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden' }}>
                          <img
                            src={movie.coverImage ? `/uploads/posters/${movie.coverImage}` : `/api/movies/${movie.movieId}/poster`}
                            alt={movie.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { (e.target as any).src = 'https://via.placeholder.com/300x450?text=No+Poster' }}
                          />
                          <div style={{
                            position: 'absolute',
                            top: '16px',
                            left: '16px',
                            background: 'rgba(244, 63, 94, 0.95)',
                            padding: '4px 10px',
                            borderRadius: '10px',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            backdropFilter: 'blur(10px)',
                            color: '#fff'
                          }}>
                            Новинка
                          </div>
                          <div style={{
                            position: 'absolute',
                            bottom: '16px',
                            right: '16px',
                            background: 'rgba(3, 7, 18, 0.8)',
                            border: '1px solid var(--glass-border)',
                            padding: '4px 10px',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: '#fff',
                            backdropFilter: 'blur(10px)'
                          }}>
                            Релиз: {relDate}
                          </div>
                        </div>
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1, justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                              {movie.genres?.[0]?.nameRu || 'Кино'}
                            </div>
                            <h3 style={{ fontSize: getTitleFontSize(movie.title, '1.25rem'), fontWeight: 800, margin: '4px 0 0 0', color: '#fff', lineHeight: 1.2, fontFamily: 'var(--font-title)' }}>
                              {movie.title}
                            </h3>
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                            {movie.duration} мин · {movie.ageRating}+
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {newReleases.length > 0 && (
            <hr style={{ border: 'none', height: '1px', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)', margin: '48px 0 40px' }} />
          )}

           
          {regularMoviesChunk2.length > 0 && (
            <section style={{ marginBottom: '56px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '32px',
                justifyContent: 'center'
              }}>
                {regularMoviesChunk2.map(movie => (
                  <Link
                    key={`reg2-${movie.movieId}`}
                    to={`/movie/${movie.movieId}`}
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'block',
                      borderRadius: '28px',
                      overflow: 'visible'
                    }}
                  >
                    <div className="movie-card glass" style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '28px',
                      border: '1px solid var(--glass-border)',
                      overflow: 'hidden',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.borderColor = 'var(--glass-border)';
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
                      }}
                    >
                      <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden' }}>
                        <img
                          src={movie.coverImage ? `/uploads/posters/${movie.coverImage}` : `/api/movies/${movie.movieId}/poster`}
                          alt={movie.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.target as any).src = 'https://via.placeholder.com/300x450?text=No+Poster' }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '16px',
                          right: '16px',
                          background: 'rgba(244, 63, 94, 0.9)',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 900,
                          backdropFilter: 'blur(10px)',
                          color: '#fff'
                        }}>
                          {movie.ageRating}+
                        </div>
                      </div>

                      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1, justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {movie.genres?.[0]?.nameRu || 'Кино'}
                          </div>
                          <h3 style={{ fontSize: getTitleFontSize(movie.title), fontWeight: 800, margin: '4px 0 0 0', color: '#fff', lineHeight: 1.2, fontFamily: 'var(--font-title)' }}>
                            {movie.title}
                          </h3>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                          {movie.duration} мин
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {popularMovies.length > 0 && (
            <hr style={{ border: 'none', height: '1px', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)', margin: '48px 0 40px' }} />
          )}

           
          {popularMovies.length > 0 && (
            <section style={{ marginTop: '20px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '24px', fontFamily: 'var(--font-title)' }}>
                Популярные хиты
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px'
              }}>
                {popularMovies.map((movie, index) => {
                  return (
                    <Link
                      key={`pop-${movie.movieId}`}
                      to={`/movie/${movie.movieId}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div className="glass card" style={{
                        display: 'flex',
                        gap: '20px',
                        padding: '20px',
                        borderRadius: '24px',
                        border: '1px solid rgba(251, 191, 36, 0.15)',
                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.04), rgba(255, 255, 255, 0.01))',
                        boxShadow: '0 10px 40px -10px rgba(251, 191, 36, 0.04), inset 0 1px 0 rgba(255,255,255,0.05)',
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        height: '100%'
                      }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                          e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.45)';
                          e.currentTarget.style.boxShadow = '0 20px 40px rgba(251, 191, 36, 0.1)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.15)';
                          e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(251, 191, 36, 0.04)';
                        }}
                      >
                        <div style={{ position: 'relative', width: '95px', height: '140px', flexShrink: 0, borderRadius: '16px', overflow: 'hidden' }}>
                          <img
                            src={movie.coverImage ? `/uploads/posters/${movie.coverImage}` : `/api/movies/${movie.movieId}/poster`}
                            alt={movie.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { (e.target as any).src = 'https://via.placeholder.com/95x140?text=No+Poster' }}
                          />
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            background: 'rgba(251, 191, 36, 0.95)',
                            color: '#000',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            padding: '1px 6px',
                            borderRadius: '6px',
                            backdropFilter: 'blur(4px)'
                          }}>
                            TOP {index + 1}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                {movie.ageRating}+
                              </span>
                            </div>
                            <h3 style={{ fontSize: getTitleFontSize(movie.title), fontWeight: 800, color: '#fff', margin: '0 0 6px 0', lineHeight: 1.2, fontFamily: 'var(--font-title)' }}>
                              {movie.title}
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                              {movie.description || 'Эксклюзивный хит в сети наших кинотеатров. Бронируйте лучшие места!'}
                            </p>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                              {movie.duration} мин
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.8 }}>
                              Сеансов: <strong>{movie.sessionCount}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
          {regularMoviesChunk3.length > 0 && (
            <>
              <hr style={{ border: 'none', height: '1px', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)', margin: '48px 0 40px' }} />
              <section style={{ marginBottom: '56px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '32px',
                  justifyContent: 'center'
                }}>
                  {regularMoviesChunk3.map(movie => (
                    <Link
                      key={`reg3-${movie.movieId}`}
                      to={`/movie/${movie.movieId}`}
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'block',
                        borderRadius: '28px',
                        overflow: 'visible'
                      }}
                    >
                      <div className="movie-card glass" style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '28px',
                        border: '1px solid var(--glass-border)',
                        overflow: 'hidden',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                      }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                          e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.borderColor = 'var(--glass-border)';
                          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
                        }}
                      >
                        <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden' }}>
                          <img
                            src={movie.coverImage ? `/uploads/posters/${movie.coverImage}` : `/api/movies/${movie.movieId}/poster`}
                            alt={movie.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { (e.target as any).src = 'https://via.placeholder.com/300x450?text=No+Poster' }}
                          />
                          <div style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            background: 'rgba(244, 63, 94, 0.9)',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 900,
                            backdropFilter: 'blur(10px)',
                            color: '#fff'
                          }}>
                            {movie.ageRating}+
                          </div>
                        </div>

                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1, justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                              {movie.genres?.[0]?.nameRu || 'Кино'}
                            </div>
                            <h3 style={{ fontSize: getTitleFontSize(movie.title), fontWeight: 800, margin: '4px 0 0 0', color: '#fff', lineHeight: 1.2, fontFamily: 'var(--font-title)' }}>
                              {movie.title}
                            </h3>
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                            {movie.duration} мин
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
