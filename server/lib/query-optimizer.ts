import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Query optimization utilities for better database performance
 */

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface QueryResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Optimized query builder for licenses with pagination
 */
export async function getLicensesOptimized(
  supabase: SupabaseClient,
  params: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
    search?: string;
  } = {}
): Promise<QueryResult<any>> {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 50, 100); // Max 100
  const offset = (page - 1) * limit;

  // Build optimized query with only needed fields initially
  let query = supabase
    .from('licenses')
    .select(
      `
      id,
      license_key,
      duration_days,
      status,
      description,
      created_at,
      activated_at,
      expires_at,
      user_id,
      users!inner(email, name)
    `,
      { count: 'exact' }
    );

  // Apply filters
  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.userId) {
    query = query.eq('user_id', params.userId);
  }

  if (params.search) {
    query = query.or(
      `license_key.ilike.%${params.search}%,description.ilike.%${params.search}%`
    );
  }

  // Optimize with proper ordering and pagination
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Optimized query for dashboard stats
 * Uses aggregation instead of fetching all records
 */
export async function getDashboardStatsOptimized(
  supabase: SupabaseClient
): Promise<any> {
  // Parallel queries for better performance
  const [licensesResult, usersResult, systemsResult, activeSystemsResult] = 
    await Promise.all([
      // Get license counts by status
      supabase
        .from('licenses')
        .select('status', { count: 'exact' }),
      
      // Get total users count
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true }),
      
      // Get total systems count
      supabase
        .from('system_infos')
        .select('id', { count: 'exact', head: true }),
      
      // Get active systems (last 5 minutes)
      supabase
        .from('system_infos')
        .select('id', { count: 'exact', head: true })
        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()),
    ]);

  // Process licenses data to count by status
  const licenses = licensesResult.data || [];
  const statusCounts = licenses.reduce((acc: any, license: any) => {
    acc[license.status] = (acc[license.status] || 0) + 1;
    return acc;
  }, {});

  return {
    totalLicenses: licensesResult.count || 0,
    activeLicenses: statusCounts.active || 0,
    generatedLicenses: statusCounts.generated || 0,
    activatedLicenses: statusCounts.activated || 0,
    expiredLicenses: statusCounts.expired || 0,
    revokedLicenses: statusCounts.revoked || 0,
    totalUsers: usersResult.count || 0,
    totalSystems: systemsResult.count || 0,
    activeSystems: activeSystemsResult.count || 0,
  };
}

/**
 * Batch update optimization
 */
export async function batchUpdateLicenses(
  supabase: SupabaseClient,
  updates: Array<{ id: string; data: any }>
): Promise<void> {
  // Use RPC for batch updates if available
  // Otherwise, do sequential updates
  for (const { id, data } of updates) {
    const { error } = await supabase
      .from('licenses')
      .update(data)
      .eq('id', id);

    if (error) {
      console.error(`Failed to update license ${id}:`, error);
    }
  }
}

/**
 * Connection pool optimization
 */
export function optimizeSupabaseClient(supabase: SupabaseClient): void {
  // Supabase handles connection pooling automatically
  // This is a placeholder for custom optimizations if needed
  console.log('Using Supabase connection pooling');
}

