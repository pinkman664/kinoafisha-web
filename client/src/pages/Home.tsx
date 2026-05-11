import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

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

interface Genre {
  genreId: number;
  nameRu: string;
  nameEn: string;
}

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [minRating, setMinRating] = useState(0); // Фильтр по рейтингу
  const [sortBy, setSortBy] = useState<'default' | 'title'>('default');
  const [loading, setLoading] = useState(true);
  const isLoggedIn = !!localStorage.getItem('token');

  // Загружаем жанры при первом рендере
  useEffect(() => {
    apiClient.get('/genres').then(r => setGenres(r.data)).catch(() => {});
  }, []);

  /**
   * Функция загрузки фильмов с учетом всех фильтров.
   */
  const fetchMovies = async (q = '', genreId: number | null = null, rating = 0) => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (q) params.search = q;
      if (genreId) params.genreId = genreId;
      if (rating > 0) params.minRating = rating; // Передаем минимальный рейтинг
      
      const res = await apiClient.get('/movies', { params });
      setMovies(res.data);
    } catch {
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  // Вызываем загрузку при изменении жанра или рейтинга
  useEffect(() => { 
    fetchMovies(search, selectedGenre, minRating); 
  }, [selectedGenre, minRating]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMovies(search, selectedGenre, minRating);
  };

  const handleGenreClick = (genreId: number | null) => {
    setSelectedGenre(genreId);
  };

  // Сортировка на стороне клиента
  const sortedMovies = [...movies].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return 0;
  });

  return (
    <div className="home-page">
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="logo">🎬 Киноафиша</Link>
          <form onSubmit={handleSearch} className="search-form">
            <input
              className="search-input"
              placeholder="Поиск фильма..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit" className="search-btn">Найти</button>
          </form>
          <nav className="header-nav">
            {isLoggedIn
              ? <Link to="/profile" className="nav-link">Профиль</Link>
              : <>
                  <Link to="/login" className="nav-link">Войти</Link>
                  <Link to="/register" className="nav-link nav-link--primary">Регистрация</Link>
                </>
            }
          </nav>
        </div>
      </header>

      <main className="main-content">
        {/* Панель фильтров */}
        <div className="filters-panel">
          {/* Фильтр по жанрам */}
          <div className="genre-filter">
            <button
              className={`genre-btn ${selectedGenre === null ? 'active' : ''}`}
              onClick={() => handleGenreClick(null)}
            >Все жанры</button>
            {genres.map(g => (
              <button
                key={g.genreId}
                className={`genre-btn ${selectedGenre === g.genreId ? 'active' : ''}`}
                onClick={() => handleGenreClick(g.genreId)}
              >{g.nameRu}</button>
            ))}
          </div>

          {/* Фильтр по рейтингу */}
          <div className="rating-filter">
            <span className="filter-label">Рейтинг от:</span>
            <div className="rating-stars-select">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <button
                  key={n}
                  className={`rating-star-btn ${minRating === n ? 'active' : ''}`}
                  onClick={() => setMinRating(n)}
                >
                  {n === 0 ? 'Все' : n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Сортировка */}
        <div className="sort-bar">
          <span className="section-title">
            {selectedGenre
              ? `${genres.find(g => g.genreId === selectedGenre)?.nameRu || ''}`
              : search ? `Результаты: "${search}"` : 'Все фильмы'}
          </span>
          <select
            className="sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
          >
            <option value="default">По умолчанию</option>
            <option value="title">По названию (А-Я)</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-state">Загружаем фильмы...</div>
        ) : sortedMovies.length === 0 ? (
          <div className="empty-state">
            <span>🎭</span>
            <p>Фильмы не найдены</p>
          </div>
        ) : (
          <div className="movies-grid">
            {sortedMovies.map(movie => (
              <Link to={`/movie/${movie.movieId}`} key={movie.movieId} className="movie-card">
                <div className="movie-poster">
                  <img 
                    src={movie.coverImage ? `/uploads/posters/${movie.coverImage}` : `/api/movies/${movie.movieId}/poster`} 
                    alt={movie.title}
                    className="movie-poster-img"
                    onError={(e) => { 
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('/api/')) {
                        target.src = `/api/movies/${movie.movieId}/poster`;
                      } else {
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '🎬';
                      }
                    }} 
                  />
                  {movie.ageRating && (
                    <span className="age-badge">{movie.ageRating}+</span>
                  )}
                </div>
                <div className="movie-info">
                  <h3 className="movie-title">{movie.title}</h3>
                  <div className="movie-genres">
                    {movie.genres?.map(g => (
                      <span key={g.genreId} className="genre-tag">{g.nameRu}</span>
                    ))}
                  </div>
                  <p className="movie-duration">⏱ {movie.duration} мин</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
