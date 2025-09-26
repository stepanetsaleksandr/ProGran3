-- Міграція 006: Виправлення схеми ліцензування
-- Додаємо поле activated_at та виправляємо логіку терміну дії

-- 1. Додаємо поле activated_at в user_licenses якщо його немає
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_licenses' 
        AND column_name = 'activated_at'
    ) THEN
        ALTER TABLE user_licenses ADD COLUMN activated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- 2. Оновлюємо існуючі записи user_licenses - встановлюємо activated_at = created_at
UPDATE user_licenses 
SET activated_at = created_at 
WHERE activated_at IS NULL;

-- 3. Додаємо індекс для activated_at якщо його немає
CREATE INDEX IF NOT EXISTS idx_user_licenses_activated_at ON user_licenses(activated_at);

-- 4. Оновлюємо індекс для days_valid якщо expires_at існував
DROP INDEX IF EXISTS idx_licenses_expires_at;
CREATE INDEX IF NOT EXISTS idx_licenses_days_valid ON licenses(days_valid);

-- 5. Оновлюємо композитний індекс
DROP INDEX IF EXISTS idx_licenses_active_expires;
CREATE INDEX IF NOT EXISTS idx_licenses_active_days_valid ON licenses(is_active, days_valid);

-- 6. Перевіряємо структуру таблиць
SELECT 
    'licenses' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'licenses'
UNION ALL
SELECT 
    'user_licenses' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_licenses'
ORDER BY table_name, column_name;
