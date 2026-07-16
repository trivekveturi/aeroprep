'use client';
/**
 * AuthProvider — wraps the app with a React context holding the current user.
 * All client components read user info from useAuth() instead of fetching themselves.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface AuthUser {
  userId: string;
  username: string;
  displayName: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]     = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    // Clear session stats so the next user starts fresh
    if (typeof window !== 'undefined') {
      const { clearSessionStats } = await import('@/lib/sessionStore');
      clearSessionStats();
    }
    setUser(null);
    window.location.href = '/login';
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
