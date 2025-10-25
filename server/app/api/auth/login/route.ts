import { NextRequest } from 'next/server';
import { withPublicApi, ApiContext } from '@/lib/api-handler';
import { apiSuccess, apiError, apiValidationError } from '@/lib/api-response';
import { generateAdminToken } from '@/lib/auth';
import { z } from 'zod';

/**
 * Login schema
 */
const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/login
 * Admin login endpoint для отримання JWT токену
 * 
 * Security:
 * - Простий username/password (для MVP)
 * - JWT токен з терміном дії 24 години
 * - Заміна небезпечних публічних API ключів
 */
export const POST = withPublicApi(async ({ request }: ApiContext) => {
  try {
    // Валідація вхідних даних
    const body = await request.json();
    const validation = LoginSchema.safeParse(body);
    
    if (!validation.success) {
      return apiValidationError(validation.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })));
    }
    
    const { username, password } = validation.data;
    
    // Простий admin перевірка (для MVP)
    // TODO: В майбутньому замінити на proper authentication
    const validCredentials = {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123'
    };
    
    if (username !== validCredentials.username || password !== validCredentials.password) {
      console.warn('[Auth] Invalid login attempt:', { username });
      return apiError('Invalid credentials', 401);
    }
    
    // Генеруємо JWT токен
    const token = generateAdminToken('admin');
    
    console.log('[Auth] Successful admin login');
    
    return apiSuccess({
      token,
      user: {
        id: 'admin',
        username: 'admin',
        role: 'admin'
      },
      expires_in: 24 * 60 * 60 // 24 години в секундах
    }, 'Login successful');
    
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return apiError(error as Error);
  }
});
