-- SQL функції для прямого доступу до статистики ліцензій
-- Виконати в Supabase SQL Editor

-- Функція для отримання статистики ліцензій
CREATE OR REPLACE FUNCTION get_license_stats()
RETURNS TABLE (
  total_count BIGINT,
  generated_count BIGINT,
  activated_count BIGINT,
  active_count BIGINT,
  expired_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status = 'generated') as generated_count,
    COUNT(*) FILTER (WHERE status = 'activated') as activated_count,
    COUNT(*) FILTER (WHERE status = 'active') as active_count,
    COUNT(*) FILTER (WHERE status = 'expired') as expired_count
  FROM licenses;
END;
$$;

-- Функція для отримання всіх ліцензій
CREATE OR REPLACE FUNCTION get_all_licenses()
RETURNS TABLE (
  id UUID,
  license_key TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  duration_days INTEGER,
  description TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.license_key,
    l.status,
    l.created_at,
    l.updated_at,
    l.duration_days,
    l.description
  FROM licenses l
  ORDER BY l.created_at DESC;
END;
$$;

-- Функція для очищення всіх ліцензій (для тестування)
CREATE OR REPLACE FUNCTION clear_all_licenses()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM licenses;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Перевірка поточної структури таблиці
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'licenses' 
ORDER BY ordinal_position;

-- Перевірка поточних даних
SELECT 
  'Current data check' as info,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE status = 'generated') as generated,
  COUNT(*) FILTER (WHERE status = 'activated') as activated,
  COUNT(*) FILTER (WHERE status = 'active') as active,
  COUNT(*) FILTER (WHERE status = 'expired') as expired
FROM licenses;
