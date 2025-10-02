import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://zgkxtdjdaqnktjxunbeu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna3h0ZGpkYXFua3RqeHVuYmV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM1MDU3NCwiZXhwIjoyMDc0OTI2NTc0fQ.3GKhAoHc1Pprsf0qUBvieXzTTQf0OGeJK53PGgQ1iiE'
);

export async function GET(request: NextRequest) {
  try {
    // First try to get from license_keys table
    const { data: licenseKeys, error: licenseKeysError } = await supabase
      .from('license_keys')
      .select(`
        *,
        users(email, name)
      `)
      .order('created_at', { ascending: false });

    if (licenseKeysError && licenseKeysError.message.includes('relation "license_keys" does not exist')) {
      // If license_keys table doesn't exist, try to get from licenses table
      const { data: licenses, error: licensesError } = await supabase
        .from('licenses')
        .select(`
          *,
          users(email, name)
        `)
        .order('created_at', { ascending: false });

      if (licensesError) {
        console.error('Licenses error:', licensesError);
        throw licensesError;
      }

      return NextResponse.json({ success: true, data: licenses || [] });
    }

    if (licenseKeysError) {
      console.error('License keys error:', licenseKeysError);
      throw licenseKeysError;
    }

    return NextResponse.json({ success: true, data: licenseKeys || [] });
  } catch (error) {
    console.error('Get licenses error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}