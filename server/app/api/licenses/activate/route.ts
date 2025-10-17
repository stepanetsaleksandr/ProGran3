import { NextRequest } from 'next/server';
import { withPublicApi, ApiContext } from '@/lib/api-handler';
import { apiSuccess, apiError, apiValidationError, apiNotFound } from '@/lib/api-response';
import { validateBody, LicenseActivateSchema } from '@/lib/validation/schemas';
import { verifyHMAC, isHMACEnabled } from '@/lib/hmac';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * POST /api/licenses/activate
 * Activate a license with user email and system fingerprint
 * 
 * Security:
 * - HMAC signature verification (опціонально)
 * - Rate limiting (5 req/min per email, 100 req/min per IP)
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
        console.warn('[License Activation] HMAC enabled but headers missing');
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
        console.warn('[License Activation] HMAC verification failed:', hmacResult.error);
        return apiError(
          `Invalid HMAC signature: ${hmacResult.error}`,
          401,
          undefined,
          'HMAC_INVALID'
        );
      }
      
      console.log('[License Activation] HMAC verification passed');
      
      // Парсимо JSON з body
      // @ts-ignore - request з text() вже прочитаний
      request.json = async () => JSON.parse(bodyText);
    } else {
      console.log('[License Activation] HMAC not enabled, skipping verification');
    }
    
    // ============================================
    // КРОК 2: ВАЛІДАЦІЯ ВХІДНИХ ДАНИХ
    // ============================================
    
    const validation = await validateBody(request, LicenseActivateSchema);
    
    if (!validation.success) {
      return apiValidationError(validation.errors);
    }

    const { license_key, user_email, system_fingerprint } = validation.data;

    console.log('[License Activation] Attempt:', {
      license_key: license_key.substring(0, 20) + '...',
      user_email,
      fingerprint: system_fingerprint.substring(0, 16) + '...'
    });
    
    // ============================================
    // КРОК 3: RATE LIMITING
    // ============================================
    
    // Rate limit по email (5 спроб/хв)
    const emailLimit = await checkRateLimit(`activate:email:${user_email}`, 'activate');
    
    if (!emailLimit.allowed) {
      const resetDate = new Date(emailLimit.reset * 1000);
      const waitSeconds = Math.ceil((emailLimit.reset * 1000 - Date.now()) / 1000);
      
      console.warn(`[License Activation] Rate limit exceeded for email: ${user_email}`);
      
      return apiError(
        `Too many activation attempts. Try again in ${waitSeconds} seconds.`,
        429,
        {
          resetAt: resetDate.toISOString(),
          limit: emailLimit.limit,
          remaining: emailLimit.remaining
        },
        'RATE_LIMIT_EXCEEDED'
      );
    }
    
    // Rate limit по IP (100 спроб/хв - загальний)
    const clientIp = getClientIp(request);
    const ipLimit = await checkRateLimit(`activate:ip:${clientIp}`, 'byIp');
    
    if (!ipLimit.allowed) {
      const resetDate = new Date(ipLimit.reset * 1000);
      const waitSeconds = Math.ceil((ipLimit.reset * 1000 - Date.now()) / 1000);
      
      console.warn(`[License Activation] Rate limit exceeded for IP: ${clientIp}`);
      
      return apiError(
        `Too many requests from your IP. Try again in ${waitSeconds} seconds.`,
        429,
        {
          resetAt: resetDate.toISOString()
        },
        'RATE_LIMIT_EXCEEDED'
      );
    }
    
    console.log('[License Activation] Rate limits passed:', {
      email: `${emailLimit.remaining}/${emailLimit.limit}`,
      ip: `${ipLimit.remaining}/${ipLimit.limit}`
    });
    
    // ============================================
    // КРОК 4: ОСНОВНА ЛОГІКА АКТИВАЦІЇ (БЕЗ ЗМІН!)
    // ============================================

    // === v3.1: RACE CONDITION FIX ===
    // Дозволяємо тільки 'generated' (не 'active'!)
    // Це запобігає подвійній активації через race condition
    const { data: licenseKey, error: keyError } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', license_key)
      .eq('status', 'generated')  // v3.1: тільки generated!
      .single();

    if (keyError || !licenseKey) {
      // Перевіряємо чи ліцензія вже активна (більш зрозуміле повідомлення)
      const { data: existingLicense } = await supabase
        .from('licenses')
        .select('status')
        .eq('license_key', license_key)
        .single();
      
      if (existingLicense?.status === 'active') {
        console.warn('[License Activation] License already active:', license_key);
        return apiError('This license key is already activated', 400);
      }
      
      console.warn('[License Activation] Invalid key:', license_key);
      return apiError('Invalid license key', 400);
    }
    
    // === v3.1: EMAIL VERIFICATION (optional) ===
    // Якщо ліцензія має intended_email - перевіряємо збіг
    if (licenseKey.description && licenseKey.description.includes('email:')) {
      const intendedEmail = licenseKey.description.match(/email:([^\s,]+)/)?.[1];
      
      if (intendedEmail && intendedEmail.toLowerCase() !== user_email.toLowerCase()) {
        console.warn('[License Activation] Email mismatch:', {
          intended: intendedEmail,
          provided: user_email
        });
        
        return apiError(
          `This license key is intended for ${intendedEmail}. Please use the correct email.`,
          403,
          { intended_email: intendedEmail },
          'EMAIL_MISMATCH'
        );
      }
      
      if (intendedEmail) {
        console.log('[License Activation] Email verified:', user_email);
      }
    }

    // Check if user exists, create if not
    let userId: string;
    const { data: existingUser, error: userFetchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', user_email)
      .single();

    if (userFetchError && userFetchError.code === 'PGRST116') {
      // User doesn't exist, create new user
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          email: user_email,
          name: user_email.split('@')[0],
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (createUserError) {
        console.error('[License Activation] User creation error:', createUserError);
        throw createUserError;
      }

      userId = newUser.id;
      console.log('[License Activation] New user created:', userId);
    } else if (userFetchError) {
      console.error('[License Activation] User fetch error:', userFetchError);
      throw userFetchError;
    } else {
      userId = existingUser.id;
    }

    // Calculate expiration date
    const activationDate = new Date();
    const expirationDate = new Date(activationDate.getTime() + (licenseKey.duration_days * 24 * 60 * 60 * 1000));

    // Update license status
    const { data: activatedLicense, error: licenseError } = await supabase
      .from('licenses')
      .update({
        user_id: userId,
        status: 'active',
        activated_at: activationDate.toISOString(),
        expires_at: expirationDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', licenseKey.id)
      .select()
      .single();

    if (licenseError) {
      console.error('[License Activation] License update error:', licenseError);
      throw licenseError;
    }

    // Create system info record
    const { data: systemInfo, error: systemError } = await supabase
      .from('system_infos')
      .insert({
        license_id: activatedLicense.id,
        fingerprint_hash: system_fingerprint,
        system_data: { fingerprint: system_fingerprint },
        last_seen: activationDate.toISOString(),
        created_at: activationDate.toISOString()
      })
      .select()
      .single();

    if (systemError) {
      console.error('[License Activation] System info error:', systemError);
      // Don't fail activation if system info creation fails
    }

    console.log('[License Activation] Success:', {
      license_id: activatedLicense.id,
      user_id: userId,
      expires_at: expirationDate
    });

    return apiSuccess({
      license_id: activatedLicense.id,
      license_key: activatedLicense.license_key,
      user_email,
      duration_days: activatedLicense.duration_days,
      activated_at: activationDate.toISOString(),
      expires_at: expirationDate.toISOString(),
      status: 'active'
    }, 'License activated successfully');
  } catch (error) {
    console.error('[License Activation] Error:', error);
    return apiError(error as Error);
  }
});
