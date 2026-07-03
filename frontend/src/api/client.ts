import axios, { AxiosError } from 'axios';
import type { ApiErrorBody } from '../types/expense';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

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
