import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://zgkxtdjdaqnktjxunbeu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna3h0ZGpkYXFua3RqeHVuYmV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM1MDU3NCwiZXhwIjoyMDc0OTI2NTc0fQ.3GKhAoHc1Pprsf0qUBvieXzTTQf0OGeJK53PGgQ1iiE'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { license_key, user_email, system_fingerprint } = body;

    if (!license_key || !user_email || !system_fingerprint) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Check if license key exists and is not activated
    const { data: licenseKey, error: keyError } = await supabase
      .from('license_keys')
      .select('*')
      .eq('license_key', license_key)
      .eq('status', 'generated')
      .single();

    if (keyError || !licenseKey) {
      return NextResponse.json({ success: false, error: 'Invalid or already activated license key' }, { status: 400 });
    }

    // Check if user exists, create if not
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', user_email)
      .single();

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, create new user
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          email: user_email,
          name: user_email.split('@')[0],
          created_at: new Date()
        })
        .select()
        .single();

      if (createUserError) throw createUserError;
      user = newUser;
    } else if (userError) {
      throw userError;
    }

    // Calculate expiration date
    const activationDate = new Date();
    const expirationDate = new Date(activationDate.getTime() + (licenseKey.duration_days * 24 * 60 * 60 * 1000));

    // Create activated license
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .insert({
        user_id: user.id,
        license_key: license_key,
        duration_days: licenseKey.duration_days,
        status: 'active',
        activated_at: activationDate,
        expires_at: expirationDate,
        created_at: new Date()
      })
      .select()
      .single();

    if (licenseError) throw licenseError;

    // Update license key status
    const { error: updateKeyError } = await supabase
      .from('license_keys')
      .update({ 
        status: 'activated',
        activated_at: activationDate,
        user_id: user.id
      })
      .eq('id', licenseKey.id);

    if (updateKeyError) throw updateKeyError;

    // Create system info record
    const { data: systemInfo, error: systemError } = await supabase
      .from('system_infos')
      .insert({
        license_id: license.id,
        fingerprint_hash: system_fingerprint,
        system_data: { fingerprint: system_fingerprint },
        last_seen: activationDate,
        created_at: activationDate
      })
      .select()
      .single();

    if (systemError) throw systemError;

    return NextResponse.json({ 
      success: true, 
      data: {
        license_id: license.id,
        user_email: user.email,
        duration_days: license.duration_days,
        activated_at: activationDate,
        expires_at: expirationDate,
        status: 'active'
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
