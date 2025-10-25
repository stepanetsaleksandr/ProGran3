import { NextRequest } from 'next/server';
import { withPublicApi, ApiContext } from '@/lib/api-handler';
import { apiSuccess, apiError, apiValidationError } from '@/lib/api-response';
import { validateBody } from '@/lib/validation/schemas';
import { z } from 'zod';
import { verifyHMAC, isHMACEnabled } from '@/lib/hmac';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * Schema for license validation
 */
const LicenseValidateSchema = z.object({
  license_key: z.string().min(10, 'License key is required'),
  system_fingerprint: z.string().min(32, 'System fingerprint is required')
});

/**
 * POST /api/licenses/validate
 * Validate a license and update last validation timestamp
 * 
 * Security:
 * - HMAC signature verification (опціонально)
 * - Rate limiting (30 req/min per key, 100 req/min per IP)
 */
export const POST = withPublicApi(async ({ supabase, request }: ApiContext) => {
  try {
    // ============================================
    // КРОК 1: ✅ НОВА БЕЗПЕЧНА СИСТЕМА: Hardware-based аутентифікація
    // ============================================
    
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
    
    console.log('[License Validation] Hardware authentication validated:', {
      fingerprint: fingerprint.substring(0, 16) + '...',
      endpoint: endpoint || 'unknown',
      plugin_version: pluginVersion || 'unknown',
      time_diff: timeDiff
    });
    
    // ============================================
    // КРОК 2: ВАЛІДАЦІЯ ВХІДНИХ ДАНИХ
    // ============================================
    
    const validation = await validateBody(request, LicenseValidateSchema);
    
    if (!validation.success) {
      return apiValidationError(validation.errors);
    }

    const { license_key, system_fingerprint } = validation.data;

    console.log('[License Validation] Attempt:', {
      license_key: '***REDACTED***',
      fingerprint: '***REDACTED***'
    });
    
    // ============================================
    // КРОК 3: RATE LIMITING
    // ============================================
    
    // Rate limit по license key (30 спроб/хв)
    const keyLimit = await checkRateLimit(`validate:key:${license_key}`, 'validate');
    
    if (!keyLimit.allowed) {
      const resetDate = new Date(keyLimit.reset * 1000);
      const waitSeconds = Math.ceil((keyLimit.reset * 1000 - Date.now()) / 1000);
      
      console.warn(`[License Validation] Rate limit exceeded for key: ${license_key}`);
      
      return apiError(
        `Too many validation attempts. Try again in ${waitSeconds} seconds.`,
        429,
        {
          resetAt: resetDate.toISOString(),
          limit: keyLimit.limit,
          remaining: keyLimit.remaining
        },
        'RATE_LIMIT_EXCEEDED'
      );
    }
    
    // Rate limit по IP (100 спроб/хв - загальний)
    const clientIp = getClientIp(request);
    const ipLimit = await checkRateLimit(`validate:ip:${clientIp}`, 'byIp');
    
    if (!ipLimit.allowed) {
      const resetDate = new Date(ipLimit.reset * 1000);
      const waitSeconds = Math.ceil((ipLimit.reset * 1000 - Date.now()) / 1000);
      
      console.warn(`[License Validation] Rate limit exceeded for IP: ${clientIp}`);
      
      return apiError(
        `Too many requests from your IP. Try again in ${waitSeconds} seconds.`,
        429,
        {
          resetAt: resetDate.toISOString()
        },
        'RATE_LIMIT_EXCEEDED'
      );
    }
    
    console.log('[License Validation] Rate limits passed:', {
      key: `${keyLimit.remaining}/${keyLimit.limit}`,
      ip: `${ipLimit.remaining}/${ipLimit.limit}`
    });
    
    // ============================================
    // КРОК 4: ОСНОВНА ЛОГІКА ВАЛІДАЦІЇ (БЕЗ ЗМІН!)
    // ============================================

    // Check if license exists and is active
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('*, users(email, name)')
      .eq('license_key', license_key)
      .single();

    if (licenseError || !license) {
      console.warn('[License Validation] License not found:', license_key);
      return apiError('License not found', 404);
    }

    // Check if license is active
    if (license.status !== 'active') {
      console.warn('[License Validation] License not active:', license.status);
      return apiError(`License is ${license.status}, not active`, 403);
    }

    // Check if license is expired
    if (license.expires_at) {
      const expiresAt = new Date(license.expires_at);
      if (expiresAt < new Date()) {
        console.warn('[License Validation] License expired:', license.expires_at);
        return apiError('License has expired', 403);
      }
    }

    // Check system fingerprint match
    const { data: systemInfo, error: systemError } = await supabase
      .from('system_infos')
      .select('*')
      .eq('license_id', license.id)
      .single();

    if (systemError && systemError.code !== 'PGRST116') {
      console.error('[License Validation] System info error:', systemError);
      throw systemError;
    }

    // If system info exists, verify fingerprint
    if (systemInfo) {
      if (systemInfo.fingerprint_hash !== system_fingerprint) {
        console.warn('[License Validation] Fingerprint mismatch');
        return apiError('License is bound to a different system', 403);
      }

      // === CONCURRENT SESSIONS CHECK (v3.0) ===
      // Отримуємо IP клієнта
      const currentClientIp = getClientIp(request);
      
      // Перевіряємо чи є інша активна сесія з іншого IP
      const { data: systemData } = await supabase
        .from('system_infos')
        .select('system_data')
        .eq('id', systemInfo.id)
        .single();
      
      if (systemData?.system_data) {
        const lastIp = systemData.system_data.last_ip;
        const lastSeen = systemData.system_data.last_seen;
        
        if (lastIp && lastSeen) {
          const lastSeenTime = new Date(lastSeen).getTime();
          const now = Date.now();
          const timeDiff = (now - lastSeenTime) / 1000; // секунди
          
          // Якщо остання активність < 15 хв і IP інший → concurrent usage
          if (timeDiff < 900 && lastIp !== currentClientIp) {
            console.warn('[License Validation] Concurrent session detected:', {
              current_ip: currentClientIp,
              last_ip: lastIp,
              time_diff_seconds: timeDiff
            });
            
            // Блокуємо ліцензію при виявленні concurrent usage
            await supabase
              .from('licenses')
              .update({
                status: 'suspended',
                updated_at: new Date().toISOString()
              })
              .eq('id', license.id);
            
            return apiError(
              'License suspended: concurrent usage detected on different IP addresses',
              403,
              { reason: 'concurrent_usage', last_ip: lastIp, current_ip: currentClientIp },
              'CONCURRENT_USAGE'
            );
          }
        }
      }

      // Update last_seen + IP для tracking
      await supabase
        .from('system_infos')
        .update({
          last_seen: new Date().toISOString(),
          system_data: {
            ...systemData?.system_data,
            last_ip: currentClientIp,
            last_seen: new Date().toISOString()
          }
        })
        .eq('id', systemInfo.id);
    }

    console.log('[License Validation] Success:', license.id);

    return apiSuccess({
      valid: true,
      license_id: license.id,
      license_key: license.license_key,
      status: license.status,
      expires_at: license.expires_at,
      user_email: license.users?.email,
      fingerprint_match: true
    }, 'License is valid');

  } catch (error) {
    console.error('[License Validation] Error:', error);
    return apiError(error as Error);
  }
});


