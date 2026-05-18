import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Страница 404 — отображается, если пользователь перешёл на несуществующий маршрут
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="page-fade"
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <div
        className="glass card"
        style={{
          width: '100%',
          maxWidth: '520px',
          textAlign: 'center',
          padding: '56px 40px',
        }}
      >
        {/* Большая цифра 404 */}
        <h1
          style={{
            fontSize: '6rem',
            fontWeight: 800,
            fontFamily: 'var(--font-title)',
            lineHeight: 1,
            margin: 0,
            background: 'linear-gradient(135deg, var(--primary), #fb7185)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-2px',
          }}
        >
          404
        </h1>

        {/* Заголовок */}
        <h2
          style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            fontFamily: 'var(--font-title)',
            marginTop: '16px',
            marginBottom: '12px',
            color: '#fff',
          }}
        >
          Страница не найдена
        </h2>

        {/* Пояснение */}
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            marginBottom: '32px',
          }}
        >
          Похоже, такой страницы у нас нет. Возможно, она была удалена,
          переименована или вы перешли по неверной ссылке.
        </p>

        {/* Кнопки навигации */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn" style={{ textDecoration: 'none' }}>
            На главную
          </Link>
          <button className="btn btn--outline" onClick={() => navigate(-1)}>
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}
