import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from './supabase';
import { apiError, apiUnauthorized } from './api-response';
import { SupabaseClient } from '@supabase/supabase-js';
import { validateAuth } from './auth';
import { requireHMAC, isHMACEnabled } from './hmac';

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
        const authResult = validateAuth(request);
        
        if (!authResult.valid) {
          return apiUnauthorized(authResult.error || 'Authentication required');
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
  return async (request: NextRequest, routeContext?: { params: any }): Promise<NextResponse> => {
    const startTime = Date.now();

    try {
      // Optional request logging
      console.log(`[API] ${request.method} ${request.nextUrl.pathname}`);

      // Create Supabase client
      let supabase: SupabaseClient;
      try {
        supabase = createSupabaseClient();
      } catch (error) {
        return apiError('Database configuration error', 500);
      }

      // Optional HMAC verification (only if enabled)
      if (isHMACEnabled()) {
        console.log('[API] HMAC verification enabled, checking signature...');
        const hmacResult = await requireHMAC(request);
        if (!hmacResult.valid) {
          return apiError(hmacResult.error || 'HMAC verification failed', 401);
        }
        console.log('[API] HMAC verification passed');
      } else {
        console.log('[API] HMAC verification disabled, skipping...');
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
      const duration = Date.now() - startTime;
      console.log(`[API] ${request.method} ${request.nextUrl.pathname} - ${duration}ms`);

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

