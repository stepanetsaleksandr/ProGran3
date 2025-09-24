-- Додавання колонки MAC адрес до таблиці plugins
-- Міграція 004: Add MAC address column

-- Додаємо колонку mac_address до таблиці plugins
ALTER TABLE plugins 
ADD COLUMN IF NOT EXISTS mac_address VARCHAR(17);

-- Додаємо коментар до колонки
COMMENT ON COLUMN plugins.mac_address IS 'MAC address of the network interface';

-- Створюємо індекс для швидкого пошуку по MAC адресі
CREATE INDEX IF NOT EXISTS idx_plugins_mac_address ON plugins(mac_address);

-- Оновлюємо існуючі записи (якщо потрібно)
-- UPDATE plugins SET mac_address = 'unknown' WHERE mac_address IS NULL;
