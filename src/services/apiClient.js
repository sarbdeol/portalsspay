import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 12_000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is gone / wrong / expired. Wipe state and bounce to /login
      // so the UI never gets stuck on a half-rendered protected route.
      useAuthStore.getState().logout();
      const path = window.location.pathname;
      if (path !== '/login' && !path.startsWith('/kyc/')) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  },
);
