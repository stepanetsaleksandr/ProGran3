# plugin/proGran3/security/TEST_RATE_LIMIT.rb
# Тест Rate Limiting функціональності

puts "=" * 80
puts "🧪 ТЕСТ: RATE LIMITING"
puts "=" * 80
puts ""

# Завантажуємо необхідні модулі
begin
  require_relative 'hardware_fingerprint'
  require_relative 'api_client'
rescue LoadError => e
  puts "❌ Помилка завантаження модулів: #{e.message}"
  puts "   Переконайтесь що ви в правильній директорії"
  exit
end

# Тестові дані
TEST_EMAIL = "ratelimit-test@progran3.com"
TEST_KEY = "PROGRAN3-2025-TEST-RATELIMIT"

# Отримуємо fingerprint
puts "📋 Підготовка..."
begin
  fp_data = ProGran3::Security::HardwareFingerprint.generate
  fingerprint = fp_data[:fingerprint]
  puts "   Fingerprint: #{fingerprint[0..16]}..."
  puts ""
rescue => e
  puts "❌ Помилка генерації fingerprint: #{e.message}"
  exit
end

# Функція для виконання activate запиту
def test_activate(email, key, fingerprint, request_num)
  result = ProGran3::Security::ApiClient.activate(email, key, fingerprint)
  
  if result[:success]
    puts "✅ Request #{request_num}: OK (activation успішна)"
    return true
  elsif result[:error] && result[:error].include?('Too many')
    puts "❌ Request #{request_num}: RATE LIMITED (#{result[:error]})"
    return false
  elsif result[:error] && result[:error].include?('Invalid or already activated')
    # Це нормально - ключ вже активований з попередніх спроб
    puts "✅ Request #{request_num}: OK (ключ вже активований - це нормально)"
    return true
  else
    puts "⚠️ Request #{request_num}: #{result[:error] || 'Unknown error'}"
    return true  # Рахуємо як успішний (не rate limited)
  end
end

puts "🔥 ТЕСТ 1: Спроба 6 запитів підряд (ліміт: 5/хв)"
puts "-" * 80
puts ""

success_count = 0
rate_limited = false

6.times do |i|
  request_num = i + 1
  
  # Виконуємо запит
  if test_activate(TEST_EMAIL, TEST_KEY, fingerprint, request_num)
    success_count += 1
  else
    rate_limited = true
    break
  end
  
  # Невелика затримка між запитами
  sleep(0.5)
end

puts ""
puts "-" * 80

if rate_limited
  puts "✅ ТЕСТ ПРОЙШОВ: Rate limiting працює!"
  puts "   Перші 5 запитів пройшли, 6-й заблоковано"
else
  puts "⚠️ УВАГА: Rate limiting не спрацював або ліміт більший"
  puts "   Всі #{success_count} запитів пройшли"
  puts ""
  puts "   Можливі причини:"
  puts "   1. Rate limiting ще не налаштовано (працює Simple mode)"
  puts "   2. Ліміт встановлено більше ніж 5 req/min"
  puts "   3. Помилка конфігурації Upstash"
end

puts ""
puts "=" * 80
puts ""

# Тест 2: Перевірка reset після 60 секунд
if rate_limited
  puts "🔄 ТЕСТ 2: Перевірка reset після 60 секунд"
  puts "-" * 80
  puts ""
  puts "⏱️ Зачекайте 60 секунд для reset лічильника..."
  puts "   (можна перервати Ctrl+C якщо не хочете чекати)"
  puts ""
  
  60.times do |i|
    remaining = 60 - i
    print "\r   Залишилось: #{remaining} сек..."
    sleep(1)
  end
  
  puts "\r   Залишилось: 0 сек...  "
  puts ""
  puts "🔄 Пробуємо ще раз після reset..."
  
  if test_activate(TEST_EMAIL, TEST_KEY, fingerprint, "після reset")
    puts ""
    puts "✅ ТЕСТ ПРОЙШОВ: Після 60 сек rate limit скинувся!"
  else
    puts ""
    puts "❌ ТЕСТ НЕ ПРОЙШОВ: Все ще заблоковано"
  end
  
  puts ""
  puts "=" * 80
end

puts ""
puts "📊 РЕЗУЛЬТАТИ ТЕСТУВАННЯ:"
puts ""
puts "   Rate Limiting: #{rate_limited ? '✅ Працює' : '⚠️ Не налаштовано або ліміт > 5'}"
puts ""
puts "   Для налаштування Upstash див:"
puts "   docs/development/HMAC_RATELIMIT_SETUP.md"
puts ""
puts "=" * 80
puts "✅ Тест завершено"
puts ""

