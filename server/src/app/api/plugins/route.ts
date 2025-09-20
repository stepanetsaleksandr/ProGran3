import { NextRequest, NextResponse } from 'next/server';
import { getAllPlugins, getPluginStats } from '@/lib/database';
import { PluginsResponse, ErrorResponse, PluginRecord } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // Отримуємо всі плагіни та статистику
    const [plugins, stats] = await Promise.all([
      getAllPlugins(),
      getPluginStats()
    ]);

    // Формуємо відповідь
    const response: PluginsResponse = {
      success: true,
      data: {
        plugins: plugins as PluginRecord[],
        stats,
        last_updated: new Date().toISOString()
      }
    };

    // Додаємо заголовки для уникнення кешування
    const nextResponse = NextResponse.json(response);
    nextResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    nextResponse.headers.set('Pragma', 'no-cache');
    nextResponse.headers.set('Expires', '0');

    return nextResponse;

  } catch (error) {
    console.error('❌ Plugins API error:', error);
    
    const errorResponse: ErrorResponse = {
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Обробка OPTIONS запиту для CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
