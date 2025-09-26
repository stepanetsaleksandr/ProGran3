-- Очищення всіх ліцензій з бази даних ProGran3
-- ВАЖЛИВО: Це видалить ВСІ ліцензії та активації!

-- 1. Видаляємо всі активації користувачів
DELETE FROM user_licenses;

-- 2. Видаляємо всі ліцензії
DELETE FROM licenses;

-- 3. Скидаємо послідовності (якщо потрібно)
-- ALTER SEQUENCE licenses_id_seq RESTART WITH 1;
-- ALTER SEQUENCE user_licenses_id_seq RESTART WITH 1;

-- 4. Перевіряємо що таблиці порожні
SELECT 'licenses' as table_name, COUNT(*) as count FROM licenses
UNION ALL
SELECT 'user_licenses' as table_name, COUNT(*) as count FROM user_licenses;

-- Результат: обидві таблиці мають показувати count = 0
