import { z } from 'zod';

/**
 * License validation schemas
 */

// License ID schema (UUID)
export const LicenseIdSchema = z.string().uuid('Invalid license ID format');

// License generation schema
export const LicenseGenerateSchema = z.object({
  duration_days: z.number()
    .int('Duration must be an integer')
    .min(1, 'Duration must be at least 1 day')
    .max(3650, 'Duration cannot exceed 10 years (3650 days)'),
  description: z.string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .transform(val => val?.trim()),
});

// License activation schema
export const LicenseActivateSchema = z.object({
  license_key: z.string()
    .regex(/^PROGRAN3-\d{4}-[A-Z0-9]+-[A-Z0-9]+$/, 'Invalid license key format')
    .min(20, 'License key is too short')
    .max(100, 'License key is too long'),
  user_email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  system_fingerprint: z.string()
    .length(64, 'System fingerprint must be exactly 64 characters')
    .regex(/^[a-f0-9]{64}$/, 'System fingerprint must be a valid SHA256 hash'),
});

// License update schema
export const LicenseUpdateSchema = z.object({
  duration_days: z.number()
    .int('Duration must be an integer')
    .min(1)
    .max(3650)
    .optional(),
  status: z.enum(['generated', 'active', 'expired', 'suspended'])
    .optional(),
  description: z.string()
    .max(500)
    .optional()
    .transform(val => val?.trim()),
});

/**
 * System info validation schemas
 */

export const SystemInfoSchema = z.object({
  fingerprint_hash: z.string()
    .length(64, 'Fingerprint must be 64 characters')
    .regex(/^[a-f0-9]{64}$/, 'Fingerprint must be a valid SHA256 hash'),
  system_data: z.object({
    os: z.string().optional(),
    hostname: z.string().optional(),
    ruby_version: z.string().optional(),
    sketchup_version: z.string().optional(),
    architecture: z.string().optional(),
  }).optional(),
});

/**
 * Heartbeat validation schema
 */

export const HeartbeatSchema = z.object({
  license_key: z.string()
    .regex(/^PROGRAN3-\d{4}-[A-Z0-9]+-[A-Z0-9]+$/),
  system_fingerprint: z.string()
    .length(64)
    .regex(/^[a-f0-9]{64}$/),
  timestamp: z.number()
    .int()
    .positive(),
});

/**
 * Pagination schema
 */

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sort: z.enum(['created_at', 'updated_at', 'expires_at', 'activated_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Query param schemas
 */

export const LicenseQuerySchema = z.object({
  status: z.enum(['generated', 'active', 'expired', 'suspended']).optional(),
  user_id: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
}).merge(PaginationSchema.partial());

/**
 * Helper function to validate request body
 */
export async function validateBody<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; errors: any }> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    return {
      success: false,
      errors: [{ field: 'body', message: 'Invalid request format' }],
    };
  }
}

/**
 * Helper function to validate query params
 */
export function validateQuery<T extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; errors: any } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const validated = schema.parse(params);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    return {
      success: false,
      errors: [{ field: 'query', message: 'Invalid query parameters' }],
    };
  }
}

