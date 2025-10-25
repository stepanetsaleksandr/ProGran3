import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

/**
 * JWT Authentication System
 * Заміна небезпечних публічних API ключів
 */

export interface JWTPayload {
  userId: string;
  role: 'admin' | 'user';
  iat: number;
  exp: number;
  type: 'admin' | 'user';
}

export interface AuthResult {
  valid: boolean;
  userId?: string;
  role?: string;
  error?: string;
}

/**
 * Генерує JWT токен для адміністратора
 */
export function generateAdminToken(userId: string = 'admin'): string {
  const payload: JWTPayload = {
    userId,
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 години
    type: 'admin'
  };
  
  const secret = process.env.JWT_SECRET || 'fallback-secret-key';
  return jwt.sign(payload, secret);
}

/**
 * Генерує JWT токен для користувача
 */
export function generateUserToken(userId: string): string {
  const payload: JWTPayload = {
    userId,
    role: 'user',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 днів
    type: 'user'
  };
  
  const secret = process.env.JWT_SECRET || 'fallback-secret-key';
  return jwt.sign(payload, secret);
}

/**
 * Валідує JWT токен
 */
export function validateToken(token: string): AuthResult {
  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    // Перевірка типу токена
    if (decoded.type !== 'admin' && decoded.type !== 'user') {
      return { valid: false, error: 'Invalid token type' };
    }
    
    // Перевірка терміну дії
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired' };
    }
    
    return {
      valid: true,
      userId: decoded.userId,
      role: decoded.role
    };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid token' 
    };
  }
}

/**
 * Отримує токен з Authorization header
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Видаляємо "Bearer "
}

/**
 * Перевіряє чи є валідний admin токен
 */
export function validateAdminToken(request: NextRequest): AuthResult {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return { valid: false, error: 'No token provided' };
  }
  
  const result = validateToken(token);
  
  if (!result.valid) {
    return result;
  }
  
  if (result.role !== 'admin') {
    return { valid: false, error: 'Admin access required' };
  }
  
  return result;
}

/**
 * Перевіряє чи є валідний user токен
 */
export function validateUserToken(request: NextRequest): AuthResult {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return { valid: false, error: 'No token provided' };
  }
  
  const result = validateToken(token);
  
  if (!result.valid) {
    return result;
  }
  
  if (result.role !== 'user') {
    return { valid: false, error: 'User access required' };
  }
  
  return result;
}

/**
 * Legacy API Key validation (для backward compatibility)
 */
export function validateLegacyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-API-Key');
  const validKeys = (process.env.API_KEYS || '').split(',').filter(Boolean);
  
  return apiKey ? validKeys.includes(apiKey) : false;
}

/**
 * Комбінована валідація (JWT + Legacy API Key)
 */
export function validateAuth(request: NextRequest): AuthResult {
  // Спочатку пробуємо JWT
  const jwtResult = validateAdminToken(request);
  if (jwtResult.valid) {
    return jwtResult;
  }
  
  // Fallback на legacy API key
  if (validateLegacyApiKey(request)) {
    return {
      valid: true,
      userId: 'legacy-admin',
      role: 'admin'
    };
  }
  
  return { valid: false, error: 'Invalid authentication' };
}

/**
 * Legacy requireApiKey function for backward compatibility
 */
export function requireApiKey(handler: any) {
  return async (request: NextRequest, context?: any) => {
    const authResult = validateAuth(request);
    
    if (!authResult.valid) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: authResult.error || 'Authentication required' 
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    return handler(request, context);
  };
}