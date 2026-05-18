import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

export default function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{login?: string, password?: string}>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: {login?: string, password?: string} = {};
    if (!login.trim()) errors.login = 'Заполните логин или email';
    if (!password) errors.password = 'Заполните пароль';
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setFieldErrors({});
    setLoading(true); setError('');
    try {
      const res = await apiClient.post('/users/login', { login, password });
      localStorage.setItem('token', res.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container page-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', marginBottom: '16px' }}>
        <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          ← Назад на Киноафишу
        </Link>
      </div>
      <div className="glass card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-title)', marginBottom: '8px' }}>Вход</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Рады видеть вас снова!</p>
        </div>

        <form onSubmit={handleLogin} noValidate style={{ display: 'grid', gap: '20px' }}>
          <div className="input-group">
            <label style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>ЛОГИН / EMAIL</label>
            <input className="input-field" placeholder="alex_kino" value={login} onChange={e => { setLogin(e.target.value); setFieldErrors(p => ({...p, login: ''})) }} />
            {fieldErrors.login && <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.login}</p>}
          </div>
          
          <div className="input-group">
            <label style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>ПАРОЛЬ</label>
            <input className="input-field" type="password" placeholder="••••••••" value={password} onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({...p, password: ''})) }} />
            {fieldErrors.password && <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.password}</p>}
          </div>

          {error && <p style={{ color: 'var(--primary)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>{error}</p>}

          <button className="btn" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? 'ЗАГРУЗКА...' : 'ВОЙТИ В АККАУНТ'}
          </button>
        </form>

        <div style={{ marginTop: '32px', textAlign: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Нет аккаунта? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 800, marginLeft: '8px' }}>Создать профиль</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
