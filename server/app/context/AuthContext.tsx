'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Перевіряємо токен при завантаженні
    const token = localStorage.getItem('admin_token');
    const expiry = localStorage.getItem('admin_token_expiry');
    
    console.log('[AuthContext] Checking token:', { token: !!token, expiry, now: Date.now() });
    
    if (token && expiry && parseInt(expiry) > Date.now()) {
      console.log('[AuthContext] Valid token found');
      setIsAuthenticated(true);
    } else {
      console.log('[AuthContext] No valid token, clearing storage');
      // Токен прострочений або відсутній
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_token_expiry');
      // Видаляємо cookie
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      setIsAuthenticated(false);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('[AuthContext] Attempting login for:', username);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      console.log('[AuthContext] Login response:', { success: data.success, hasToken: !!data.data?.token });

      if (data.success) {
        // Зберігаємо токен в localStorage
        localStorage.setItem('admin_token', data.data.token);
        localStorage.setItem('admin_token_expiry', 
          (Date.now() + data.data.expires_in * 1000).toString()
        );
        
        // Також зберігаємо в cookies для middleware
        document.cookie = `admin_token=${data.data.token}; path=/; max-age=${data.data.expires_in}; secure; samesite=strict`;
        
        console.log('[AuthContext] Token saved, setting authenticated');
        setIsAuthenticated(true);
        return true;
      }
      
      console.log('[AuthContext] Login failed:', data.error);
      return false;
    } catch (error) {
      console.log('[AuthContext] Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_token_expiry');
    
    // Видаляємо cookie
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    setIsAuthenticated(false);
    // Використовуємо window.location для надійного перенаправлення
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
