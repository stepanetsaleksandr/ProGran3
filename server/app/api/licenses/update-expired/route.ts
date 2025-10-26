import { NextRequest } from 'next/server';
import { withPublicApi, ApiContext } from '@/lib/api-handler';
import { apiSuccess, apiError } from '@/lib/api-response';

/**
 * POST /api/licenses/update-expired
 * Automatically update expired licenses status
 */
export const POST = withPublicApi(async ({ supabase }: ApiContext) => {
  try {
    console.log('[License Update] Starting expired licenses check...');
    
    // Find all active licenses that are expired
    const { data: expiredLicenses, error: fetchError } = await supabase
      .from('licenses')
      .select('id, license_key, expires_at, status')
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString());
    
    if (fetchError) {
      console.error('[License Update] Error fetching expired licenses:', fetchError);
      return apiError('Failed to fetch expired licenses', 500);
    }
    
    if (!expiredLicenses || expiredLicenses.length === 0) {
      console.log('[License Update] No expired licenses found');
      return apiSuccess({
        message: 'No expired licenses found',
        updated: 0,
        licenses: []
      });
    }
    
    console.log(`[License Update] Found ${expiredLicenses.length} expired licenses`);
    
    // Update all expired licenses to 'expired' status
    const { data: updatedLicenses, error: updateError } = await supabase
      .from('licenses')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .in('id', expiredLicenses.map(l => l.id))
      .select('id, license_key, expires_at');
    
    if (updateError) {
      console.error('[License Update] Error updating expired licenses:', updateError);
      return apiError('Failed to update expired licenses', 500);
    }
    
    console.log(`[License Update] Successfully updated ${updatedLicenses?.length || 0} licenses to expired status`);
    
    return apiSuccess({
      message: `Updated ${updatedLicenses?.length || 0} licenses to expired status`,
      updated: updatedLicenses?.length || 0,
      licenses: updatedLicenses || []
    });
    
  } catch (error) {
    console.error('[License Update] Unexpected error:', error);
    return apiError(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
});
