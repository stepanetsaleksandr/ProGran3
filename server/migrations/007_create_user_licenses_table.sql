-- Міграція 007: Створення таблиці user_licenses
-- Дата: 2025-09-28
-- Опис: Створює таблицю user_licenses для реєстрації користувачів з ліцензіями

-- 1. Створення таблиці user_licenses
CREATE TABLE IF NOT EXISTS user_licenses (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  license_key VARCHAR(255) NOT NULL,
  hardware_id VARCHAR(255),
  activated_at TIMESTAMP DEFAULT NOW(),
  last_heartbeat TIMESTAMP,
  offline_count INTEGER DEFAULT 0,
  max_offline_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(email, license_key, hardware_id)
);

-- 2. Створення індексів для оптимізації
CREATE INDEX IF NOT EXISTS idx_user_licenses_email ON user_licenses(email);
CREATE INDEX IF NOT EXISTS idx_user_licenses_license_key ON user_licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_user_licenses_hardware_id ON user_licenses(hardware_id);
CREATE INDEX IF NOT EXISTS idx_user_licenses_is_active ON user_licenses(is_active);
CREATE INDEX IF NOT EXISTS idx_user_licenses_activated_at ON user_licenses(activated_at);
CREATE INDEX IF NOT EXISTS idx_user_licenses_last_heartbeat ON user_licenses(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_user_licenses_created_at ON user_licenses(created_at);
CREATE INDEX IF NOT EXISTS idx_user_licenses_offline_count ON user_licenses(offline_count);

-- Композитні індекси для частіших запитів
CREATE INDEX IF NOT EXISTS idx_user_licenses_email_license_hardware ON user_licenses(email, license_key, hardware_id);
CREATE INDEX IF NOT EXISTS idx_user_licenses_active_heartbeat ON user_licenses(is_active, last_heartbeat);

-- 3. Перевірка створеної таблиці
SELECT 'user_licenses' as table_name, COUNT(*) as record_count FROM user_licenses;


