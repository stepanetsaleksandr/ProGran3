-- Вставка тестової ліцензії вручну
INSERT INTO licenses (license_key, license_type, days_valid, is_active, activation_count, max_activations, features) VALUES
(
  'TEST-1234-5678-9ABC',
  'trial',
  30, -- 30 днів дії з моменту активації
  true,
  0,
  1,
  '{"trial": true, "max_offline_hours": 24, "features": ["basic_gravestones", "basic_flowerbeds"]}'::jsonb
) ON CONFLICT (license_key) DO UPDATE SET
  days_valid = EXCLUDED.days_valid,
  is_active = EXCLUDED.is_active,
  max_activations = EXCLUDED.max_activations,
  updated_at = NOW();

-- Перевірка створеної ліцензії
SELECT * FROM licenses WHERE license_key = 'TEST-1234-5678-9ABC';
