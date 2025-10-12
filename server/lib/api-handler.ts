import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from './supabase';
import { apiError, apiUnauthorized } from './api-response';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * API Handler context
 */
export interface ApiContext {
  supabase: SupabaseClient;
  request: NextRequest;
  params?: any;
}

/**
 * API Handler function type
 */
export type ApiHandler = (
  context: ApiContext
) => Promise<NextResponse> | NextResponse;

/**
 * Wrapper for API handlers with common functionality:
 * - Supabase client injection
 * - Error handling
 * - Request logging (optional)
 */
export function withApiHandler(
  handler: ApiHandler,
  options?: {
    requireAuth?: boolean;
    logRequests?: boolean;
  }
) {
  return async (request: NextRequest, routeContext?: { params: any }): Promise<NextResponse> => {
    const startTime = Date.now();

    try {
      // Optional request logging
      if (options?.logRequests) {
        console.log(`[API] ${request.method} ${request.nextUrl.pathname}`);
      }

      // Create Supabase client
      let supabase: SupabaseClient;
      try {
        supabase = createSupabaseClient();
      } catch (error) {
        return apiError('Database configuration error', 500);
      }

      // Optional authentication check
      if (options?.requireAuth) {
        const apiKey = request.headers.get('X-API-Key');
        const validKeys = (process.env.API_KEYS || '').split(',').filter(Boolean);

        if (!apiKey || !validKeys.includes(apiKey)) {
          return apiUnauthorized('Valid API key required');
        }
      }

      // Create context
      const context: ApiContext = {
        supabase,
        request,
        params: routeContext?.params
      };

      // Execute handler
      const response = await handler(context);

      // Optional response time logging
      if (options?.logRequests) {
        const duration = Date.now() - startTime;
        console.log(`[API] ${request.method} ${request.nextUrl.pathname} - ${duration}ms`);
      }

      return response;
    } catch (error) {
      console.error('[API] Unhandled error:', error);
      return apiError(
        error instanceof Error ? error.message : 'Internal server error',
        500
      );
    }
  };
}

/**
 * Shorthand for authenticated API handlers
 */
export function withAuth(handler: ApiHandler) {
  return withApiHandler(handler, { requireAuth: true, logRequests: true });
}

/**
 * Shorthand for public API handlers with logging
 */
export function withPublicApi(handler: ApiHandler) {
  return withApiHandler(handler, { requireAuth: false, logRequests: true });
}

