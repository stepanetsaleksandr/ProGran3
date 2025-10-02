import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://zgkxtdjdaqnktjxunbeu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna3h0ZGpkYXFua3RqeHVuYmV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM1MDU3NCwiZXhwIjoyMDc0OTI2NTc0fQ.3GKhAoHc1Pprsf0qUBvieXzTTQf0OGeJK53PGgQ1iiE'
);

export async function GET() {
  try {
    // Check if license_keys table exists
    const { data: licenseKeys, error: licenseKeysError } = await supabase
      .from('license_keys')
      .select('count')
      .limit(1);

    if (licenseKeysError) {
      return NextResponse.json({ 
        success: false, 
        error: licenseKeysError.message,
        tableExists: false,
        suggestion: 'Table license_keys does not exist. Please create it first.'
      }, { status: 500 });
    }

    // Check if licenses table exists
    const { data: licenses, error: licensesError } = await supabase
      .from('licenses')
      .select('count')
      .limit(1);

    if (licensesError) {
      return NextResponse.json({ 
        success: false, 
        error: licensesError.message,
        tableExists: false,
        suggestion: 'Table licenses does not exist. Please create it first.'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database tables exist',
      tables: {
        license_keys: 'exists',
        licenses: 'exists'
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'General error occurred during database check'
    }, { status: 500 });
  }
}
