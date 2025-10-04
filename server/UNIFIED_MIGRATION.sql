-- ===========================================
-- UNIFIED MIGRATION - ОБ'ЄДНАННЯ ТАБЛИЦЬ
-- Виконайте цей скрипт в Supabase SQL Editor
-- ===========================================

-- Крок 1: Перевірка поточного стану
SELECT '=== ПОТОЧНИЙ СТАН ===' as info;

SELECT 
  'license_keys' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN status = 'generated' THEN 1 END) as generated,
  COUNT(CASE WHEN status = 'activated' THEN 1 END) as activated
FROM license_keys
UNION ALL
SELECT 
  'licenses' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN status = 'generated' THEN 1 END) as generated,
  COUNT(CASE WHEN status = 'activated' THEN 1 END) as activated
FROM licenses;

-- Крок 2: Додавання відсутніх колонок до licenses (якщо потрібно)
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Крок 3: Оновлення constraint для status
ALTER TABLE licenses DROP CONSTRAINT IF EXISTS licenses_status_check;
ALTER TABLE licenses ADD CONSTRAINT licenses_status_check 
  CHECK (status IN ('generated', 'activated', 'active', 'expired', 'revoked'));

-- Крок 4: Міграція ВСІХ даних з license_keys в licenses
INSERT INTO licenses (
  id, 
  license_key, 
  duration_days, 
  description, 
  status, 
  user_id, 
  created_at, 
  activated_at,
  expires_at,
  updated_at
)
SELECT 
  id,
  license_key,
  duration_days,
  description,
  status,
  user_id,
  created_at,
  activated_at,
  CASE 
    WHEN activated_at IS NOT NULL THEN 
      activated_at + INTERVAL '1 day' * duration_days
    ELSE NULL 
  END as expires_at,
  NOW() as updated_at
FROM license_keys
WHERE NOT EXISTS (
  SELECT 1 FROM licenses 
  WHERE licenses.license_key = license_keys.license_key
)
ON CONFLICT (license_key) DO UPDATE SET
  duration_days = EXCLUDED.duration_days,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  user_id = EXCLUDED.user_id,
  activated_at = EXCLUDED.activated_at,
  expires_at = EXCLUDED.expires_at,
  updated_at = EXCLUDED.updated_at;

-- Крок 5: Оновлення статусів ліцензій
UPDATE licenses 
SET status = 'active' 
WHERE status IN ('generated', 'activated') 
  AND (expires_at IS NULL OR expires_at > NOW());

UPDATE licenses 
SET status = 'expired' 
WHERE expires_at IS NOT NULL 
  AND expires_at <= NOW() 
  AND status != 'expired';

-- Крок 6: Створення індексів для performance
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_expires_at ON licenses(expires_at);

-- Крок 7: Створення trigger для updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_licenses_updated_at ON licenses;
CREATE TRIGGER update_licenses_updated_at 
    BEFORE UPDATE ON licenses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Крок 8: Перевірка результатів
SELECT '=== РЕЗУЛЬТАТИ МІГРАЦІЇ ===' as info;

SELECT 
  'licenses' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
  COUNT(CASE WHEN status = 'generated' THEN 1 END) as generated,
  COUNT(CASE WHEN status = 'activated' THEN 1 END) as activated,
  COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired
FROM licenses;

-- Крок 9: Перевірка дублікатів
SELECT '=== ПЕРЕВІРКА ДУБЛІКАТІВ ===' as info;

SELECT license_key, COUNT(*) as count
FROM licenses 
GROUP BY license_key 
HAVING COUNT(*) > 1;

-- Крок 10: Фінальна статистика
SELECT '=== ФІНАЛЬНА СТАТИСТИКА ===' as info;

SELECT 
  'Всього ліцензій в licenses' as metric,
  COUNT(*) as value
FROM licenses
UNION ALL
SELECT 
  'Активні ліцензії' as metric,
  COUNT(*) as value
FROM licenses 
WHERE status = 'active'
UNION ALL
SELECT 
  'Прострочені ліцензії' as metric,
  COUNT(*) as value
FROM licenses 
WHERE status = 'expired'
UNION ALL
SELECT 
  'Залишилось в license_keys' as metric,
  COUNT(*) as value
FROM license_keys;

-- Крок 11: Видалення license_keys (ПІСЛЯ ПЕРЕВІРКИ!)
-- Розкоментуйте наступний рядок ТІЛЬКИ після перевірки, що все працює:
-- DROP TABLE IF EXISTS license_keys CASCADE;

SELECT '=== МІГРАЦІЯ ЗАВЕРШЕНА ===' as info;
SELECT 'Тепер всі дані в таблиці licenses!' as message;
