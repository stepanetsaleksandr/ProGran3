import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://zgkxtdjdaqnktjxunbeu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpna3h0ZGpkYXFua3RqeHVuYmV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM1MDU3NCwiZXhwIjoyMDc0OTI2NTc0fQ.3GKhAoHc1Pprsf0qUBvieXzTTQf0OGeJK53PGgQ1iiE'
);

export async function POST() {
  try {
    // Create license_keys table
    const { data, error } = await supabase.rpc('exec_sql', {
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

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: 'Failed to create license_keys table'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database setup completed successfully',
      data: data
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'General error occurred during setup'
    }, { status: 500 });
  }
}
