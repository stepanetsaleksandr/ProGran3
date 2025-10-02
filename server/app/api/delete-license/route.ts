import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://zgkxtdjdaqnktjxunbeu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna3h0ZGpkYXFua3RqeHVuYmV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM1MDU3NCwiZXhwIjoyMDc0OTI2NTc0fQ.3GKhAoHc1Pprsf0qUBvieXzTTQf0OGeJK53PGgQ1iiE'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'License ID is required' }, { status: 400 });
    }

    console.log('Attempting to delete license with ID:', id);

    // Try to delete from license_keys table first
    const { data: licenseKeysData, error: licenseKeysError } = await supabase
      .from('license_keys')
      .delete()
      .eq('id', id)
      .select();

    if (licenseKeysError) {
      console.log('License keys deletion error:', licenseKeysError.message);
      
      // If license_keys table doesn't exist, try licenses table
      if (licenseKeysError.message.includes('relation "license_keys" does not exist')) {
        console.log('license_keys table does not exist, trying licenses table...');
        
        const { data: licensesData, error: licensesError } = await supabase
          .from('licenses')
          .delete()
          .eq('id', id)
          .select();

        if (licensesError) {
          console.error('Licenses deletion error:', licensesError);
          throw licensesError;
        }

        console.log('Successfully deleted from licenses table:', licensesData);
        return NextResponse.json({ 
          success: true, 
          message: 'License deleted from licenses table',
          data: licensesData
        });
      } else {
        throw licenseKeysError;
      }
    }

    console.log('Successfully deleted from license_keys table:', licenseKeysData);
    return NextResponse.json({ 
      success: true, 
      message: 'License deleted from license_keys table',
      data: licenseKeysData
    });
  } catch (error) {
    console.error('Delete license error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
