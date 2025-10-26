-- Performance indexes for ProGran3 database

-- Licenses table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_licenses_expires ON licenses(expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_licenses_device_fingerprint ON licenses(device_fingerprint);

-- System infos table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_infos_license ON system_infos(license_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_infos_fingerprint ON system_infos(fingerprint_hash);

-- Heartbeats table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_heartbeats_license ON heartbeats(license_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_heartbeats_timestamp ON heartbeats(timestamp);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_heartbeats_plugin_id ON heartbeats(plugin_id);

-- Telemetry table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_telemetry_license ON telemetry(license_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_telemetry_timestamp ON telemetry(timestamp);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_telemetry_event_type ON telemetry(event_type);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_licenses_status_expires ON licenses(status, expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_heartbeats_license_timestamp ON heartbeats(license_id, timestamp);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_telemetry_license_timestamp ON telemetry(license_id, timestamp);
