import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

export default function Register() {
  const [form, setForm] = useState({ login: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post('/users/register', form);
      localStorage.setItem('token', res.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card">
        <div className="auth-logo">🎬</div>
        <h1 className="auth-title">Создать аккаунт</h1>
        <p className="auth-subtitle">Присоединяйтесь к Киноафише</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Логин</label>
            <input className="input-field" name="login" placeholder="Ваш логин" value={form.login} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input className="input-field" name="email" type="email" placeholder="example@mail.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Пароль</label>
            <input className="input-field" name="password" type="password" placeholder="Минимум 6 символов" value={form.password} onChange={handleChange} required />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p className="auth-link">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}
