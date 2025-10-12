import { NextRequest } from 'next/server';
import { withPublicApi, ApiContext } from '@/lib/api-handler';
import { apiSuccess, apiError, apiValidationError, apiNotFound } from '@/lib/api-response';
import { validateBody, LicenseActivateSchema } from '@/lib/validation/schemas';

/**
 * POST /api/licenses/activate
 * Activate a license with user email and system fingerprint
 */
export const POST = withPublicApi(async ({ supabase, request }: ApiContext) => {
  try {
    // Validate request body
    const validation = await validateBody(request, LicenseActivateSchema);
    
    if (!validation.success) {
      return apiValidationError(validation.errors);
    }

    const { license_key, user_email, system_fingerprint } = validation.data;

    console.log('[License Activation] Attempt:', {
      license_key: license_key.substring(0, 20) + '...',
      user_email,
      fingerprint: system_fingerprint.substring(0, 16) + '...'
    });

    // Check if license key exists and is not already activated
    const { data: licenseKey, error: keyError } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', license_key)
      .in('status', ['generated', 'active'])
      .single();

    if (keyError || !licenseKey) {
      console.warn('[License Activation] Invalid key:', license_key);
      return apiError('Invalid or already activated license key', 400);
    }

    // Check if user exists, create if not
    let userId: string;
    const { data: existingUser, error: userFetchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', user_email)
      .single();

    if (userFetchError && userFetchError.code === 'PGRST116') {
      // User doesn't exist, create new user
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          email: user_email,
          name: user_email.split('@')[0],
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (createUserError) {
        console.error('[License Activation] User creation error:', createUserError);
        throw createUserError;
      }

      userId = newUser.id;
      console.log('[License Activation] New user created:', userId);
    } else if (userFetchError) {
      console.error('[License Activation] User fetch error:', userFetchError);
      throw userFetchError;
    } else {
      userId = existingUser.id;
    }

    // Calculate expiration date
    const activationDate = new Date();
    const expirationDate = new Date(activationDate.getTime() + (licenseKey.duration_days * 24 * 60 * 60 * 1000));

    // Update license status
    const { data: activatedLicense, error: licenseError } = await supabase
      .from('licenses')
      .update({
        user_id: userId,
        status: 'active',
        activated_at: activationDate.toISOString(),
        expires_at: expirationDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', licenseKey.id)
      .select()
      .single();

    if (licenseError) {
      console.error('[License Activation] License update error:', licenseError);
      throw licenseError;
    }

    // Create system info record
    const { data: systemInfo, error: systemError } = await supabase
      .from('system_infos')
      .insert({
        license_id: activatedLicense.id,
        fingerprint_hash: system_fingerprint,
        system_data: { fingerprint: system_fingerprint },
        last_seen: activationDate.toISOString(),
        created_at: activationDate.toISOString()
      })
      .select()
      .single();

    if (systemError) {
      console.error('[License Activation] System info error:', systemError);
      // Don't fail activation if system info creation fails
    }

    console.log('[License Activation] Success:', {
      license_id: activatedLicense.id,
      user_id: userId,
      expires_at: expirationDate
    });

    return apiSuccess({
      license_id: activatedLicense.id,
      license_key: activatedLicense.license_key,
      user_email,
      duration_days: activatedLicense.duration_days,
      activated_at: activationDate.toISOString(),
      expires_at: expirationDate.toISOString(),
      status: 'active'
    }, 'License activated successfully');
  } catch (error) {
    console.error('[License Activation] Error:', error);
    return apiError(error as Error);
  }
});
