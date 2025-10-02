-- Create license_keys table in Supabase
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_license_keys_key ON license_keys(license_key);
CREATE INDEX IF NOT EXISTS idx_license_keys_status ON license_keys(status);
CREATE INDEX IF NOT EXISTS idx_license_keys_user_id ON license_keys(user_id);

-- Enable RLS
ALTER TABLE license_keys ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Service role full access" ON license_keys
  FOR ALL USING (auth.role() = 'service_role');

-- Insert test data
INSERT INTO license_keys (license_key, duration_days, description, status) 
VALUES 
  ('PROGRAN3-2025-TEST1', 30, 'Test license 30 days', 'generated'),
  ('PROGRAN3-2025-TEST2', 365, 'Test license 365 days', 'generated')
ON CONFLICT (license_key) DO NOTHING;