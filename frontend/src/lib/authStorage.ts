import type { AuthResponse, AuthUser } from '../types/auth';

const TOKEN_KEY = 'expense-tracker.token';
const USER_KEY = 'expense-tracker.user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function storeAuth(auth: AuthResponse): void {
  localStorage.setItem(TOKEN_KEY, auth.token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({ email: auth.email, displayName: auth.displayName }),
  );
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
