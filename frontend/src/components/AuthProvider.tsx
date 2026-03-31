import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fixedApiService } from '../services/fixedApi';
import type { SessionUser } from '../services/fixedApi';

const AUTH_CHANGE_EVENT = 'pymastery-auth-changed';

interface AuthContextType {
  user: SessionUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ requires_otp?: boolean }>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ requires_otp?: boolean; warning?: string }>;
  logout: () => Promise<void>;
  updateRole: (role: string) => Promise<void>;
  refreshFromStorage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const emitAuthChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
};

const parseStoredUser = (): SessionUser | null => {
  const rawUser = localStorage.getItem('user');

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as SessionUser;
  } catch (error) {
    console.error('Failed to parse stored user:', error);
    localStorage.removeItem('user');
    return null;
  }
};

const readStoredSession = () => ({
  token: localStorage.getItem('access_token'),
  user: parseStoredUser()
});

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshFromStorage = useCallback(() => {
    const session = readStoredSession();
    setUser(session.user);
    setToken(session.token);
    setLoading(false);
  }, []);

  const applySession = useCallback((nextUser: SessionUser | null, nextToken?: string | null) => {
    if (nextUser) {
      localStorage.setItem('user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('user');
    }

    const resolvedToken = nextToken ?? localStorage.getItem('access_token');
    setUser(nextUser ?? null);
    setToken(resolvedToken);
    emitAuthChange();
  }, []);

  useEffect(() => {
    refreshFromStorage();

    const handleAuthChange = () => {
      refreshFromStorage();
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    };
  }, [refreshFromStorage]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await fixedApiService.auth.login(email, password);

      if (response.requires_otp) {
        return { requires_otp: true, warning: response.warning };
      }

      if (!response.success || !response.user || !response.token) {
        throw new Error(response.message || 'Login failed');
      }

      applySession(response.user, response.token);
      return { requires_otp: false, warning: response.warning };
    },
    [applySession]
  );

  const verifyOtp = useCallback(
    async (email: string, otp: string) => {
      const response = await fixedApiService.auth.verifyOtp(email, otp);
      if (!response.success || !response.user || !response.token) {
        throw new Error(response.message || 'OTP Verification failed');
      }
      applySession(response.user, response.token);
    },
    [applySession]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const response = await fixedApiService.auth.register({
        name,
        email,
        password,
        role_track: 'general',
        agree_terms: true
      });

      if (response.requires_otp) {
        return { requires_otp: true };
      }

      if (!response.success || !response.user || !response.token) {
        throw new Error(response.message || 'Registration failed');
      }

      applySession(response.user, response.token);
      return { requires_otp: false, warning: response.warning };
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await fixedApiService.auth.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('token_expires_at');
      setUser(null);
      setToken(null);
      emitAuthChange();
    }
  }, []);

  const updateRole = useCallback(
    async (role: string) => {
      const nextUser = user ? { ...user, role_track: role } : { role_track: role };

      await fixedApiService.auth.updateProfile({ role_track: role });
      applySession(nextUser, token);
    },
    [applySession, token, user]
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      verifyOtp,
      register,
      logout,
      updateRole,
      refreshFromStorage
    }),
    [loading, login, verifyOtp, logout, refreshFromStorage, register, token, updateRole, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
