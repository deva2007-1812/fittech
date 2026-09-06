import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

function getBaseUrl(): string {
  let url = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').trim();
  url = url.replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
}

const BASE_URL = getBaseUrl();

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && token !== 'undefined' && token !== 'null' && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized and not already retrying, attempt token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          const newAccessToken = data.tokens?.accessToken || data.accessToken;
          if (newAccessToken) {
            localStorage.setItem('accessToken', newAccessToken);
            if (data.tokens?.refreshToken) {
              localStorage.setItem('refreshToken', data.tokens.refreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        } catch {
          // Refresh failed - purge state and redirect
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('fitmind_user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('fitmind_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// ─── User-Friendly Error Helper ───────────────────────────────────────────────
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.status === 400) {
      return 'Invalid request data. Please check your inputs.';
    }
    if (error.response?.status === 401) {
      return 'Invalid credentials or session expired. Please sign in again.';
    }
    if (error.response?.status === 403) {
      return 'Request blocked (403 Forbidden). Please ensure the backend has finished deploying and CORS/origins are allowed.';
    }
    if (error.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    if (error.response?.status === 409) {
      return 'Conflict: email or data already exists.';
    }
    if (error.response?.status === 500) {
      return 'Server error. Please try again in a few moments.';
    }
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'Request timed out. Please check if the server is running.';
    }
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return 'Network error: Cannot reach the backend server at ' + BASE_URL;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

export default api;
