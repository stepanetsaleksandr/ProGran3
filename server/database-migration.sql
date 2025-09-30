-- Міграція існуючої бази даних до нової структури
-- Виконати в Supabase SQL Editor

-- 1. Додаємо поле is_blocked до існуючої таблиці plugins
ALTER TABLE plugins 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- 2. Робимо user_id та computer_name опціональними
ALTER TABLE plugins 
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE plugins 
ALTER COLUMN computer_name DROP NOT NULL;

-- 3. Створюємо таблицю ліцензій
CREATE TABLE IF NOT EXISTS licenses (
  id SERIAL PRIMARY KEY,
  license_key VARCHAR(20) UNIQUE NOT NULL,
  license_type VARCHAR(50) NOT NULL DEFAULT 'standard',
  days_valid INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  activation_count INTEGER NOT NULL DEFAULT 0,
  max_activations INTEGER NOT NULL DEFAULT 1,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Створюємо таблицю активацій ліцензій
CREATE TABLE IF NOT EXISTS user_licenses (
  id SERIAL PRIMARY KEY,
  license_key VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  hardware_id VARCHAR(255) NOT NULL,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(license_key, hardware_id)
);

-- 5. Створюємо таблицю аудиту
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Додаємо індекси
CREATE INDEX IF NOT EXISTS idx_plugins_is_blocked ON plugins(is_blocked);
CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_is_active ON licenses(is_active);
CREATE INDEX IF NOT EXISTS idx_user_licenses_license_key ON user_licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_user_licenses_hardware_id ON user_licenses(hardware_id);
CREATE INDEX IF NOT EXISTS idx_user_licenses_email ON user_licenses(email);

-- 7. Додаємо foreign key constraint
ALTER TABLE user_licenses 
ADD CONSTRAINT fk_user_licenses_license_key 
FOREIGN KEY (license_key) REFERENCES licenses(license_key) 
ON DELETE CASCADE;

-- 8. Функція для автоматичного оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Тригери для автоматичного оновлення updated_at
CREATE TRIGGER update_plugins_updated_at BEFORE UPDATE ON plugins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON licenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_licenses_updated_at BEFORE UPDATE ON user_licenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
