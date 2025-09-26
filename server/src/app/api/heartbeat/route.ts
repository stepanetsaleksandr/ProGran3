import { NextRequest, NextResponse } from 'next/server';
import { upsertPlugin, markPluginInactive } from '@/lib/database';
import { HeartbeatRequest, HeartbeatResponse, ErrorResponse } from '@/lib/types';
import { ErrorHandler } from '@/lib/error-handler';
import { SecureLogger } from '@/lib/secure-logger';
import { LicenseValidator } from '@/lib/license-validator';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.STORAGE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    // Отримуємо IP адресу клієнта
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';

    // Парсимо дані з запиту
    const data: HeartbeatRequest = await request.json();
    
    // Безпечне логування heartbeat
    SecureLogger.logHeartbeat(data);

    // Валідація обов'язкових полів
    ErrorHandler.validateRequiredFields(data, [
      'plugin_id', 'plugin_name', 'version', 'user_id', 'computer_name'
    ]);

    // Валідація plugin_id формату
    ErrorHandler.validatePluginId(data.plugin_id);

    // Валідація timestamp формату
    ErrorHandler.validateTimestamp(data.timestamp);

    // Перевіряємо тип дії
    const action = data.action || 'heartbeat_update';
    
    let result;
    let message;
    let isBlocked = false;
    
    if (action === 'plugin_shutdown') {
      // Обробляємо сигнал закриття плагіна
      result = await markPluginInactive(data.plugin_id);
      message = 'Plugin shutdown signal received';
    } else {
      // Звичайний heartbeat
      result = await upsertPlugin(data, ipAddress);
      message = 'Heartbeat updated successfully';
      
      // Перевірка ліцензії в новій системі (тільки якщо є дані ліцензії)
      if (data.license_info && data.license_info.email && data.license_info.license_key && data.license_info.hardware_id) {
        // Валідуємо ліцензію
        const licenseValidation = await LicenseValidator.validateLicense({
          email: data.license_info.email,
          license_key: data.license_info.license_key,
          hardware_id: data.license_info.hardware_id
        });

        if (!licenseValidation.isValid) {
          SecureLogger.warn('License validation failed', {
            email: data.license_info.email,
            reason: licenseValidation.reason
          }, 'HEARTBEAT');
          isBlocked = true;
        } else {
          // Оновлюємо heartbeat
          await LicenseValidator.updateHeartbeat({
            email: data.license_info.email,
            license_key: data.license_info.license_key,
            hardware_id: data.license_info.hardware_id
          });
        }
      } else {
        // БЛОКУЄМО плагін якщо немає даних ліцензії - вимагаємо активацію
        console.log('🚫 [API] Відсутні дані ліцензії в heartbeat - плагін заблокований');
        isBlocked = true; // БЛОКУЄМО без ліцензії
      }
      
      // Логування для діагностики (тільки в development)
      if (process.env.NODE_ENV === 'development') {
        console.log('Heartbeat result:', JSON.stringify(result, null, 2));
      }
    }

    // Формуємо відповідь
    const response: HeartbeatResponse = {
      success: true,
      message: message,
      plugin: {
        id: result.id,
        plugin_id: result.plugin_id,
        last_heartbeat: result.last_heartbeat,
        is_active: result.is_active,
        is_blocked: isBlocked
      }
    };

    // Додаткове логування для діагностики блокування (тільки в development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Heartbeat response:', JSON.stringify({
        plugin_id: result.plugin_id,
        is_active: result.is_active,
        is_blocked: (result as any).is_blocked,
        full_result: result
      }, null, 2));
    }

    // Додаємо заголовки для уникнення кешування
    const nextResponse = NextResponse.json(response);
    nextResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    nextResponse.headers.set('Pragma', 'no-cache');
    nextResponse.headers.set('Expires', '0');

    return nextResponse;

  } catch (error) {
    return ErrorHandler.handle(error, 'HEARTBEAT');
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
