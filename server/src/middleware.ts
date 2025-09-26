import { NextRequest, NextResponse } from 'next/server';

// Rate limiting storage (в продакшні використовуйте Redis)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

// Конфігурація rate limiting
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1 хвилина
  maxRequests: 100, // Максимум 100 запитів на хвилину
  heartbeatMaxRequests: 20, // Максимум 20 heartbeat на хвилину
  licenseMaxRequests: 5, // Максимум 5 реєстрацій ліцензій на хвилину
};

// Очищення застарілих записів кожні 5 хвилин
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimit.entries());
  for (const [ip, data] of entries) {
    if (now > data.resetTime) {
      rateLimit.delete(ip);
    }
  }
}, 5 * 60 * 1000);

function getRateLimitKey(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             request.ip || 
             '127.0.0.1';
  return ip.split(',')[0].trim();
}

function checkRateLimit(ip: string, maxRequests: number): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowMs = RATE_LIMIT_CONFIG.windowMs;
  
  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }
  
  const userLimit = rateLimit.get(ip)!;
  
  if (now > userLimit.resetTime) {
    // Окно сброшено
    userLimit.count = 1;
    userLimit.resetTime = now + windowMs;
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }
  
  if (userLimit.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: userLimit.resetTime };
  }
  
  userLimit.count++;
  return { allowed: true, remaining: maxRequests - userLimit.count, resetTime: userLimit.resetTime };
}

export function middleware(request: NextRequest) {
  const ip = getRateLimitKey(request);
  const pathname = request.nextUrl.pathname;
  
  // Визначаємо ліміти залежно від endpoint
  let maxRequests = RATE_LIMIT_CONFIG.maxRequests;
  
  if (pathname.startsWith('/api/heartbeat')) {
    maxRequests = RATE_LIMIT_CONFIG.heartbeatMaxRequests;
  } else if (pathname.startsWith('/api/license/register')) {
    maxRequests = RATE_LIMIT_CONFIG.licenseMaxRequests;
  }
  
  const rateLimitResult = checkRateLimit(ip, maxRequests);
  
  if (!rateLimitResult.allowed) {
    const response = NextResponse.json(
      {
        success: false,
        error: 'Too Many Requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      },
      { status: 429 }
    );
    
    response.headers.set('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString());
    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
    
    return response;
  }
  
  // Додаємо заголовки rate limiting до всіх відповідей
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
  
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
