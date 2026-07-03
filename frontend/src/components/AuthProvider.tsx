import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../lib/authContext';
import { clearAuth, getStoredUser, getToken, storeAuth } from '../lib/authStorage';
import type { AuthResponse, AuthUser } from '../types/auth';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(() =>
    getToken() ? getStoredUser() : null,
  );

  const login = useCallback((auth: AuthResponse) => {
    storeAuth(auth);
    setUser({ email: auth.email, displayName: auth.displayName });
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, isAuthenticated: user !== null, login, logout }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
