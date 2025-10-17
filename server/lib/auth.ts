import { NextRequest } from 'next/server';
import { apiUnauthorized } from './api-response';

/**
 * Validates API Key from request headers
 * @param request NextRequest
 * @returns true if valid, false otherwise
 */
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-API-Key');
  const validKeys = (process.env.API_KEYS || '').split(',').filter(Boolean);
  
  return !!(apiKey && validKeys.includes(apiKey));
}

/**
 * Middleware wrapper that requires API Key
 */
export function requireApiKey(handler: Function) {
  return async (request: NextRequest, context?: any) => {
    if (!validateApiKey(request)) {
      console.warn('[Auth] Unauthorized API request:', request.nextUrl.pathname);
      return apiUnauthorized('Valid API key required. Please include X-API-Key header.');
    }
    
    return handler(request, context);
  };
}


