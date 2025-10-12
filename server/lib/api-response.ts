import { NextResponse } from 'next/server';

/**
 * Standardized API response handlers
 */

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: any;
  code?: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Success response helper
 */
export function apiSuccess<T>(data: T, message?: string, status: number = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message })
    },
    { status }
  );
}

/**
 * Error response helper
 */
export function apiError(
  error: string | Error,
  status: number = 500,
  details?: any,
  code?: string
): NextResponse<ApiErrorResponse> {
  const errorMessage = error instanceof Error ? error.message : error;
  
  // Log error for debugging (don't expose sensitive info to client)
  if (status >= 500) {
    console.error('API Error:', {
      message: errorMessage,
      details,
      code,
      stack: error instanceof Error ? error.stack : undefined
    });
  }

  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      ...(details && { details }),
      ...(code && { code })
    },
    { status }
  );
}

/**
 * Validation error response
 */
export function apiValidationError(errors: any): NextResponse<ApiErrorResponse> {
  return apiError(
    'Validation failed',
    400,
    errors,
    'VALIDATION_ERROR'
  );
}

/**
 * Not found error response
 */
export function apiNotFound(resource: string = 'Resource'): NextResponse<ApiErrorResponse> {
  return apiError(
    `${resource} not found`,
    404,
    undefined,
    'NOT_FOUND'
  );
}

/**
 * Unauthorized error response
 */
export function apiUnauthorized(message: string = 'Unauthorized'): NextResponse<ApiErrorResponse> {
  return apiError(
    message,
    401,
    undefined,
    'UNAUTHORIZED'
  );
}

/**
 * Forbidden error response
 */
export function apiForbidden(message: string = 'Forbidden'): NextResponse<ApiErrorResponse> {
  return apiError(
    message,
    403,
    undefined,
    'FORBIDDEN'
  );
}

/**
 * Rate limit error response
 */
export function apiRateLimit(resetTime?: Date): NextResponse<ApiErrorResponse> {
  const response = apiError(
    'Too many requests. Please try again later.',
    429,
    resetTime ? { resetAt: resetTime.toISOString() } : undefined,
    'RATE_LIMIT_EXCEEDED'
  );

  if (resetTime) {
    response.headers.set('X-RateLimit-Reset', resetTime.toISOString());
  }

  return response;
}

