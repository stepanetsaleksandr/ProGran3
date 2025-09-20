import { NextRequest, NextResponse } from 'next/server';
import { upsertPlugin } from '@/lib/database';
import { HeartbeatRequest, HeartbeatResponse, ErrorResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Отримуємо IP адресу клієнта
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';

    // Парсимо дані з запиту
    const data: HeartbeatRequest = await request.json();

    // Валідація обов'язкових полів
    const requiredFields = ['plugin_id', 'plugin_name', 'version', 'user_id', 'computer_name'];
    for (const field of requiredFields) {
      if (!data[field as keyof HeartbeatRequest] || 
          String(data[field as keyof HeartbeatRequest]).trim() === '') {
        const errorResponse: ErrorResponse = {
          success: false,
          error: `Missing required field: ${field}`,
          code: 'MISSING_FIELD'
        };
        return NextResponse.json(errorResponse, { status: 400 });
      }
    }

    // Валідація plugin_id формату
    if (!data.plugin_id.match(/^progran3-[a-z0-9-]+$/)) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Invalid plugin_id format',
        code: 'INVALID_PLUGIN_ID'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Валідація timestamp формату
    const timestamp = new Date(data.timestamp);
    if (isNaN(timestamp.getTime())) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Invalid timestamp format',
        code: 'INVALID_TIMESTAMP'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Оновлюємо або створюємо запис в базі даних
    const result = await upsertPlugin(data, ipAddress);

    // Формуємо відповідь
    const response: HeartbeatResponse = {
      success: true,
      message: 'Heartbeat updated successfully',
      plugin: {
        id: result.id,
        plugin_id: result.plugin_id,
        last_heartbeat: result.last_heartbeat,
        is_active: result.is_active
      }
    };

    // Додаємо заголовки для уникнення кешування
    const nextResponse = NextResponse.json(response);
    nextResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    nextResponse.headers.set('Pragma', 'no-cache');
    nextResponse.headers.set('Expires', '0');

    return nextResponse;

  } catch (error) {
    console.error('❌ Heartbeat API error:', error);
    
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
