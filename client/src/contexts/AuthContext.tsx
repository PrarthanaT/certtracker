import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { loginApi, registerApi } from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string) => void;
  logout: () => void;
}

// ─── Token helpers ────────────────────────────────────────────────────────────

const TOKEN_KEY = 'auth_token';

function readStoredSession(): { user: AuthUser; token: string } | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64));
    // Reject expired tokens
    if (!payload.userId || !payload.email || payload.exp * 1000 < Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return { token, user: { id: payload.userId, email: payload.email } };
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ user: AuthUser; token: string } | null>(
    () => readStoredSession()
  );

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginApi(email, password);
    localStorage.setItem(TOKEN_KEY, data.token);
    setSession({ user: data.user, token: data.token });
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const data = await registerApi(email, password);
    localStorage.setItem(TOKEN_KEY, data.token);
    setSession({ user: data.user, token: data.token });
  }, []);

  const loginWithToken = useCallback((token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    const s = readStoredSession();
    if (s) setSession(s);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user: session?.user ?? null,
      token: session?.token ?? null,
      login,
      register,
      loginWithToken,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
