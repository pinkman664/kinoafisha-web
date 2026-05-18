import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

export default function Register() {
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{login?: string, email?: string, password?: string}>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: {login?: string, email?: string, password?: string} = {};
    
    if (!login.trim()) errors.login = 'Заполните логин';
    else if (!/^[a-zA-Z0-9_]{3,20}$/.test(login)) errors.login = 'Логин: 3-20 символов (англ. буквы, цифры, _)';

    if (!email.trim()) errors.email = 'Заполните email';
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Некорректный формат email (должен содержать @ и домен)';
    
    if (!password) errors.password = 'Заполните пароль';
    else if (!/^[^\s]{6,}$/.test(password)) errors.password = 'Пароль: от 6 символов без пробелов';
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setFieldErrors({});
    setLoading(true); setError('');
    try {
      await apiClient.post('/users/register', { login, email, password });
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Ошибка регистрации';
      if (msg === 'Логин уже занят') {
        setFieldErrors({ login: msg });
      } else if (msg === 'Email уже используется') {
        setFieldErrors({ email: msg });
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container page-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px', marginBottom: '16px' }}>
        <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          ← Назад на Киноафишу
        </Link>
      </div>
      <div className="glass card" style={{ width: '100%', maxWidth: '420px', padding: '48px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-title)', marginBottom: '8px', textAlign: 'center' }}>Регистрация</h1>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '40px', fontWeight: 600 }}>Создайте новый аккаунт</p>

        <form onSubmit={handleRegister} noValidate autoComplete="off" style={{ display: 'grid', gap: '24px' }}>
          <div className="input-group">
            <label>ЛОГИН</label>
            <input className="input-field" autoComplete="off" placeholder="ваш логин" value={login} onChange={e => { setLogin(e.target.value); setFieldErrors(p => ({...p, login: ''})) }} />
            {fieldErrors.login && <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.login}</p>}
          </div>

          <div className="input-group">
            <label>EMAIL</label>
            <input className="input-field" type="email" autoComplete="off" placeholder="example@mail.ru" value={email} onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({...p, email: ''})) }} />
            {fieldErrors.email && <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.email}</p>}
          </div>
          
          <div className="input-group">
            <label>ПАРОЛЬ</label>
            <input className="input-field" type="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({...p, password: ''})) }} />
            {fieldErrors.password && <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>{fieldErrors.password}</p>}
          </div>

          {error && <p style={{ color: 'var(--primary)', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}>{error}</p>}

          <button className="btn" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? 'СОЗДАНИЕ...' : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
          </button>
        </form>

        <p style={{ marginTop: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Уже есть аккаунт? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>Войти</Link>
        </p>
      </div>
    </div>
  );
}
