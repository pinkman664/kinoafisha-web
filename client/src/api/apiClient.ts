import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api', // Используем прокси Vite
});

// Перехватчик: перед тем как отправить любой запрос, он 
// кладет наш авторизационный токен в заголовки
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
