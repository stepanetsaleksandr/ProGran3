import { NextResponse } from 'next/server';

/**
 * Cache control utilities for API responses
 */

export interface CacheOptions {
  maxAge?: number; // seconds
  staleWhileRevalidate?: number; // seconds
  public?: boolean;
  immutable?: boolean;
}

/**
 * Add cache headers to a response
 */
export function withCache(
  response: NextResponse,
  options: CacheOptions = {}
): NextResponse {
  const {
    maxAge = 0,
    staleWhileRevalidate = 0,
    public: isPublic = false,
    immutable = false,
  } = options;

  const cacheControl: string[] = [];

  if (isPublic) {
    cacheControl.push('public');
  } else {
    cacheControl.push('private');
  }

  if (maxAge > 0) {
    cacheControl.push(`max-age=${maxAge}`);
  } else {
    cacheControl.push('no-cache');
  }

  if (staleWhileRevalidate > 0) {
    cacheControl.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  if (immutable) {
    cacheControl.push('immutable');
  }

  response.headers.set('Cache-Control', cacheControl.join(', '));

  return response;
}

/**
 * Preset cache configurations
 */
export const CachePresets = {
  // No caching - always fresh data
  noCache: { maxAge: 0, public: false },

  // Short cache - 1 minute
  short: { maxAge: 60, staleWhileRevalidate: 30, public: true },

  // Medium cache - 5 minutes
  medium: { maxAge: 300, staleWhileRevalidate: 60, public: true },

  // Long cache - 1 hour
  long: { maxAge: 3600, staleWhileRevalidate: 300, public: true },

  // Static content - 1 day
  static: { maxAge: 86400, immutable: true, public: true },
};

/**
 * Helper to create cached API success response
 */
export function cachedApiSuccess<T>(
  data: T,
  cache: CacheOptions | keyof typeof CachePresets,
  message?: string,
  status: number = 200
): NextResponse {
  const cacheOptions = typeof cache === 'string' ? CachePresets[cache] : cache;

  const response = NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );

  return withCache(response, cacheOptions);
}

