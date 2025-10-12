import { withPublicApi, ApiContext } from '@/lib/api-handler';
import { apiSuccess, apiError } from '@/lib/api-response';
import { cachedApiSuccess } from '@/lib/cache';
import { getDashboardStatsOptimized } from '@/lib/query-optimizer';

/**
 * GET /api/dashboard/stats
 * Get comprehensive dashboard statistics (optimized with caching)
 */
export const GET = withPublicApi(async ({ supabase }: ApiContext) => {
  try {
    console.log('[Dashboard Stats] Fetching optimized stats...');

    // Use optimized parallel queries
    const stats = await getDashboardStatsOptimized(supabase);

    console.log('[Dashboard Stats] Calculated:', stats);

    // Return with short caching (1 minute) for better performance
    return cachedApiSuccess(stats, 'short', 'Dashboard statistics retrieved');
  } catch (error) {
    console.error('[Dashboard Stats] Error:', error);
    return apiError(error as Error);
  }
});

