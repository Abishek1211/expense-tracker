import axios, { AxiosError } from 'axios';
import { clearAuth, getToken } from '../lib/authStorage';
import { reportError } from '../lib/logger';
import type { ApiErrorBody } from '../types/expense';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Expired/invalid session: clear it and send the user to the login page,
    // except when the 401 came from the login/register calls themselves.
    const isAuthCall = error.config?.url?.includes('/api/v1/auth/');
    if (error.response?.status === 401 && !isAuthCall) {
      clearAuth();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    // Report genuine failures (no response at all, or the server erroring/
    // rate-limiting), not expected client errors like 400 validation or a
    // wrong password — those are normal user input, not operational issues.
    const status = error.response?.status;
    if (status === undefined || status >= 500 || status === 429) {
      reportError(error, {
        source: 'api-client',
        method: error.config?.method,
        url: error.config?.url,
        status,
      });
    }

    return Promise.reject(error);
  },
);

/** Extracts the structured error body the backend returns, if present. */
export function extractApiError(error: unknown): ApiErrorBody | null {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorBody>;
    if (axiosError.response?.data?.status) {
      return axiosError.response.data;
    }
  }
  return null;
}

export function errorMessage(error: unknown): string {
  const apiError = extractApiError(error);
  if (apiError) return apiError.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
