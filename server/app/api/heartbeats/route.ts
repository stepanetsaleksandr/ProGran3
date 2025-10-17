import { withPublicApi, ApiContext } from '@/lib/api-handler';
import { apiSuccess, apiError } from '@/lib/api-response';

/**
 * POST /api/heartbeats
 * Record heartbeat from plugin (system is active)
 */
export const POST = withPublicApi(async ({ supabase, request }: ApiContext) => {
  try {
    const body = await request.json();
    const { 
      license_key, 
      system_fingerprint, 
      timestamp,
      event_type,
      plugin_version,
      session_start,
      session_duration,
      sketchup_version,
      platform
    } = body;

    if (!license_key || !system_fingerprint) {
      return apiError('license_key and system_fingerprint are required', 400);
    }

    console.log('[Heartbeat] Received:', {
      license_key: license_key.substring(0, 20) + '...',
      fingerprint: system_fingerprint.substring(0, 16) + '...',
      event_type: event_type || 'heartbeat',
      plugin_version,
      timestamp
    });

    // Find license
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('id, status')
      .eq('license_key', license_key)
      .single();

    if (licenseError || !license) {
      console.warn('[Heartbeat] License not found:', license_key);
      return apiError('Invalid license key', 404);
    }

    // Check if license is active
    if (license.status !== 'active') {
      console.warn('[Heartbeat] License not active:', license_key, license.status);
      return apiError('License is not active', 403);
    }

    // Update system_infos last_seen with enhanced data
    const currentTime = new Date().toISOString();
    
    // Prepare enhanced system_data
    const systemData: any = {
      last_heartbeat: timestamp || Date.now(),
      updated_at: currentTime,
      plugin_version: plugin_version || 'unknown',
      sketchup_version: sketchup_version || 'unknown',
      platform: platform || 'unknown',
      event_type: event_type || 'heartbeat'
    };
    
    // Додаємо session info якщо є
    if (session_start) {
      systemData.session_start = session_start;
      systemData.session_duration = session_duration || 0;
    }
    
    // Для startup events зберігаємо окремо
    if (event_type === 'startup') {
      systemData.last_startup = currentTime;
    }
    
    const { data: systemInfo, error: systemError } = await supabase
      .from('system_infos')
      .upsert(
        {
          license_id: license.id,
          fingerprint_hash: system_fingerprint,
          last_seen: currentTime,
          system_data: systemData
        },
        {
          onConflict: 'fingerprint_hash',
          ignoreDuplicates: false
        }
      )
      .select()
      .single();

    if (systemError) {
      console.error('[Heartbeat] System info error:', systemError);
      throw systemError;
    }

    // Create heartbeat record with event type
    const { data: heartbeat, error: heartbeatError } = await supabase
      .from('heartbeats')
      .insert({
        license_id: license.id,
        system_info_id: systemInfo.id,
        status: event_type === 'startup' ? 'startup' : 'active',
        created_at: currentTime
      })
      .select()
      .single();

    if (heartbeatError) {
      console.error('[Heartbeat] Insert error:', heartbeatError);
      // Don't fail if heartbeat insert fails, system_info is updated
    }

    console.log('[Heartbeat] Success:', {
      license_id: license.id,
      system_info_id: systemInfo.id
    });

    return apiSuccess({
      status: 'active',
      last_seen: currentTime,
      license_status: license.status
    }, 'Heartbeat recorded');
  } catch (error) {
    console.error('[Heartbeat] Error:', error);
    return apiError(error as Error);
  }
});

/**
 * GET /api/heartbeats
 * Get recent heartbeats (for monitoring)
 */
export const GET = withPublicApi(async ({ supabase, request }: ApiContext) => {
  try {
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '50');
    const since = searchParams.get('since'); // ISO timestamp

    let query = supabase
      .from('heartbeats')
      .select(`
        *,
        licenses(license_key, status),
        system_infos(fingerprint_hash, last_seen)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (since) {
      query = query.gte('created_at', since);
    }

    const { data: heartbeats, error } = await query;

    if (error) {
      console.error('[Heartbeats Get] Error:', error);
      throw error;
    }

    return apiSuccess(heartbeats || []);
  } catch (error) {
    return apiError(error as Error);
  }
});

