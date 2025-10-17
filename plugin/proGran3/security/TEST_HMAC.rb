# plugin/proGran3/security/TEST_HMAC.rb
# Тест HMAC підписів

puts "=" * 80
puts "🧪 ТЕСТ: HMAC SIGNATURES"
puts "=" * 80
puts ""

# Завантажуємо модуль
begin
  require_relative 'api_client'
  require_relative 'hardware_fingerprint'
rescue LoadError => e
  puts "❌ Помилка завантаження модулів: #{e.message}"
  exit
end

# Перевірка чи HMAC налаштовано
puts "📋 Перевірка конфігурації..."
puts ""

hmac_enabled = !ProGran3::Security::ApiClient::SECRET_KEY.nil? && 
               !ProGran3::Security::ApiClient::SECRET_KEY.empty?

if hmac_enabled
  puts "✅ HMAC налаштовано в plugin"
  puts "   SECRET_KEY: #{ProGran3::Security::ApiClient::SECRET_KEY[0..16]}..."
  puts ""
else
  puts "⚠️ HMAC НЕ налаштовано в plugin"
  puts ""
  puts "   SECRET_KEY = nil або порожній"
  puts ""
  puts "   Щоб увімкнути HMAC:"
  puts "   1. Відкрийте: plugin/proGran3/security/api_client.rb"
  puts "   2. Знайдіть рядок 23: SECRET_KEY = nil"
  puts "   3. Замініть на: SECRET_KEY = 'ваш-64-char-ключ'"
  puts "   4. Той самий ключ має бути в Vercel env vars"
  puts ""
  puts "   Детальні інструкції:"
  puts "   docs/development/HMAC_RATELIMIT_SETUP.md"
  puts ""
  puts "=" * 80
  puts "⚠️ Тест пропущено (HMAC не налаштовано)"
  puts ""
  exit
end

# Отримуємо fingerprint
fp_data = ProGran3::Security::HardwareFingerprint.generate
fingerprint = fp_data[:fingerprint]

# Тестові дані
TEST_EMAIL = "hmac-test@progran3.com"
TEST_KEY = "PROGRAN3-2025-TEST-HMAC"

puts "🔐 ТЕСТ 1: Запит з правильним HMAC підписом"
puts "-" * 80

result = ProGran3::Security::ApiClient.activate(TEST_EMAIL, TEST_KEY, fingerprint)

if result[:success]
  puts "✅ Request з HMAC підписом: УСПІШНО"
  puts "   Сервер прийняв запит з підписом"
elsif result[:error] && result[:error].include?('Invalid or already activated')
  puts "✅ Request з HMAC підписом: УСПІШНО"
  puts "   (ключ вже активований - це нормально)"
elsif result[:error] && result[:error].include?('Invalid HMAC signature')
  puts "❌ ПОМИЛКА: Підпис відхилено сервером"
  puts "   Можливі причини:"
  puts "   1. SECRET_KEY в plugin != SECRET_KEY в Vercel"
  puts "   2. HMAC_SECRET_KEY не додано в Vercel env vars"
  puts "   3. Vercel не redeploy після додавання env vars"
else
  puts "⚠️ Request завершився з помилкою: #{result[:error]}"
end

puts ""
puts "=" * 80
puts ""

# Тест 2: Перевірка що сервер вимагає HMAC (якщо налаштовано)
puts "🔐 ТЕСТ 2: Перевірка серверної верифікації"
puts "-" * 80
puts ""

puts "   Відправимо запит БЕЗ HMAC підпису..."
puts "   (тимчасово вимкнемо SECRET_KEY)"
puts ""

# Тимчасово зберігаємо оригінальний ключ
original_key = ProGran3::Security::ApiClient::SECRET_KEY

# Вимикаємо HMAC
ProGran3::Security::ApiClient.const_set(:SECRET_KEY, nil)

result_no_hmac = ProGran3::Security::ApiClient.activate(TEST_EMAIL, TEST_KEY, fingerprint)

# Відновлюємо ключ
ProGran3::Security::ApiClient.const_set(:SECRET_KEY, original_key)

if result_no_hmac[:success]
  puts "⚠️ УВАГА: Сервер прийняв запит БЕЗ HMAC підпису"
  puts ""
  puts "   Це означає:"
  puts "   - HMAC_SECRET_KEY не додано в Vercel env vars"
  puts "   - АБО Vercel не redeploy після додавання"
  puts ""
  puts "   Сервер працює в backward compatible режимі"
  puts "   (приймає запити з і без HMAC)"
elsif result_no_hmac[:error] && result_no_hmac[:error].include?('HMAC signature required')
  puts "✅ ТЕСТ ПРОЙШОВ: Сервер вимагає HMAC підпис"
  puts "   Запит без підпису відхилено (правильно!)"
else
  puts "⚠️ Результат: #{result_no_hmac[:error]}"
end

puts ""
puts "=" * 80
puts ""

# Підсумок
puts "📊 РЕЗУЛЬТАТИ ТЕСТУВАННЯ:"
puts ""

if result[:success] || (result[:error] && result[:error].include?('already activated'))
  puts "   Plugin HMAC: ✅ Працює (підписи створюються)"
else
  puts "   Plugin HMAC: ❌ Проблема"
end

if result_no_hmac[:error] && result_no_hmac[:error].include?('HMAC signature required')
  puts "   Server HMAC: ✅ Працює (підписи перевіряються)"
  puts ""
  puts "   🔒 Security: 9/10 (Maximum!)"
else
  puts "   Server HMAC: ⚠️ Не налаштовано (backward compatible mode)"
  puts ""
  puts "   Для повного захисту додайте HMAC_SECRET_KEY в Vercel:"
  puts "   docs/development/HMAC_RATELIMIT_SETUP.md"
  puts ""
  puts "   🔒 Security: 8.5/10"
end

puts ""
puts "=" * 80
puts "✅ Тест завершено"
puts ""

