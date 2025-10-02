import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://zgkxtdjdaqnktjxunbeu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna3h0ZGpkYXFua3RqeHVuYmV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM1MDU3NCwiZXhwIjoyMDc0OTI2NTc0fQ.3GKhAoHc1Pprsf0qUBvieXzTTQf0OGeJK53PGgQ1iiE'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { duration_days, description } = body;

    console.log('Generate license request:', { duration_days, description });

    if (!duration_days || duration_days < 1) {
      return NextResponse.json({ success: false, error: 'Duration must be at least 1 day' }, { status: 400 });
    }

    // Generate unique license key
    const generateLicenseKey = () => {
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString(36).toUpperCase();
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `PROGRAN3-${year}-${randomPart}-${timestamp}`;
    };

    const license_key = generateLicenseKey();
    console.log('Generated license key:', license_key);

    // Try to create license key record (not activated yet)
    let { data: license, error } = await supabase
      .from('license_keys')
      .insert({
        license_key,
        duration_days,
        description: description || `${duration_days} days license`,
        status: 'generated',
        created_at: new Date()
      })
      .select()
      .single();

    // If table doesn't exist, try to create it first
    if (error && error.message.includes('relation "license_keys" does not exist')) {
      console.log('Table license_keys does not exist, creating it...');
      
      // Try to create the table using raw SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS license_keys (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            license_key VARCHAR(255) UNIQUE NOT NULL,
            duration_days INTEGER NOT NULL DEFAULT 30,
            description TEXT,
            status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generated', 'activated')),
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            activated_at TIMESTAMP WITH TIME ZONE
          );
          
          CREATE INDEX IF NOT EXISTS idx_license_keys_key ON license_keys(license_key);
          CREATE INDEX IF NOT EXISTS idx_license_keys_status ON license_keys(status);
          CREATE INDEX IF NOT EXISTS idx_license_keys_user_id ON license_keys(user_id);
          
          ALTER TABLE license_keys ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Service role full access" ON license_keys
            FOR ALL USING (auth.role() = 'service_role');
        `
      });

      if (createError) {
        console.error('Failed to create table:', createError);
        throw new Error(`Failed to create license_keys table: ${createError.message}`);
      }

      // Try again after creating the table
      const { data: retryLicense, error: retryError } = await supabase
        .from('license_keys')
        .insert({
          license_key,
          duration_days,
          description: description || `${duration_days} days license`,
          status: 'generated',
          created_at: new Date()
        })
        .select()
        .single();

      if (retryError) {
        console.error('Supabase error after table creation:', retryError);
        throw retryError;
      }

      license = retryLicense;
    } else if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('License created successfully:', license);

    return NextResponse.json({ 
      success: true, 
      data: {
        id: license.id,
        license_key: license.license_key,
        duration_days: license.duration_days,
        description: license.description,
        status: license.status,
        created_at: license.created_at
      }
    });
  } catch (error) {
    console.error('Generate license error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
