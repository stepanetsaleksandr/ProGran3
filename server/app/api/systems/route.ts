import { NextRequest } from 'next/server';
import { withPublicApi, ApiContext } from '@/lib/api-handler';
import { apiSuccess, apiError } from '@/lib/api-response';

/**
 * GET /api/systems
 * Get all system information records with associated licenses
 */
export const GET = withPublicApi(async ({ supabase }: ApiContext) => {
  try {
    const { data: systems, error } = await supabase
      .from('system_infos')
      .select(`
        *,
        licenses!inner(
          id,
          license_key,
          status,
          users(email, name)
        )
      `)
      .order('last_seen', { ascending: false });

    if (error) {
      console.error('[Systems] Database error:', error);
      throw error;
    }

    return apiSuccess(systems || []);
  } catch (error) {
    return apiError(error as Error);
  }
});

/**
 * POST /api/systems
 * Create or update system information (upsert based on fingerprint)
 */
export const POST = withPublicApi(async ({ supabase, request }: ApiContext) => {
  try {
    const body = await request.json();
    const { license_id, fingerprint_hash, system_data } = body;

    if (!license_id || !fingerprint_hash) {
      return apiError('license_id and fingerprint_hash are required', 400);
    }

    const currentDate = new Date().toISOString();

    // Upsert system info (update if exists, create if not)
    const { data: systemInfo, error } = await supabase
      .from('system_infos')
      .upsert(
        {
          license_id,
          fingerprint_hash,
          system_data: system_data || {},
          last_seen: currentDate,
          created_at: currentDate
        },
        {
          onConflict: 'fingerprint_hash',
          ignoreDuplicates: false
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[Systems] Upsert error:', error);
      throw error;
    }

    return apiSuccess(systemInfo, 'System information updated', 201);
  } catch (error) {
    return apiError(error as Error);
  }
});
