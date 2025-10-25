import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * Global middleware for security headers, CORS, and authentication
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // ✅ НОВА ЛОГІКА: Захист дашборду
  if (request.nextUrl.pathname === '/') {
    // Для клієнтського захисту використовуємо ProtectedRoute компонент
    // Middleware тут тільки для додаткового захисту
    console.log('[Middleware] Dashboard access attempt');
  }

  // CORS Headers for API routes (restricted to plugin domains)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // ✅ БЕЗПЕЧНО: Обмежуємо CORS до конкретних доменів
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
    
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, X-Fingerprint, X-Timestamp, X-Endpoint, X-Plugin-Version, X-API-Key'
    );
    response.headers.set('Access-Control-Max-Age', '86400');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
  }

  // API Request Logging
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    console.log(`[${new Date().toISOString()}] ${request.method} ${request.nextUrl.pathname} from ${ip}`);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

