import { apiClient } from './client';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

const BASE = '/api/v1/auth';

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(`${BASE}/login`, request);
  return data;
}

export async function register(request: RegisterRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(`${BASE}/register`, request);
  return data;
}
