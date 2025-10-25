import crypto from 'crypto';

/**
 * HMAC Request Signature Verification
 * Захист від підробки запитів та replay attacks
 */

// v3.2: Безпечне завантаження secret з environment variable
const SECRET_KEY = process.env.HMAC_SECRET_KEY;

// Валідація: перевіряємо що secret налаштовано (тільки в runtime, не під час build)
if (!SECRET_KEY && typeof window === 'undefined') {
  // Тільки на сервері та не під час build
  console.warn('[HMAC] HMAC_SECRET_KEY environment variable not found - HMAC verification disabled');
}

if (SECRET_KEY) {
  console.log('[HMAC] HMAC secret loaded from environment variable');
}

const MAX_TIMESTAMP_AGE = 300; // 5 хвилин
const MAX_FUTURE_TOLERANCE = 60; // 1 хвилина в майбутнє (для різниці годин)

// v3.1: Nonce tracking для захисту від replay attacks
const usedNonces = new Map<string, number>();

// Очищення старих nonces кожні 10 хвилин
setInterval(() => {
  const cutoff = Date.now() - (MAX_TIMESTAMP_AGE * 1000);
  // v3.1: Використовуємо forEach замість for...of (TypeScript compatibility)
  usedNonces.forEach((timestamp, nonce) => {
    if (timestamp < cutoff) {
      usedNonces.delete(nonce);
    }
  });
}, 600000);

/**
 * Створює HMAC підпис для даних
 * Використовується для тестування
 */
export function createHMAC(body: string, timestamp: number): string {
  if (!SECRET_KEY) {
    throw new Error('HMAC_SECRET_KEY is not configured');
  }
  
  const message = `${body}${timestamp}`;
  
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(message)
    .digest('hex');
}

/**
 * Перевіряє HMAC підпис запиту
 */
export function verifyHMAC(
  body: string,
  timestamp: number,
  signature: string
): { valid: boolean; error?: string } {
  
  // Перевірка: HMAC увімкнено?
  if (!SECRET_KEY) {
    console.warn('[HMAC] SECRET_KEY not configured, HMAC verification disabled');
    // Якщо HMAC не налаштовано - пропускаємо перевірку
    // Це дозволяє поступово впроваджувати HMAC
    return { valid: true };
  }
  
  // Перевірка: всі параметри надані?
  if (!signature || !timestamp) {
    return {
      valid: false,
      error: 'Missing HMAC signature or timestamp'
    };
  }
  
  // Перевірка: Timestamp не старіше MAX_TIMESTAMP_AGE
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;
  
  if (age > MAX_TIMESTAMP_AGE) {
    return {
      valid: false,
      error: `Request expired (timestamp too old: ${age}s > ${MAX_TIMESTAMP_AGE}s)`
    };
  }
  
  // Перевірка: Timestamp не з майбутнього
  if (age < -MAX_FUTURE_TOLERANCE) {
    return {
      valid: false,
      error: `Invalid timestamp (from future: ${-age}s)`
    };
  }
  
  // === v3.1: REPLAY ATTACK PROTECTION ===
  // Перевіряємо що цей nonce ще не використовувався
  const nonce = `${timestamp}:${signature}`;
  
  if (usedNonces.has(nonce)) {
    return {
      valid: false,
      error: 'Request already processed (replay attack detected)'
    };
  }
  
  // Перевірка: Створюємо очікуваний підпис
  try {
    const expectedSignature = createHMAC(body, timestamp);
    
    // Безпечне порівняння (захист від timing attacks)
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (signatureBuffer.length !== expectedBuffer.length) {
      return {
        valid: false,
        error: 'Invalid signature (wrong length)'
      };
    }
    
    const valid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    
    if (!valid) {
      return {
        valid: false,
        error: 'Invalid signature (data tampered or wrong key)'
      };
    }
    
    // === v3.1: Зберігаємо nonce (replay protection) ===
    usedNonces.set(nonce, timestamp);
    
    // ✅ Все добре!
    return { valid: true };
    
  } catch (error) {
    return {
      valid: false,
      error: `HMAC verification error: ${error instanceof Error ? error.message : 'unknown'}`
    };
  }
}

/**
 * Middleware для перевірки HMAC в Next.js API routes
 * Опціональний - якщо HMAC не налаштовано, пропускає
 */
export async function requireHMAC(request: Request): Promise<{ valid: boolean; error?: string }> {
  // Отримуємо headers
  const signature = request.headers.get('X-Signature');
  const timestampHeader = request.headers.get('X-Timestamp');
  
  // Якщо headers відсутні і HMAC не налаштовано - дозволяємо
  if (!signature && !timestampHeader && !SECRET_KEY) {
    console.log('[HMAC] Headers missing but HMAC not configured, allowing request');
    return { valid: true };
  }
  
  if (!signature || !timestampHeader) {
    return {
      valid: false,
      error: 'HMAC signature required (X-Signature and X-Timestamp headers)'
    };
  }
  
  // Читаємо body
  const body = await request.text();
  const timestamp = parseInt(timestampHeader);
  
  if (isNaN(timestamp)) {
    return {
      valid: false,
      error: 'Invalid timestamp format'
    };
  }
  
  // Перевіряємо підпис
  return verifyHMAC(body, timestamp, signature);
}

/**
 * Перевіряє чи HMAC налаштовано і ввімкнено
 */
export function isHMACEnabled(): boolean {
  return !!SECRET_KEY;
}

/**
 * Генерує новий SECRET_KEY (для налаштування)
 */
export function generateSecretKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

