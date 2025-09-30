-- Міграція 008: Додавання Foreign Key constraints та тригерів (БЕЗПЕЧНА ВЕРСІЯ)
-- Дата: 2025-09-28
-- Опис: Додає формальні зв'язки між таблицями для покращення цілісності даних
-- ПЕРЕД ВИКОНАННЯМ: Переконайтеся, що таблиця user_licenses створена!

-- 0. Перевірка існування таблиць
DO $$
BEGIN
  -- Перевіряємо чи існує таблиця user_licenses
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_licenses') THEN
    RAISE EXCEPTION 'Таблиця user_licenses не існує! Спочатку виконайте create-user-licenses-manual.sql';
  END IF;
  
  -- Перевіряємо чи існує таблиця licenses
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'licenses') THEN
    RAISE EXCEPTION 'Таблиця licenses не існує!';
  END IF;
  
  -- Перевіряємо чи існує таблиця plugins
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plugins') THEN
    RAISE EXCEPTION 'Таблиця plugins не існує!';
  END IF;
  
  RAISE NOTICE 'Всі необхідні таблиці існують, продовжуємо з міграцією...';
END $$;

-- 1. Додавання Foreign Key між user_licenses та licenses
-- Це забезпечує, що user_licenses.license_key завжди посилається на існуючу ліцензію
ALTER TABLE user_licenses 
ADD CONSTRAINT fk_user_licenses_license_key 
FOREIGN KEY (license_key) REFERENCES licenses(license_key) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Додавання унікального ключа в user_licenses для зв'язку з plugins
-- Це дозволить plugins посилатися на конкретну активацію ліцензії
ALTER TABLE user_licenses 
ADD CONSTRAINT uk_user_licenses_email_hardware 
UNIQUE (email, hardware_id);

-- 3. Додавання Foreign Key між plugins та user_licenses
-- Це забезпечує, що плагін завжди пов'язаний з валідною активацією ліцензії
ALTER TABLE plugins 
ADD CONSTRAINT fk_plugins_user_license 
FOREIGN KEY (user_id, computer_name) REFERENCES user_licenses(email, hardware_id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Створення функції для автоматичного оновлення activation_count
CREATE OR REPLACE FUNCTION update_activation_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Збільшуємо лічильник активацій при створенні нової активації
    UPDATE licenses 
    SET activation_count = activation_count + 1,
        updated_at = NOW()
    WHERE license_key = NEW.license_key;
    
    -- Логування для діагностики
    RAISE NOTICE 'Activation count increased for license: %', NEW.license_key;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Зменшуємо лічильник активацій при видаленні активації
    UPDATE licenses 
    SET activation_count = GREATEST(activation_count - 1, 0),
        updated_at = NOW()
    WHERE license_key = OLD.license_key;
    
    -- Логування для діагностики
    RAISE NOTICE 'Activation count decreased for license: %', OLD.license_key;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Обробляємо зміну license_key (рідкісний випадок)
    IF OLD.license_key != NEW.license_key THEN
      -- Зменшуємо для старої ліцензії
      UPDATE licenses 
      SET activation_count = GREATEST(activation_count - 1, 0),
          updated_at = NOW()
      WHERE license_key = OLD.license_key;
      
      -- Збільшуємо для нової ліцензії
      UPDATE licenses 
      SET activation_count = activation_count + 1,
          updated_at = NOW()
      WHERE license_key = NEW.license_key;
      
      RAISE NOTICE 'License key changed from % to %', OLD.license_key, NEW.license_key;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 5. Створення тригера для автоматичного оновлення activation_count
DROP TRIGGER IF EXISTS trigger_update_activation_count ON user_licenses;
CREATE TRIGGER trigger_update_activation_count
  AFTER INSERT OR DELETE OR UPDATE ON user_licenses
  FOR EACH ROW EXECUTE FUNCTION update_activation_count();

-- 6. Створення функції для валідації максимальної кількості активацій
CREATE OR REPLACE FUNCTION validate_max_activations()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Отримуємо поточну кількість активацій та максимально дозволену
  SELECT activation_count, max_activations 
  INTO current_count, max_allowed
  FROM licenses 
  WHERE license_key = NEW.license_key;
  
  -- Перевіряємо чи не перевищено ліміт
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'License % has reached maximum activations (%/%)', 
      NEW.license_key, current_count, max_allowed;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Створення тригера для валідації максимальної кількості активацій
DROP TRIGGER IF EXISTS trigger_validate_max_activations ON user_licenses;
CREATE TRIGGER trigger_validate_max_activations
  BEFORE INSERT ON user_licenses
  FOR EACH ROW EXECUTE FUNCTION validate_max_activations();

-- 8. Створення функції для автоматичного оновлення last_heartbeat в user_licenses
CREATE OR REPLACE FUNCTION update_user_license_heartbeat()
RETURNS TRIGGER AS $$
BEGIN
  -- Оновлюємо last_heartbeat в user_licenses при оновленні plugins
  UPDATE user_licenses 
  SET last_heartbeat = NEW.last_heartbeat,
      updated_at = NOW()
  WHERE email = NEW.user_id 
    AND hardware_id = NEW.computer_name;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Створення тригера для синхронізації heartbeat
DROP TRIGGER IF EXISTS trigger_sync_heartbeat ON plugins;
CREATE TRIGGER trigger_sync_heartbeat
  AFTER UPDATE OF last_heartbeat ON plugins
  FOR EACH ROW EXECUTE FUNCTION update_user_license_heartbeat();

-- 10. Додавання індексів для покращення продуктивності FK
CREATE INDEX IF NOT EXISTS idx_user_licenses_license_key_fk ON user_licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_plugins_user_computer_fk ON plugins(user_id, computer_name);

-- 11. Створення view для зручного отримання повної інформації про ліцензії
CREATE OR REPLACE VIEW license_details AS
SELECT 
  l.id as license_id,
  l.license_key,
  l.license_type,
  l.days_valid,
  l.is_active as license_active,
  l.activation_count,
  l.max_activations,
  l.features,
  l.created_at as license_created,
  l.updated_at as license_updated,
  ul.id as user_license_id,
  ul.email,
  ul.hardware_id,
  ul.activated_at,
  ul.last_heartbeat,
  ul.is_active as user_license_active,
  ul.created_at as user_license_created,
  p.id as plugin_id,
  p.plugin_name,
  p.version,
  p.last_heartbeat as plugin_last_heartbeat,
  p.is_active as plugin_active,
  p.is_blocked
FROM licenses l
LEFT JOIN user_licenses ul ON l.license_key = ul.license_key
LEFT JOIN plugins p ON ul.email = p.user_id AND ul.hardware_id = p.computer_name
ORDER BY l.license_key, ul.activated_at DESC;

-- 12. Створення функції для отримання статистики ліцензій
CREATE OR REPLACE FUNCTION get_license_stats()
RETURNS TABLE (
  total_licenses BIGINT,
  active_licenses BIGINT,
  total_activations BIGINT,
  total_users BIGINT,
  active_plugins BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM licenses) as total_licenses,
    (SELECT COUNT(*) FROM licenses WHERE is_active = true) as active_licenses,
    (SELECT COALESCE(SUM(activation_count), 0) FROM licenses) as total_activations,
    (SELECT COUNT(DISTINCT email) FROM user_licenses WHERE is_active = true) as total_users,
    (SELECT COUNT(*) FROM plugins WHERE is_active = true) as active_plugins;
END;
$$ LANGUAGE plpgsql;

-- 13. Перевірка створених зв'язків
SELECT 
  'Foreign Keys created successfully' as status,
  COUNT(*) as constraint_count
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
  AND table_name IN ('user_licenses', 'plugins');

-- 14. Перевірка тригерів
SELECT 
  'Triggers created successfully' as status,
  COUNT(*) as trigger_count
FROM information_schema.triggers 
WHERE trigger_name LIKE '%activation%' OR trigger_name LIKE '%heartbeat%';

-- 15. Фінальна перевірка
SELECT 'Migration 008 completed successfully!' as result;


