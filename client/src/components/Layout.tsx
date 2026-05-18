import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

export const Navbar = () => {
  const isLoggedIn = !!localStorage.getItem('token');
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [movies, setMovies] = useState<any[]>([]);

  useEffect(() => {
    if (isLoggedIn) {
      apiClient.get('/users/profile')
        .then(res => setIsAdmin(res.data.isAdmin === 'Y'))
        .catch(() => setIsAdmin(false));
    }
  }, [isLoggedIn]);

  useEffect(() => {
    // Загрузка списка фильмов для глобального поиска в шапке
    apiClient.get('/movies')
      .then(res => setMovies(res.data))
      .catch(err => console.error('Ошибка загрузки фильмов для поиска:', err));
  }, []);

  useEffect(() => {
    if (!isSearching) return;
    const handleClose = () => setIsSearching(false);
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, [isSearching]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAdmin(false);
    navigate('/login');
  };

  const searchResults = searchQuery.trim()
    ? movies.filter((m: any) => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <header className="site-header">
      <div className="header-inner glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="logo">🎬 КИНОАФИША</Link>

       
        <div
          className="header-search-container"
          style={{ position: 'relative', width: '320px', margin: '0 24px' }}
          onClick={e => e.stopPropagation()}
        >
          <input
            type="text"
            placeholder="Что вы ищете?"
            className="input-field"
            style={{
              borderRadius: '24px',
              padding: '8px 40px 8px 16px',
              fontSize: '0.85rem',
              height: '38px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--glass-border)',
              width: '100%'
            }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearching(true)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem'
              }}
            >
              ✕
            </button>
          )}

           
          {isSearching && searchQuery.trim() && (
            <div
              className="glass"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: '100%',
                minWidth: '340px',
                borderRadius: '16px',
                padding: '8px',
                zIndex: 2000,
                boxShadow: 'var(--shadow-premium)',
                display: 'grid',
                gap: '4px',
                background: '#0d1527',
                border: '1px solid var(--glass-border)'
              }}
            >
              {searchResults.length === 0 ? (
                <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                  Ничего не найдено
                </div>
              ) : (
                searchResults.map(movie => (
                  <div
                    key={movie.movieId}
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearching(false);
                      navigate(`/movie/${movie.movieId}`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <img
                      src={movie.coverImage ? `/uploads/posters/${movie.coverImage}` : `/api/movies/${movie.movieId}/poster`}
                      alt={movie.title}
                      style={{ width: '32px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
                      onError={(e) => { (e.target as any).src = 'https://via.placeholder.com/32x48?text=No+Poster' }}
                    />
                    <div style={{ display: 'grid', gap: '2px' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{movie.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⏱ {movie.duration} мин · {movie.ageRating}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <nav style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'nav-link--primary' : ''}`}>
            Афиша
          </Link>

          {isLoggedIn ? (
            <>
              <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'nav-link--primary' : ''}`}>
                Профиль
              </Link>
              {isAdmin && (
                <Link to="/admin" className="nav-link nav-link--primary">
                  ⚙ Админ
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="nav-link"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  marginLeft: '8px'
                }}
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`nav-link ${location.pathname === '/login' ? 'nav-link--primary' : ''}`}>
                Войти
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

interface LayoutProps {
  children: React.ReactNode;
  hideNavbar?: boolean;
}

export const Layout = ({ children, hideNavbar = false }: LayoutProps) => {
  return (
    <div className="page-fade">
      {!hideNavbar && <Navbar />}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export const Loader = () => (
  <div className="loading-center page-fade">
    <div className="loading-spinner"></div>
    <p style={{ fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '2px', fontSize: '0.8rem' }}>ЗАГРУЗКА...</p>
  </div>
);
