import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://zgkxtdjdaqnktjxunbeu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna3h0ZGpkYXFua3RqeHVuYmV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM1MDU3NCwiZXhwIjoyMDc0OTI2NTc0fQ.3GKhAoHc1Pprsf0qUBvieXzTTQf0OGeJK53PGgQ1iiE'
);

export async function GET() {
  try {
    // Test connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: 'Database connection failed'
      }, { status: 500 });
    }

    // Test license_keys table
    const { data: keysData, error: keysError } = await supabase
      .from('license_keys')
      .select('count')
      .limit(1);

    if (keysError) {
      return NextResponse.json({ 
        success: false, 
        error: keysError.message,
        details: 'license_keys table does not exist or has issues',
        suggestion: 'Run the SQL script to create license_keys table'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      tables: {
        users: 'exists',
        license_keys: 'exists'
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'General error occurred'
    }, { status: 500 });
  }
}
