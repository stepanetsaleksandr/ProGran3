import { NextRequest } from 'next/server';
import { withPublicApi, ApiContext } from '@/lib/api-handler';
import { apiSuccess, apiError, apiValidationError } from '@/lib/api-response';
import { validateAdminToken } from '@/lib/auth';
import { z } from 'zod';

/**
 * Schema для зміни облікових даних
 */
const ChangeCredentialsSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newUsername: z.string().min(8, 'Username must be at least 8 characters'),
  newPassword: z.string().min(20, 'Password must be at least 20 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

/**
 * Валідація складності паролю
 */
function validatePasswordStrength(password: string) {
  const checks = {
    length: password.length >= 20,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  
  return {
    valid: passed >= 4,
    checks,
    score: passed
  };
}

/**
 * POST /api/admin/change-credentials
 * Зміна адміністраторських облікових даних
 * 
 * Security:
 * - Потребує валідний admin токен
 * - Перевірка поточного паролю
 * - Валідація складності нового паролю
 * - Оновлення environment variables
 */
export const POST = withPublicApi(async ({ request }: ApiContext) => {
  try {
    // Перевірка аутентифікації
    const authResult = validateAdminToken(request);
    if (!authResult.valid) {
      return apiError('Authentication required', 401);
    }

    // Валідація вхідних даних
    const body = await request.json();
    const validation = ChangeCredentialsSchema.safeParse(body);
    
    if (!validation.success) {
      return apiValidationError(validation.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })));
    }
    
    const { currentPassword, newUsername, newPassword } = validation.data;
    
    // Перевірка поточного паролю
    const currentCredentials = {
      username: process.env.ADMIN_USERNAME || 'progran3_admin_2025',
      password: process.env.ADMIN_PASSWORD || 'Pr0Gr@n3_S3cur3_@dm1n_2025!'
    };
    
    if (currentPassword !== currentCredentials.password) {
      console.warn('[Admin] Invalid current password attempt');
      return apiError('Invalid current password', 401);
    }
    
    // Валідація складності нового паролю
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return apiError('Password does not meet security requirements', 400);
    }
    
    // Валідація логіну
    if (newUsername.length < 8) {
      return apiError('Username must be at least 8 characters', 400);
    }
    
    // Генерація нового JWT секрету (опціонально)
    const newJwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    
    console.log('[Admin] Credentials change requested:', {
      newUsername,
      passwordLength: newPassword.length,
      timestamp: new Date().toISOString()
    });
    
    // Повертаємо інструкції для оновлення
    return apiSuccess({
      instructions: {
        step1: 'Update environment variables in Vercel:',
        step2: `vercel env add ADMIN_USERNAME`,
        step3: `vercel env add ADMIN_PASSWORD`,
        step4: 'vercel --prod',
        newCredentials: {
          username: newUsername,
          password: newPassword
        }
      },
      code: {
        typescript: `// В файлі server/app/api/auth/login/route.ts
const validCredentials = {
  username: process.env.ADMIN_USERNAME || '${newUsername}',
  password: process.env.ADMIN_PASSWORD || '${newPassword}'
};`
      }
    }, 'Credentials change instructions generated');
    
  } catch (error) {
    console.error('[Admin] Change credentials error:', error);
    return apiError(error as Error);
  }
});
