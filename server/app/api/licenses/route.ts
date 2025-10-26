import { NextRequest } from 'next/server';
import { withPublicApi, ApiContext } from '@/lib/api-handler';
import { apiSuccess, apiError, apiValidationError } from '@/lib/api-response';
import { validateQuery, LicenseQuerySchema } from '@/lib/validation/schemas';

/**
 * GET /api/licenses
 * Get all licenses with optional filtering and pagination
 */
export const GET = withPublicApi(async ({ supabase, request }: ApiContext) => {
  try {
    // Auto-update expired licenses before fetching
    try {
      const { data: expiredLicenses } = await supabase
        .from('licenses')
        .select('id')
        .eq('status', 'active')
        .lt('expires_at', new Date().toISOString());
      
      if (expiredLicenses && expiredLicenses.length > 0) {
        console.log(`[License GET] Auto-updating ${expiredLicenses.length} expired licenses`);
        await supabase
          .from('licenses')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString()
          })
          .in('id', expiredLicenses.map(l => l.id));
      }
    } catch (autoUpdateError) {
      console.warn('[License GET] Auto-update expired licenses failed:', autoUpdateError);
      // Continue with normal flow even if auto-update fails
    }
    
    // Validate query parameters
    const validation = validateQuery(request.nextUrl.searchParams, LicenseQuerySchema);
    
    if (!validation.success) {
      return apiValidationError(validation.errors);
    }

    const { page, limit, sort, order, status, user_id, search } = validation.data;

    // Build query
    let query = supabase
      .from('licenses')
      .select(`
        *,
        users(email, name)
      `, { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (search) {
      query = query.or(`license_key.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting (with defaults from schema)
    const sortField = sort || 'created_at';
    const sortOrder = order || 'desc';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Apply pagination (with defaults)
    const currentPage = page || 1;
    const currentLimit = limit || 50;
    const start = (currentPage - 1) * currentLimit;
    const end = start + currentLimit - 1;
    query = query.range(start, end);

    // Execute query
    const { data: licenses, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Return with pagination metadata
    return apiSuccess({
      licenses: licenses || [],
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / currentLimit),
      }
    });
  } catch (error) {
    return apiError(error as Error);
  }
});

/**
 * POST /api/licenses
 * Create a new license (manual creation with specific parameters)
 * For generation, use /api/licenses/generate instead
 */
export const POST = withPublicApi(async ({ supabase, request }: ApiContext) => {
  try {
    const body = await request.json();
    const { user_id, license_key, duration_days, description, expires_at } = body;

    // Basic validation
    if (!license_key) {
      return apiError('License key is required', 400);
    }

    const currentDate = new Date().toISOString();

    const { data: license, error } = await supabase
      .from('licenses')
      .insert({
        user_id: user_id || null,
        license_key,
        duration_days: duration_days || 30,
        description: description || null,
        status: 'generated',
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        created_at: currentDate,
        updated_at: currentDate,
      })
      .select(`
        *,
        users(email, name)
      `)
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return apiError('License key already exists', 409);
      }
      console.error('Database error:', error);
      throw error;
    }

    return apiSuccess(license, 'License created successfully', 201);
  } catch (error) {
    return apiError(error as Error);
  }
});
