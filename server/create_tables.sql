-- Створення таблиць для нової системи ліцензування ProGran3

-- 1. Таблиця licenses (майстер-дані про ліцензійні ключі)
CREATE TABLE IF NOT EXISTS licenses (
  id SERIAL PRIMARY KEY,
  license_key VARCHAR(255) UNIQUE NOT NULL,
  license_type VARCHAR(50) DEFAULT 'standard',
  days_valid INTEGER DEFAULT 365, -- Днів дії з моменту активації
  is_active BOOLEAN DEFAULT true,
  activation_count INTEGER DEFAULT 0,
  max_activations INTEGER DEFAULT 1,
  features JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Таблиця user_licenses (реєстрації користувачів)
CREATE TABLE IF NOT EXISTS user_licenses (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  license_key VARCHAR(255) NOT NULL,
  hardware_id VARCHAR(255),
  activated_at TIMESTAMP DEFAULT NOW(), -- Дата активації ліцензії
  last_heartbeat TIMESTAMP,
  offline_count INTEGER DEFAULT 0,
  max_offline_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(email, license_key, hardware_id)
);

-- 3. Додавання тестових ліцензій
INSERT INTO licenses (license_key, license_type, days_valid, is_active, activation_count, max_activations, features) VALUES
(
  'TQ58-IKVR-9X2M-7N4P',
  'trial',
  30, -- 30 днів дії з моменту активації
  true,
  0,
  1,
  '{"trial": true, "max_offline_hours": 24, "features": ["basic_gravestones", "basic_flowerbeds"]}'::jsonb
),
(
  'DEMO-1234-5678-9ABC',
  'demo',
  7, -- 7 днів дії з моменту активації
  true,
  0,
  1,
  '{"demo": true, "max_offline_hours": 12, "features": ["demo_gravestones"]}'::jsonb
),
(
  'FULL-ABCD-EFGH-IJKL',
  'full',
  365, -- 365 днів дії з моменту активації
  true,
  0,
  3,
  '{"full": true, "max_offline_hours": 48, "features": ["all_gravestones", "all_flowerbeds", "all_steles", "all_lamps"]}'::jsonb
)
ON CONFLICT (license_key) DO NOTHING;

-- 4. Створення індексів для оптимізації
CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_is_active ON licenses(is_active);
CREATE INDEX IF NOT EXISTS idx_licenses_license_type ON licenses(license_type);
CREATE INDEX IF NOT EXISTS idx_licenses_days_valid ON licenses(days_valid);
CREATE INDEX IF NOT EXISTS idx_licenses_created_at ON licenses(created_at);

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
CREATE INDEX IF NOT EXISTS idx_licenses_active_days_valid ON licenses(is_active, days_valid);

-- 5. Перевірка створених таблиць
SELECT 'licenses' as table_name, COUNT(*) as record_count FROM licenses
UNION ALL
SELECT 'user_licenses' as table_name, COUNT(*) as record_count FROM user_licenses
UNION ALL
SELECT 'plugins' as table_name, COUNT(*) as record_count FROM plugins;
