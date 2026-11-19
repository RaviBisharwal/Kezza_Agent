import { create } from 'axios';
import { useAuthStore } from '@/store/auth-store';

const baseURL = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');

export const api = create({
  baseURL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (!baseURL) {
    throw new Error('API address is not configured. Copy .env.example to .env and set EXPO_PUBLIC_API_URL.');
  }
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) await useAuthStore.getState().signOut();
    return Promise.reject(error);
  },
);
