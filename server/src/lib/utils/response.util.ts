import { NextResponse } from 'next/server';
import { ApiError } from '../errors/api.error';

// Стандартизовані відповіді API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

export function createErrorResponse(error: string, message?: string): ApiResponse {
  return {
    success: false,
    error,
    message,
    timestamp: new Date().toISOString()
  };
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      createErrorResponse(error.code, error.message),
      { 
        status: error.statusCode,
        headers: getNoCacheHeaders()
      }
    );
  }
  
  if (error instanceof Error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { 
        status: 500,
        headers: getNoCacheHeaders()
      }
    );
  }
  
  console.error('Unknown error:', error);
  return NextResponse.json(
    createErrorResponse('UNKNOWN_ERROR', 'Unknown error occurred'),
    { 
      status: 500,
      headers: getNoCacheHeaders()
    }
  );
}

export function getNoCacheHeaders() {
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
}

export function createNoCacheResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: getNoCacheHeaders()
  });
}
