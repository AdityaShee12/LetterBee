import axios from 'axios';
import { store } from './app/store.js';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies (refresh token)
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor ───
// Attach access token to every request
// api.interceptors.request.use(
//   (config) => {
//     const { accessToken } = store.getState().auth;
//     if (accessToken) {
//       config.headers.Authorization = `Bearer ${accessToken}`;
//     }
//     return config;
//   },
//   (err) => Promise.reject(err)
// );

// ─── Response Interceptor ───
// Handle 401 with automatic token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.data.accessToken;
        store.dispatch(setAccessToken(newToken));
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(logout());
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    // Show error toast for non-401 errors
    const message = error.response?.data?.message || 'An unexpected error occurred.';
    if (error.response?.status !== 401) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

// ─── API Service Methods ───

export const authAPI = {
  sendOTP: (data) => api.post("/auth/sendOTP", data),
  verifyOTP: (data) => api.post("/auth/verifyOTP", data),
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refreshAccessToken: () => api.post('/auth/refreshAccessToken'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  profilePicChange: (data) => api.post('auth/profilePicChange', data),
  profileAboutChange: (data) => api.post('auth/profileAboutChange', data),
};

export default api;
