import { NextRequest } from 'next/server';
import { withPublicApi, ApiContext } from '@/lib/api-handler';
import { apiSuccess, apiError, apiValidationError } from '@/lib/api-response';
import { validateBody, LicenseGenerateSchema } from '@/lib/validation/schemas';
import { requireApiKey } from '@/lib/auth';
import crypto from 'crypto';

/**
 * POST /api/licenses/generate
 * Generate a new license key with specified duration
 * Requires API Key authentication (X-API-Key header)
 */
const generateHandler = withPublicApi(async ({ supabase, request }: ApiContext) => {
  try {
    // Validate request body
    const validation = await validateBody(request, LicenseGenerateSchema);
    
    if (!validation.success) {
      return apiValidationError(validation.errors);
    }

    const { duration_days, description } = validation.data;

    // Generate unique license key
    const generateLicenseKey = (): string => {
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString(36).toUpperCase();
      const randomPart = crypto.randomBytes(6).toString('hex').toUpperCase();
      return `PROGRAN3-${year}-${randomPart}-${timestamp}`;
    };

    const license_key = generateLicenseKey();

    console.log('[License Generation]', {
      license_key,
      duration_days,
      description: description || 'N/A'
    });

    // Create license record
    const currentDate = new Date().toISOString();
    const { data: license, error } = await supabase
      .from('licenses')
      .insert({
        license_key,
        duration_days,
        description: description || `${duration_days} days license`,
        status: 'generated',
        created_at: currentDate,
        updated_at: currentDate,
      })
      .select()
      .single();

    if (error) {
      console.error('[License Generation] Database error:', error);
      
      // Handle duplicate key error
      if (error.code === '23505') {
        return apiError('License key collision. Please try again.', 500);
      }
      
      throw error;
    }

    console.log('[License Generation] Success:', license.id);

    return apiSuccess({
      id: license.id,
      license_key: license.license_key,
      duration_days: license.duration_days,
      description: license.description,
      status: license.status,
      created_at: license.created_at
    }, 'License generated successfully', 201);
  } catch (error) {
    console.error('[License Generation] Error:', error);
    return apiError(error as Error);
  }
});

// Wrap with API Key requirement
export const POST = requireApiKey(generateHandler);
