import { NextRequest, NextResponse } from 'next/server';
import { upsertPlugin, markPluginInactive } from '@/lib/database';
import { HeartbeatRequest, HeartbeatResponse, ErrorResponse } from '@/lib/types';
import { ErrorHandler } from '@/lib/error-handler';
import { SecureLogger } from '@/lib/secure-logger';
import { LicenseValidator } from '@/lib/license-validator';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SB_SUPABASE_URL || process.env.STORAGE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SB_SUPABASE_SERVICE_ROLE_KEY || process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
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
    let isBlocked: boolean | undefined = false;
    
    if (action === 'plugin_shutdown') {
      // Обробляємо сигнал закриття плагіна
      result = await markPluginInactive(data.plugin_id);
      message = 'Plugin shutdown signal received';
    } else {
      // Звичайний heartbeat
      message = 'Heartbeat updated successfully';
      
      // Перевірка ліцензії в новій системі (тільки якщо є дані ліцензії)
      if (data.license_info && data.license_info.email && data.license_info.license_key && data.license_info.hardware_id) {
        // Валідуємо ліцензію
        const licenseValidation = await LicenseValidator.validateLicense({
          email: data.license_info.email,
          license_key: data.license_info.license_key,
          hardware_id: data.license_info.hardware_id
        });

        console.log('🔍 [HEARTBEAT] License validation result:', {
          isValid: licenseValidation.isValid,
          reason: licenseValidation.reason,
          email: data.license_info.email,
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
          // Якщо ліцензія валідна, НЕ блокуємо плагін
          isBlocked = false;
        }
      } else {
        // НЕ блокуємо плагін якщо немає даних ліцензії в heartbeat
        // Це може бути нормальна ситуація (плагін ще не активований або heartbeat без ліцензії)
        console.log('ℹ️ [API] Відсутні дані ліцензії в heartbeat - залишаємо плагін активним');
        // Явно встановлюємо false щоб не блокувати плагін
        isBlocked = false;
      }
      
      // Оновлюємо плагін з урахуванням статусу блокування
      result = await upsertPlugin(data, ipAddress, isBlocked);
      
      // Логування для діагностики
      console.log('🔍 [HEARTBEAT] Debug info:', {
        plugin_id: data.plugin_id,
        has_license: !!(data.license_info && data.license_info.email),
        isBlocked,
        result_is_active: result.is_active,
        result_is_blocked: result.is_blocked
      });
      
      // КРИТИЧНО: Якщо плагін заблокований в базі, але ми не хочемо його блокувати - розблоковуємо
      if (result.is_blocked && !isBlocked) {
        console.log('🔓 [HEARTBEAT] Розблоковуємо плагін в базі...');
        const { error: unblockError } = await supabase
          .from('plugins')
          .update({
            is_blocked: false,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('plugin_id', data.plugin_id);
        
        if (!unblockError) {
          result.is_blocked = false;
          result.is_active = true;
          console.log('✅ [HEARTBEAT] Плагін розблоковано в базі');
        }
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
        is_blocked: false // ЗАВЖДИ false для heartbeat - не блокуємо плагін
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
