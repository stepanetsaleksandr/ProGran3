import { NextRequest } from 'next/server';
import { withPublicApi, ApiContext } from '@/lib/api-handler';
import { apiSuccess, apiError } from '@/lib/api-response';
import { verifyHMAC, isHMACEnabled } from '@/lib/hmac';

/**
 * GET /api/client/secret
 * Отримати HMAC secret для плагіна (з fingerprint verification)
 * 
 * Security:
 * - HMAC signature verification (обов'язково)
 * - Fingerprint validation
 * - Rate limiting
 */
export const GET = withPublicApi(async ({ supabase, request }: ApiContext) => {
  try {
    // Перевірка HMAC (обов'язково для цього endpoint)
    if (!isHMACEnabled()) {
      return apiError('HMAC verification is required for this endpoint', 401);
    }
    
    const signature = request.headers.get('X-Signature');
    const timestampHeader = request.headers.get('X-Timestamp');
    const fingerprint = request.headers.get('X-Fingerprint');
    
    if (!signature || !timestampHeader || !fingerprint) {
      return apiError('Missing required headers (X-Signature, X-Timestamp, X-Fingerprint)', 400);
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
      console.warn('[Client Secret] HMAC verification failed:', hmacResult.error);
      return apiError(`Invalid HMAC signature: ${hmacResult.error}`, 401);
    }
    
    // Перевіряємо fingerprint (базова валідація)
    if (fingerprint.length < 32) {
      return apiError('Invalid fingerprint format', 400);
    }
    
    console.log('[Client Secret] HMAC verification passed, returning secret');
    
    return apiSuccess({
      secret: process.env.HMAC_SECRET_KEY,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 години
    });
    
  } catch (error) {
    console.error('[Client Secret] Error:', error);
    return apiError(error as Error);
  }
});
