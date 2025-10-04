-- ===========================================
-- CHECK LICENSE DATA - ПЕРЕВІРКА ДАНИХ ЛІЦЕНЗІЙ
-- Виконайте цей скрипт в Supabase SQL Editor
-- ===========================================

-- Крок 1: Перевірка всіх ліцензій
SELECT '=== ВСІ ЛІЦЕНЗІЇ ===' as info;

SELECT 
  id,
  license_key,
  duration_days,
  description,
  status,
  created_at,
  activated_at,
  expires_at,
  updated_at,
  user_id
FROM licenses
ORDER BY created_at DESC;

-- Крок 2: Статистика по статусах
SELECT '=== СТАТИСТИКА ПО СТАТУСАХ ===' as info;

SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM licenses
GROUP BY status
ORDER BY count DESC;

-- Крок 3: Перевірка дублікатів
SELECT '=== ПЕРЕВІРКА ДУБЛІКАТІВ ===' as info;

SELECT 
  license_key,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as ids
FROM licenses
GROUP BY license_key
HAVING COUNT(*) > 1;

-- Крок 4: Перевірка дат
SELECT '=== ПЕРЕВІРКА ДАТ ===' as info;

SELECT 
  license_key,
  created_at,
  activated_at,
  expires_at,
  CASE 
    WHEN created_at > NOW() THEN '❌ Створена в майбутньому'
    WHEN activated_at IS NOT NULL AND activated_at > NOW() THEN '❌ Активована в майбутньому'
    WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN '⚠️ Прострочена'
    ELSE '✅ Дати коректні'
  END as date_status
FROM licenses
ORDER BY created_at DESC;

-- Крок 5: Детальна інформація про кожну ліцензію
SELECT '=== ДЕТАЛЬНА ІНФОРМАЦІЯ ===' as info;

SELECT 
  'ID: ' || id as license_info,
  'Ключ: ' || license_key as key_info,
  'Статус: ' || status as status_info,
  'Створена: ' || created_at::text as created_info,
  'Активована: ' || COALESCE(activated_at::text, 'Не активована') as activated_info,
  'Закінчується: ' || COALESCE(expires_at::text, 'Не встановлено') as expires_info
FROM licenses
ORDER BY created_at DESC;
