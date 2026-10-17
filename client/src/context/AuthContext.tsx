import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (emailOrUser: string, pass: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('charvik_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('charvik_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const res = await api.getMe();
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('charvik_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session expired or invalid:', err);
          logout();
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, [token]);

  const login = async (emailOrUser: string, pass: string) => {
    const res = await api.login({ email_or_username: emailOrUser, password: pass });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('charvik_token', res.token);
    localStorage.setItem('charvik_user', JSON.stringify(res.user));
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
