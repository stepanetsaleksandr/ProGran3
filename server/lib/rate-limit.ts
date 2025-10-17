/**
 * Rate Limiting
 * Захист від brute-force attacks та DDoS
 * 
 * Підтримує два режими:
 * 1. Simple (in-memory) - для розробки
 * 2. Upstash Redis - для production
 */

// Спроба імпорту Upstash (якщо встановлено)
let Ratelimit: any = null;
let Redis: any = null;

try {
  const upstashRatelimit = require('@upstash/ratelimit');
  const upstashRedis = require('@upstash/redis');
  Ratelimit = upstashRatelimit.Ratelimit;
  Redis = upstashRedis.Redis;
} catch (error) {
  console.log('[Rate Limit] Upstash not installed, using simple in-memory rate limiting');
}

// ============================================
// SIMPLE IN-MEMORY RATE LIMITING
// ============================================

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const simpleCache = new Map<string, RateLimitRecord>();

/**
 * Simple rate limiter (для розробки або коли Upstash не налаштовано)
 */
function simpleRateLimit(
  identifier: string,
  maxRequests: number,
  windowSeconds: number
): { allowed: boolean; limit: number; remaining: number; reset: number } {
  
  const now = Math.floor(Date.now() / 1000);
  const existing = simpleCache.get(identifier);
  
  // Видаляємо застарілі записи
  if (existing && existing.resetAt < now) {
    simpleCache.delete(identifier);
  }
  
  // Створюємо новий запис
  if (!simpleCache.has(identifier)) {
    simpleCache.set(identifier, {
      count: 1,
      resetAt: now + windowSeconds
    });
    
    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: now + windowSeconds
    };
  }
  
  // Інкрементуємо лічильник
  const record = simpleCache.get(identifier)!;
  record.count++;
  
  // Перевірка ліміту
  const allowed = record.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - record.count);
  
  return {
    allowed,
    limit: maxRequests,
    remaining,
    reset: record.resetAt
  };
}

// ============================================
// UPSTASH REDIS RATE LIMITING
// ============================================

let redis: any = null;
let rateLimiters: any = null;

/**
 * Ініціалізація Upstash Redis (якщо налаштовано)
 */
function initializeUpstash() {
  if (!Ratelimit || !Redis) {
    return false;
  }
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.log('[Rate Limit] Upstash credentials not configured');
    return false;
  }
  
  try {
    redis = Redis.fromEnv();
    
    rateLimiters = {
      // Для активації (строгий)
      activate: new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(5, '60 s'), // 5 запитів за хвилину
        analytics: true,
        prefix: 'ratelimit:activate',
      }),
      
      // Для валідації (м'який)
      validate: new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(30, '60 s'), // 30 запитів за хвилину
        prefix: 'ratelimit:validate',
      }),
      
      // Для генерації (середній)
      generate: new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(10, '60 s'), // 10 запитів за хвилину
        prefix: 'ratelimit:generate',
      }),
      
      // По IP (загальний)
      byIp: new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(100, '60 s'), // 100 запитів за хвилину
        prefix: 'ratelimit:ip',
      }),
    };
    
    console.log('[Rate Limit] Upstash Redis initialized successfully');
    return true;
  } catch (error) {
    console.error('[Rate Limit] Upstash initialization failed:', error);
    return false;
  }
}

const upstashInitialized = initializeUpstash();

// ============================================
// UNIFIED API
// ============================================

export type RateLimitType = 'activate' | 'validate' | 'generate' | 'byIp';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Перевіряє rate limit для ідентифікатора
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'byIp'
): Promise<RateLimitResult> {
  
  // Якщо Upstash налаштовано - використовуємо його
  if (upstashInitialized && rateLimiters && rateLimiters[type]) {
    try {
      const result = await rateLimiters[type].limit(identifier);
      
      return {
        allowed: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset
      };
    } catch (error) {
      console.error('[Rate Limit] Upstash error, falling back to simple:', error);
      // Fallback до simple
    }
  }
  
  // Fallback: Simple in-memory rate limiting
  const limits: Record<RateLimitType, { max: number; window: number }> = {
    activate: { max: 5, window: 60 },
    validate: { max: 30, window: 60 },
    generate: { max: 10, window: 60 },
    byIp: { max: 100, window: 60 },
  };
  
  const config = limits[type];
  return simpleRateLimit(identifier, config.max, config.window);
}

/**
 * Отримує IP адресу з request
 */
export function getClientIp(request: Request): string {
  // Vercel/Next.js headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * Перевіряє чи Upstash налаштовано
 */
export function isUpstashEnabled(): boolean {
  return upstashInitialized;
}

/**
 * Очищає простий cache (для тестування)
 */
export function clearSimpleCache(): void {
  simpleCache.clear();
  console.log('[Rate Limit] Simple cache cleared');
}

