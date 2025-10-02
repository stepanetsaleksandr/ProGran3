import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://zgkxtdjdaqnktjxunbeu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna3h0ZGpkYXFua3RqeHVuYmV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM1MDU3NCwiZXhwIjoyMDc0OTI2NTc0fQ.3GKhAoHc1Pprsf0qUBvieXzTTQf0OGeJK53PGgQ1iiE'
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'License ID is required' }, { status: 400 });
    }

    // Try to delete from license_keys table first
    const { error: licenseKeysError } = await supabase
      .from('license_keys')
      .delete()
      .eq('id', id);

    if (licenseKeysError && !licenseKeysError.message.includes('relation "license_keys" does not exist')) {
      console.error('License keys deletion error:', licenseKeysError);
      throw licenseKeysError;
    }

    // If license_keys table doesn't exist or deletion failed, try licenses table
    if (licenseKeysError && licenseKeysError.message.includes('relation "license_keys" does not exist')) {
      const { error: licensesError } = await supabase
        .from('licenses')
        .delete()
        .eq('id', id);

      if (licensesError) {
        console.error('Licenses deletion error:', licensesError);
        throw licensesError;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'License deleted successfully' 
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'License ID is required' }, { status: 400 });
    }

    // Try to get from license_keys table first
    const { data: licenseKey, error: licenseKeysError } = await supabase
      .from('license_keys')
      .select(`
        *,
        users(email, name)
      `)
      .eq('id', id)
      .single();

    if (licenseKeysError && !licenseKeysError.message.includes('relation "license_keys" does not exist')) {
      console.error('License keys fetch error:', licenseKeysError);
      throw licenseKeysError;
    }

    // If license_keys table doesn't exist, try licenses table
    if (licenseKeysError && licenseKeysError.message.includes('relation "license_keys" does not exist')) {
      const { data: license, error: licensesError } = await supabase
        .from('licenses')
        .select(`
          *,
          users(email, name)
        `)
        .eq('id', id)
        .single();

      if (licensesError) {
        console.error('Licenses fetch error:', licensesError);
        throw licensesError;
      }

      return NextResponse.json({ success: true, data: license });
    }

    return NextResponse.json({ success: true, data: licenseKey });
  } catch (error) {
    console.error('Get license error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { duration_days, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'License ID is required' }, { status: 400 });
    }

    // Try to update license_keys table first
    const { data: licenseKey, error: licenseKeysError } = await supabase
      .from('license_keys')
      .update({
        duration_days,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (licenseKeysError && !licenseKeysError.message.includes('relation "license_keys" does not exist')) {
      console.error('License keys update error:', licenseKeysError);
      throw licenseKeysError;
    }

    // If license_keys table doesn't exist, try licenses table
    if (licenseKeysError && licenseKeysError.message.includes('relation "license_keys" does not exist')) {
      const { data: license, error: licensesError } = await supabase
        .from('licenses')
        .update({
          duration_days,
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (licensesError) {
        console.error('Licenses update error:', licensesError);
        throw licensesError;
      }

      return NextResponse.json({ success: true, data: license });
    }

    return NextResponse.json({ success: true, data: licenseKey });
  } catch (error) {
    console.error('Update license error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}