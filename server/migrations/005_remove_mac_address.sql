-- Видалення колонки MAC адрес з таблиці plugins
-- Міграція 005: Remove MAC address column

-- Видаляємо індекс для MAC адреси
DROP INDEX IF EXISTS idx_plugins_mac_address;

-- Видаляємо колонку mac_address
ALTER TABLE plugins
DROP COLUMN IF EXISTS mac_address;

-- Додаємо коментар про видалення
COMMENT ON TABLE plugins IS 'Plugins table without MAC address column (removed in migration 005)';
