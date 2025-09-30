import { NextResponse } from 'next/server';

/**
 * Додає заголовки для відключення кешування до відповіді
 * @param response - NextResponse об'єкт
 * @returns NextResponse з заголовками no-cache
 */
export function addNoCacheHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Last-Modified', new Date().toUTCString());
  response.headers.set('ETag', `"${Date.now()}"`);
  
  return response;
}

/**
 * Створює JSON відповідь з заголовками no-cache
 * @param data - дані для відповіді
 * @param status - HTTP статус код
 * @returns NextResponse з JSON даними та заголовками no-cache
 */
export function createNoCacheResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  return addNoCacheHeaders(response);
}

