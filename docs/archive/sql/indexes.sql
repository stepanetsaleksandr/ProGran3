-- =====================================================
-- DATABASE OPTIMIZATION - INDEXES & PERFORMANCE
-- Execute in Supabase SQL Editor for better performance
-- =====================================================

-- Licenses table indexes
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_expires_at ON licenses(expires_at);
CREATE INDEX IF NOT EXISTS idx_licenses_created_at ON licenses(created_at);
CREATE INDEX IF NOT EXISTS idx_licenses_activated_at ON licenses(activated_at);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_licenses_status_expires ON licenses(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_licenses_user_status ON licenses(user_id, status);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- System_infos table indexes
CREATE INDEX IF NOT EXISTS idx_system_infos_license_id ON system_infos(license_id);
CREATE INDEX IF NOT EXISTS idx_system_infos_fingerprint ON system_infos(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_system_infos_last_seen ON system_infos(last_seen DESC);

-- Composite index for active systems query
CREATE INDEX IF NOT EXISTS idx_system_infos_last_seen_license ON system_infos(last_seen DESC, license_id);

-- Heartbeats table indexes
CREATE INDEX IF NOT EXISTS idx_heartbeats_license_id ON heartbeats(license_id);
CREATE INDEX IF NOT EXISTS idx_heartbeats_system_info_id ON heartbeats(system_info_id);
CREATE INDEX IF NOT EXISTS idx_heartbeats_created_at ON heartbeats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_heartbeats_status ON heartbeats(status);

-- Composite index for recent heartbeats query
CREATE INDEX IF NOT EXISTS idx_heartbeats_created_license ON heartbeats(created_at DESC, license_id);

-- =====================================================
-- VACUUM AND ANALYZE (for query planner optimization)
-- Run periodically for best performance
-- =====================================================

VACUUM ANALYZE licenses;
VACUUM ANALYZE users;
VACUUM ANALYZE system_infos;
VACUUM ANALYZE heartbeats;

-- =====================================================
-- STATISTICS UPDATE (helps query planner)
-- =====================================================

ANALYZE licenses;
ANALYZE users;
ANALYZE system_infos;
ANALYZE heartbeats;

-- =====================================================
-- VIEW EXISTING INDEXES
-- =====================================================

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

