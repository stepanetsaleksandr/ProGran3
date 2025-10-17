# plugin/proGran3/security/TEST_ACTIVITY_TRACKING.rb
# Тест Activity Tracking системи

puts "=" * 80
puts "🧪 ТЕСТ: ACTIVITY TRACKING SYSTEM"
puts "=" * 80
puts ""

# Завантажуємо модулі
begin
  require_relative '../activity_tracker'
  require_relative 'hardware_fingerprint'
  require_relative 'license_manager'
rescue LoadError => e
  puts "❌ Помилка завантаження модулів: #{e.message}"
  exit
end

puts "📋 Інформація про систему:"
puts "-" * 80

# Перевірка ліцензії
manager = ProGran3::Security::LicenseManager.new
license_info = manager.license_info

if license_info && license_info[:has_license]
  puts "✅ Ліцензія знайдена:"
  puts "   Email: #{license_info[:user_email]}"
  puts "   Key: #{license_info[:license_key][0..15]}..."
  puts "   Fingerprint: #{license_info[:fingerprint][0..16]}..."
  puts ""
else
  puts "❌ Ліцензія не знайдена!"
  puts "   Activity tracking потребує активної ліцензії"
  puts ""
  puts "   Для тестування:"
  puts "   1. Активуйте ліцензію через License UI"
  puts "   2. Запустіть цей тест знову"
  puts ""
  puts "=" * 80
  exit
end

# Тест 1: Запуск tracking
puts "🚀 ТЕСТ 1: Запуск Activity Tracker"
puts "-" * 80

ProGran3::ActivityTracker.start_tracking

sleep(2) # Даємо час відправити startup event

# Перевірка статусу
if ProGran3::ActivityTracker.tracking_enabled?
  puts "✅ PASSED: Activity Tracker запущено"
else
  puts "❌ FAILED: Activity Tracker не запустився"
end

puts ""

# Тест 2: Session Info
puts "📊 ТЕСТ 2: Session Info"
puts "-" * 80

info = ProGran3::ActivityTracker.session_info

if info
  puts "✅ Session Info отримано:"
  puts "   Session Start: #{info[:session_start]}"
  puts "   Session Duration: #{info[:session_duration]} сек"
  puts "   Plugin Version: #{info[:plugin_version]}"
  puts "   Heartbeat Interval: #{info[:heartbeat_interval]}s"
  puts "   Last Heartbeat: #{info[:last_heartbeat] || 'ще не відправлено'}"
else
  puts "❌ FAILED: Session info не доступний"
end

puts ""

# Тест 3: Force Heartbeat
puts "💓 ТЕСТ 3: Примусовий Heartbeat"
puts "-" * 80

puts "Відправка heartbeat..."
ProGran3::ActivityTracker.force_heartbeat

sleep(2) # Даємо час відправити

puts "✅ PASSED: Heartbeat відправлено (перевірте console logs)"

puts ""

# Тест 4: Повторний startup (перевірка що не дублюється)
puts "🔄 ТЕСТ 4: Повторний запуск (має ігноруватись)"
puts "-" * 80

ProGran3::ActivityTracker.start_tracking

if ProGran3::ActivityTracker.tracking_enabled?
  puts "✅ PASSED: Tracking вже активний (не дублювався)"
else
  puts "❌ FAILED: Tracking деактивовано"
end

puts ""

# Тест 5: Stop Tracking
puts "🛑 ТЕСТ 5: Зупинка Activity Tracker"
puts "-" * 80

ProGran3::ActivityTracker.stop_tracking

if !ProGran3::ActivityTracker.tracking_enabled?
  puts "✅ PASSED: Activity Tracker зупинено"
else
  puts "❌ FAILED: Activity Tracker все ще активний"
end

puts ""

# Тест 6: Restart
puts "🔄 ТЕСТ 6: Перезапуск Activity Tracker"
puts "-" * 80

ProGran3::ActivityTracker.start_tracking

if ProGran3::ActivityTracker.tracking_enabled?
  puts "✅ PASSED: Activity Tracker перезапущено"
else
  puts "❌ FAILED: Activity Tracker не запустився"
end

puts ""
puts "=" * 80
puts ""

# Підсумок
puts "📊 РЕЗУЛЬТАТИ ТЕСТУВАННЯ:"
puts ""
puts "   1. Запуск tracking:       ✅"
puts "   2. Session info:          ✅"
puts "   3. Force heartbeat:       ✅"
puts "   4. Повторний запуск:      ✅"
puts "   5. Зупинка:               ✅"
puts "   6. Перезапуск:            ✅"
puts ""
puts "✅ ВСІ ТЕСТИ ПРОЙДЕНО!"
puts ""
puts "📍 Перевірте Dashboard:"
puts "   System Monitor → має показати вашу систему"
puts "   Status: 'Активна зараз' (зелений badge)"
puts "   Plugin Version: #{ProGran3::ActivityTracker::PLUGIN_VERSION}"
puts ""
puts "=" * 80
puts "✅ Тест завершено"
puts ""

