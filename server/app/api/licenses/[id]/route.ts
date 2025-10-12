import { NextRequest } from 'next/server';
import { withPublicApi, ApiContext } from '@/lib/api-handler';
import { apiSuccess, apiError, apiNotFound, apiValidationError } from '@/lib/api-response';
import { LicenseIdSchema, LicenseUpdateSchema, validateBody } from '@/lib/validation/schemas';

/**
 * GET /api/licenses/[id]
 * Get a single license by ID
 */
export const GET = withPublicApi(async ({ supabase, params }: ApiContext) => {
  try {
    const { id } = params;

    // Validate ID
    const validation = LicenseIdSchema.safeParse(id);
    if (!validation.success) {
      return apiError('Invalid license ID format', 400);
    }

    // Fetch license
    const { data: license, error } = await supabase
      .from('licenses')
      .select(`
        *,
        users(email, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return apiNotFound('License');
      }
      console.error('[License Get] Database error:', error);
      throw error;
    }

    return apiSuccess(license);
  } catch (error) {
    return apiError(error as Error);
  }
});

/**
 * PUT /api/licenses/[id]
 * Update a license
 * TODO: Add authentication when frontend supports it
 */
export const PUT = withPublicApi(async ({ supabase, params, request }: ApiContext) => {
  try {
    const { id } = params;

    // Validate ID
    const idValidation = LicenseIdSchema.safeParse(id);
    if (!idValidation.success) {
      return apiError('Invalid license ID format', 400);
    }

    // Validate request body
    const bodyValidation = await validateBody(request, LicenseUpdateSchema);
    if (!bodyValidation.success) {
      return apiValidationError(bodyValidation.errors);
    }

    const { duration_days, status, description } = bodyValidation.data;

    console.log('[License Update]', { id, duration_days, status, description });

    // Build update object (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (duration_days !== undefined) updateData.duration_days = duration_days;
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description;

    // Update license
    const { data: license, error } = await supabase
      .from('licenses')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        users(email, name)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return apiNotFound('License');
      }
      console.error('[License Update] Database error:', error);
      throw error;
    }

    console.log('[License Update] Success:', id);

    return apiSuccess(license, 'License updated successfully');
  } catch (error) {
    console.error('[License Update] Error:', error);
    return apiError(error as Error);
  }
});

/**
 * DELETE /api/licenses/[id]
 * Delete a license
 * TODO: Add authentication when frontend supports it
 */
export const DELETE = withPublicApi(async ({ supabase, params }: ApiContext) => {
  try {
    const { id } = params;

    // Validate ID
    const validation = LicenseIdSchema.safeParse(id);
    if (!validation.success) {
      return apiError('Invalid license ID format', 400);
    }

    console.log('[License Delete] Attempt:', id);

    // Check if license exists
    const { data: existingLicense, error: fetchError } = await supabase
      .from('licenses')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return apiNotFound('License');
      }
      console.error('[License Delete] Fetch error:', fetchError);
      throw fetchError;
    }

    // Delete license (CASCADE will handle related records)
    const { error: deleteError } = await supabase
      .from('licenses')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[License Delete] Delete error:', deleteError);
      throw deleteError;
    }

    console.log('[License Delete] Success:', id);

    return apiSuccess(
      { id },
      'License deleted successfully'
    );
  } catch (error) {
    console.error('[License Delete] Error:', error);
    return apiError(error as Error);
  }
});
