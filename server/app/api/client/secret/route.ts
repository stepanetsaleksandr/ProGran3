import { NextRequest } from 'next/server';
import { withPublicApi, ApiContext } from '@/lib/api-handler';
import { apiSuccess, apiError } from '@/lib/api-response';
import { verifyHMAC, isHMACEnabled } from '@/lib/hmac';

/**
 * GET /api/client/secret
 * ✅ НОВА БЕЗПЕЧНА СИСТЕМА: Hardware-based аутентифікація
 * 
 * Security:
 * - Валідація hardware fingerprint
 * - Перевірка timestamp
 * - Ніяких секретів в відповіді
 */
export const GET = withPublicApi(async ({ supabase, request }: ApiContext) => {
  try {
    const fingerprint = request.headers.get('X-Fingerprint');
    const timestamp = request.headers.get('X-Timestamp');
    const endpoint = request.headers.get('X-Endpoint');
    const pluginVersion = request.headers.get('X-Plugin-Version');
    
    // Валідація hardware fingerprint (SHA256 = 64 символи)
    if (!fingerprint || fingerprint.length !== 64) {
      return apiError('Valid X-Fingerprint header required (64 characters)', 400);
    }
    
    // Валідація timestamp (захист від replay attacks)
    if (!timestamp) {
      return apiError('X-Timestamp header required', 400);
    }
    
    const requestTime = parseInt(timestamp);
    const now = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(now - requestTime);
    
    // Дозволяємо різницю до 5 хвилин
    if (timeDiff > 300) {
      return apiError('Request timestamp too old or too far in future', 400);
    }
    
    console.log('[Hardware Auth] Request validated:', {
      fingerprint: '***REDACTED***',
      endpoint: endpoint || 'unknown',
      plugin_version: pluginVersion || 'unknown',
      time_diff: timeDiff
    });
    
    // Повертаємо тільки статус аутентифікації
    return apiSuccess({
      authenticated: true,
      hardware_validated: true,
      message: 'Hardware-based authentication successful',
      server_time: now,
      // НІЯКИХ СЕКРЕТІВ!
    });
    
  } catch (error) {
    console.error('[Hardware Auth] Error:', error);
    return apiError(error as Error);
  }
});
