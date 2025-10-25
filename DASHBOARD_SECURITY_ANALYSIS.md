# 🔐 АНАЛІЗ БЕЗПЕКИ ДАШБОРДУ PROGRAN3

**Дата:** 25 жовтня 2025  
**Проблема:** Дашборд не захищений логіном  
**Статус:** 🚨 КРИТИЧНА ВРАЗЛИВІСТЬ

---

## 🚨 ПОТОЧНА ПРОБЛЕМА

### **Критична вразливість:**
```
❌ ДАШБОРД ДОСТУПНИЙ БЕЗ АУТЕНТИФІКАЦІЇ
URL: https://server-9mthuudy4-provis3ds-projects.vercel.app/
```

**Ризики:**
- 🔴 **Повний доступ** до всіх ліцензій
- 🔴 **Видалення ліцензій** без дозволу
- 🔴 **Перегляд конфіденційних даних** користувачів
- 🔴 **Маніпуляція системою** зловмисниками

---

## 🔍 АНАЛІЗ ПОТОЧНОЇ СТРУКТУРИ

### **1. Поточна архітектура:**

```
┌────────────────────────────────────────────────────────────┐
│                    CLIENT SIDE                            │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Dashboard  │  │   Hooks      │  │   Components    │  │
│  │              │  │              │  │                 │  │
│  │ • page.tsx   │  │ • useStats   │  │ • LicenseMgr   │  │
│  │ • layout.tsx │  │ • useLicenses│  │ • SystemMonitor │  │
│  │ • globals.css│  │ • getAuthToken│  │ • Tabs          │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────────────┘  │
│         │                 │                                │
│         └─────────────────┼────────────────────────────────┤
│                           │ HTTP Requests (NO AUTH!)      │
└───────────────────────────┼────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────┐
│                    SERVER SIDE                            │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │   API Routes   │  │   Middleware   │  │  Database    │ │
│  │                │  │                │  │              │ │
│  │ • /api/licenses│  │ • CORS         │  │ • Supabase   │ │
│  │ • /api/stats   │  │ • Headers      │  │ • PostgreSQL │ │
│  │ • /api/auth    │  │ • Logging      │  │ • RLS        │ │
│  └────────┬───────┘  └────────────────┘  └──────────────┘ │
│           │                                                │
│  ┌────────▼────────────────────────────────────────────┐  │
│  │              NO AUTHENTICATION!                    │  │
│  │              ❌ ПУБЛІЧНИЙ ДОСТУП                    │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### **2. Проблемні місця:**

| Компонент | Проблема | Ризик |
|-----------|----------|-------|
| **`/` (page.tsx)** | Прямий доступ до Dashboard | 🔴 Критичний |
| **`/api/licenses`** | Немає аутентифікації | 🔴 Критичний |
| **`/api/dashboard/stats`** | Тільки API Key (легко обійти) | 🟡 Високий |
| **`useDashboardStats`** | Немає перевірки токену | 🔴 Критичний |
| **`useLicenses`** | JWT токен, але без захисту UI | 🟡 Високий |

---

## 💡 ВАРІАНТИ РІШЕННЯ

### **🎯 РЕКОМЕНДОВАНИЙ ПІДХІД: Next.js Middleware + JWT**

**Переваги:**
- ✅ **Простота**: Мінімальні зміни
- ✅ **Безпека**: Server-side валідація
- ✅ **UX**: Автоматичне перенаправлення
- ✅ **Масштабованість**: Легко розширювати

---

## 🛠️ ПЛАН РЕАЛІЗАЦІЇ

### **Крок 1: Створення Login сторінки**

```typescript
// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        // Зберігаємо токен
        localStorage.setItem('admin_token', data.data.token);
        localStorage.setItem('admin_token_expiry', 
          (Date.now() + data.data.expires_in * 1000).toString()
        );
        
        // Перенаправляємо на дашборд
        router.push('/');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ProGran3 Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Введіть облікові дані для доступу
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Вхід...' : 'Увійти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### **Крок 2: Оновлення Middleware**

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers (існуючі)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // ✅ НОВА ЛОГІКА: Захист дашборду
  if (request.nextUrl.pathname === '/') {
    const token = request.cookies.get('admin_token')?.value;
    
    if (!token) {
      // Немає токену - перенаправляємо на логін
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Перевіряємо токен
    const authResult = validateToken(token);
    if (!authResult.valid) {
      // Токен невалідний - перенаправляємо на логін
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Захист API endpoints
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Публічні endpoints (не потребують аутентифікації)
    const publicEndpoints = [
      '/api/licenses/activate',
      '/api/licenses/validate', 
      '/api/heartbeats',
      '/api/systems',
      '/api/auth/login'
    ];

    const isPublic = publicEndpoints.some(endpoint => 
      request.nextUrl.pathname.startsWith(endpoint)
    );

    if (!isPublic) {
      // Захищені endpoints - перевіряємо аутентифікацію
      const authHeader = request.headers.get('Authorization');
      const apiKey = request.headers.get('X-API-Key');
      
      if (!authHeader && !apiKey) {
        return new NextResponse(
          JSON.stringify({ success: false, error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }

  // CORS для API (існуюча логіка)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const allowedOrigins = [
      'https://app.sketchup.com',
      'https://www.sketchup.com',
      'https://localhost:3000',
      'https://127.0.0.1:3000'
    ];
    
    const origin = request.headers.get('origin');
    if (allowedOrigins.includes(origin || '')) {
      response.headers.set('Access-Control-Allow-Origin', origin || '');
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    response.headers.set('Access-Control-Max-Age', '86400');

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### **Крок 3: Auth Context для клієнта**

```typescript
// app/context/AuthContext.tsx
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
    
    if (token && expiry && parseInt(expiry) > Date.now()) {
      setIsAuthenticated(true);
    } else {
      // Токен прострочений або відсутній
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_token_expiry');
      setIsAuthenticated(false);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('admin_token', data.data.token);
        localStorage.setItem('admin_token_expiry', 
          (Date.now() + data.data.expires_in * 1000).toString()
        );
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_token_expiry');
    setIsAuthenticated(false);
    router.push('/login');
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
```

### **Крок 4: Оновлення Layout**

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './context/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ProGran3 Server',
  description: 'ProGran3 License Management Server',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

### **Крок 5: Оновлення Dashboard з Logout**

```typescript
// app/components/Dashboard.tsx (додати logout кнопку)
'use client';

import { useAuth } from '../context/AuthContext';
// ... існуючі імпорти

function DashboardContent() {
  const { logout } = useAuth();
  // ... існуючий код

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ProGran3 Dashboard</h1>
              <p className="mt-2 text-gray-600">Управління ліцензіями та моніторинг систем</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={refreshStats}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Оновити
              </button>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Вийти
              </button>
            </div>
          </div>
        </div>
        {/* ... решта компоненту */}
      </div>
    </div>
  );
}
```

---

## 🎯 АЛЬТЕРНАТИВНІ ПІДХОДИ

### **Варіант 1: Session-based Authentication**

```typescript
// Використання NextAuth.js
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Перевірка credentials
        if (credentials?.username === 'admin' && credentials?.password === 'admin123') {
          return { id: '1', name: 'Admin', email: 'admin@progran3.com' }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.user = user
      return token
    },
    async session({ session, token }) {
      session.user = token.user
      return session
    }
  }
})
```

**Переваги:**
- ✅ Стандартний підхід
- ✅ Автоматичне управління сесіями
- ✅ Вбудовані хуки

**Недоліки:**
- ⚠️ Додаткова залежність
- ⚠️ Більше конфігурації

### **Варіант 2: HTTP Basic Auth**

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  if (request.nextUrl.pathname === '/') {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="ProGran3 Admin"'
        }
      });
    }
    
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [username, password] = credentials.split(':');
    
    if (username !== 'admin' || password !== 'admin123') {
      return new NextResponse('Invalid credentials', { status: 401 });
    }
  }
  
  return response;
}
```

**Переваги:**
- ✅ Найпростіший підхід
- ✅ Вбудована підтримка браузера
- ✅ Мінімальний код

**Недоліки:**
- ⚠️ Менш гнучкий
- ⚠️ Немає logout функціональності
- ⚠️ Credentials в URL

---

## 🏆 РЕКОМЕНДАЦІЯ

### **🎯 НАЙКРАЩИЙ ПІДХІД: JWT + Middleware**

**Чому саме цей підхід:**

1. **✅ Простота**: Мінімальні зміни в існуючому коді
2. **✅ Безпека**: Server-side валідація токенів
3. **✅ UX**: Автоматичне перенаправлення + logout
4. **✅ Масштабованість**: Легко додати ролі та дозволи
5. **✅ Сумісність**: Працює з існуючою JWT системою

### **План впровадження:**

1. **День 1**: Створити login сторінку + AuthContext
2. **День 2**: Оновити middleware для захисту
3. **День 3**: Додати logout функціональність
4. **День 4**: Тестування + деплой

### **Очікуваний результат:**

```
🔐 ЗАХИЩЕНИЙ ДАШБОРД
├── /login - Сторінка аутентифікації
├── / - Захищений дашборд (тільки з токеном)
├── Автоматичне перенаправлення
├── Logout функціональність
└── Server-side валідація
```

---

**Статус:** 🟡 ГОТОВО ДО РЕАЛІЗАЦІЇ  
**Складність:** 🟢 ПРОСТА (2-3 дні)  
**Безпека:** 🟢 МАКСИМАЛЬНА
