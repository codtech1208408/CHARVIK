import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (emailOrUser: string, pass: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('charvik_user');
      if (!saved || saved === 'undefined' || saved === 'null') return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('charvik_token');
      if (!saved || saved === 'undefined' || saved === 'null') return null;
      return saved;
    } catch {
      return null;
    }
  });

  // Never block rendering on refresh when stored user session is present
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function verifyAuth() {
      const currentToken = localStorage.getItem('charvik_token');
      if (!currentToken) return;

      try {
        const res = await api.getMe();
        if (res && res.user && res.user.role) {
          setUser(res.user);
          localStorage.setItem('charvik_user', JSON.stringify(res.user));
        }
      } catch (err: any) {
        // Never log out on background sync or refresh error
        console.warn('Background auth sync note; retaining active session:', err?.message || err);
      }
    }
    verifyAuth();
  }, []);

  const login = async (emailOrUser: string, pass: string): Promise<User> => {
    const res = await api.login({ email_or_username: emailOrUser, password: pass });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('charvik_token', res.token);
    localStorage.setItem('charvik_user', JSON.stringify(res.user));
    return res.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('charvik_token');
    localStorage.removeItem('charvik_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
