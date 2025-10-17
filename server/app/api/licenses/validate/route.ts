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
    // КРОК 1: ПЕРЕВІРКА HMAC (якщо налаштовано)
    // ============================================
    
    const signature = request.headers.get('X-Signature');
    const timestampHeader = request.headers.get('X-Timestamp');
    
    // Якщо HMAC налаштовано - перевіряємо
    if (isHMACEnabled()) {
      if (!signature || !timestampHeader) {
        console.warn('[License Validation] HMAC enabled but headers missing');
        return apiError(
          'HMAC signature required (X-Signature and X-Timestamp headers)',
          401,
          undefined,
          'HMAC_REQUIRED'
        );
      }
      
      // Читаємо body для перевірки підпису
      const bodyText = await request.text();
      const timestamp = parseInt(timestampHeader);
      
      if (isNaN(timestamp)) {
        return apiError('Invalid timestamp format', 400);
      }
      
      // Перевіряємо HMAC підпис
      const hmacResult = verifyHMAC(bodyText, timestamp, signature);
      
      if (!hmacResult.valid) {
        console.warn('[License Validation] HMAC verification failed:', hmacResult.error);
        return apiError(
          `Invalid HMAC signature: ${hmacResult.error}`,
          401,
          undefined,
          'HMAC_INVALID'
        );
      }
      
      console.log('[License Validation] HMAC verification passed');
      
      // Парсимо JSON з body
      // @ts-ignore - request з text() вже прочитаний
      request.json = async () => JSON.parse(bodyText);
    } else {
      console.log('[License Validation] HMAC not enabled, skipping verification');
    }
    
    // ============================================
    // КРОК 2: ВАЛІДАЦІЯ ВХІДНИХ ДАНИХ
    // ============================================
    
    const validation = await validateBody(request, LicenseValidateSchema);
    
    if (!validation.success) {
      return apiValidationError(validation.errors);
    }

    const { license_key, system_fingerprint } = validation.data;

    console.log('[License Validation] Attempt:', {
      license_key: license_key.substring(0, 20) + '...',
      fingerprint: system_fingerprint.substring(0, 16) + '...'
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

      // Update last_seen
      await supabase
        .from('system_infos')
        .update({
          last_seen: new Date().toISOString()
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


