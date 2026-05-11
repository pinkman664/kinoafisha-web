import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

export default function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // чистим старую ошибку
    try {
      // Идем на бэкенд
      const response = await apiClient.post('/users/login', { login, password });
      
      // Магия: Сохраняем токен в память браузера!
      localStorage.setItem('token', response.data.token);
      
      // Перебрасываем на страницу профиля
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Сервер не отвечает');
    }
  };

  return (
    <div className="auth-page">
      <div className="card">
        <div className="auth-logo">🎬</div>
        <h1 className="auth-title">Вход в <span style={{ color: 'var(--primary)' }}>Киноафишу</span></h1>
        <p className="auth-subtitle">Рады видеть тебя снова</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Логин</label>
            <input className="input-field" placeholder="Ваш логин" value={login} onChange={e => setLogin(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Пароль</label>
            <input className="input-field" type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn">Войти</button>
        </form>
        <p className="auth-link">Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></p>
      </div>
    </div>
  );
}
