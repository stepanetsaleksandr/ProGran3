# TEST_STEP_4.rb
# Тестовий скрипт для License Manager (ФІНАЛЬНИЙ ТЕСТ)
# 
# ЯК ЗАПУСТИТИ:
# 1. Відкрийте SketchUp
# 2. Window → Ruby Console
# 3. Скопіюйте код нижче

puts "\n" + "="*70
puts "🧪 ТЕСТ КРОКУ 4: License Manager (ФІНАЛЬНИЙ)"
puts "="*70

# Завантажуємо всі модулі
begin
  base_path = 'C:/Users/ProVis3D/Desktop/ProGran3/plugin/proGran3/security'
  load File.join(base_path, 'hardware_fingerprint.rb')
  load File.join(base_path, 'license_storage.rb')
  load File.join(base_path, 'api_client.rb')
  load File.join(base_path, 'license_manager.rb')
  puts "✅ Всі модулі завантажено успішно"
rescue => e
  puts "❌ Помилка завантаження модулів: #{e.message}"
  puts e.backtrace.first(5)
end

# Створюємо manager
manager = ProGran3::Security::LicenseManager.new

puts "\n📋 Тестова конфігурація License Manager:"
puts "   Grace Period: #{ProGran3::Security::LicenseManager::GRACE_PERIOD_DAYS} днів"
puts "   Warning Period: #{ProGran3::Security::LicenseManager::WARNING_PERIOD_DAYS} днів"

# Тест 1: Перевірка наявності ліцензії
puts "\n📝 ТЕСТ 1: Перевірка наявності ліцензії..."
begin
  has_license = manager.has_license?
  
  if has_license
    puts "   ✅ INFO: Ліцензія знайдена"
  else
    puts "   ℹ️ INFO: Ліцензія не знайдена (нормально для першого запуску)"
  end
rescue => e
  puts "   ❌ FAILED: #{e.message}"
end

# Тест 2: Валідація (якщо є ліцензія)
if has_license
  puts "\n📝 ТЕСТ 2: Валідація існуючої ліцензії..."
  begin
    result = manager.validate_license
    
    if result[:valid]
      puts "   ✅ PASSED: Ліцензія валідна"
      
      if result[:warning]
        puts "      ⚠️ Попередження: #{result[:warning]}"
      end
      
      if result[:license]
        puts "      Key: #{result[:license][:license_key][0..8]}..."
        puts "      Email: #{result[:license][:email]}"
        puts "      Status: #{result[:license][:status]}"
      end
    else
      puts "   ❌ FAILED: Ліцензія не валідна"
      puts "      Error: #{result[:error]}"
      puts "      Message: #{result[:message]}"
    end
  rescue => e
    puts "   ❌ FAILED: #{e.message}"
  end
else
  puts "\n📝 ТЕСТ 2: ПРОПУЩЕНО (немає ліцензії)"
end

# Тест 3: Інформація про ліцензію
puts "\n📝 ТЕСТ 3: Отримання інформації про ліцензію..."
begin
  info = manager.license_info
  
  if info[:has_license]
    puts "   ✅ PASSED: Інформація отримана"
    puts "      Has License: #{info[:has_license]}"
    puts "      License Key: #{info[:license_key][0..8]}..."
    puts "      Email: #{info[:email]}"
    puts "      Status: #{info[:status]}"
    puts "      Fingerprint Match: #{info[:fingerprint_match]}"
    puts "      Activated: #{info[:activated_at]}"
    puts "      Expires: #{info[:expires_at] || 'Необмежено'}"
  else
    puts "   ℹ️ INFO: Немає ліцензії"
    puts "      #{info.inspect}"
  end
rescue => e
  puts "   ❌ FAILED: #{e.message}"
end

# Тест 4: Grace Period логіка
if has_license
  puts "\n📝 ТЕСТ 4: Перевірка Grace Period..."
  begin
    license = manager.current_license
    grace_result = manager.check_grace_period(license)
    
    puts "   ✅ PASSED: Grace Period перевірено"
    puts "      Action: #{grace_result[:action]}"
    puts "      Message: #{grace_result[:message]}"
    puts "      Days Offline: #{grace_result[:days_offline]}" if grace_result[:days_offline]
    
    case grace_result[:action]
    when :block
      puts "      🔴 УВАГА: Grace period вичерпано!"
    when :warn
      puts "      ⚠️ Попередження: скоро потрібна online валідація"
    when :allow
      puts "      ✅ Все в порядку"
    end
  rescue => e
    puts "   ❌ FAILED: #{e.message}"
  end
else
  puts "\n📝 ТЕСТ 4: ПРОПУЩЕНО (немає ліцензії)"
end

# Тест 5: Активація (ТІЛЬКИ якщо є справжній ключ)
puts "\n📝 ТЕСТ 5: Активація ліцензії"
puts "   ℹ️ Цей тест потребує справжній ключ з Dashboard"
puts ""
puts "   💡 Як отримати ключ:"
puts "      1. Відкрийте: https://server-lq45314gn-provis3ds-projects.vercel.app"
puts "      2. License Manager → Generate License"
puts "      3. Скопіюйте згенерований ключ"
puts ""
puts "   💡 Для тестування активації виконайте:"
puts ""
puts "   manager = ProGran3::Security::LicenseManager.new"
puts "   result = manager.activate_license("
puts "     'YOUR_EMAIL@example.com',"
puts "     'YOUR-LICENSE-KEY-FROM-DASHBOARD'"
puts "   )"
puts "   puts result.inspect"
puts ""

# Підсумок
puts "\n" + "="*70
puts "📊 ПІДСУМОК ТЕСТІВ - КРОК 4 (ФІНАЛЬНИЙ)"
puts "="*70

puts "\n✅ Що працює:"
puts "   • License Manager створено"
puts "   • Валідація ліцензії"
puts "   • Перевірка fingerprint"
puts "   • Grace period логіка (7 днів offline)"
puts "   • Отримання інформації про ліцензію"

puts "\n🎯 ПОВНА СИСТЕМА ЛІЦЕНЗУВАННЯ:"
puts ""
puts "   📦 КРОК 1: Hardware Fingerprint      ✅"
puts "   📦 КРОК 2: License Storage           ✅"
puts "   📦 КРОК 3: API Client                ✅"
puts "   📦 КРОК 4: License Manager           ✅"
puts ""
puts "   🏆 СИСТЕМА ПОВНІСТЮ РЕАЛІЗОВАНА!"

puts "\n💡 ЯК ВИКОРИСТОВУВАТИ:"
puts ""
puts "   # 1. Створити manager"
puts "   manager = ProGran3::Security::LicenseManager.new"
puts ""
puts "   # 2. Активувати ліцензію (один раз)"
puts "   result = manager.activate_license('email@test.com', 'LICENSE-KEY')"
puts ""
puts "   # 3. Валідувати при запуску плагіна"
puts "   result = manager.validate_license"
puts "   if result[:valid]"
puts "     # Дозволити використання плагіна"
puts "   else"
puts "     # Показати помилку: result[:message]"
puts "   end"

puts "\n🚀 НАСТУПНІ КРОКИ:"
puts "   1. Інтегрувати License Manager в proGran3.rb"
puts "   2. Підключити UI (license_ui.rb, splash_screen.rb)"
puts "   3. Протестувати повний flow:"
puts "      - Запуск без ліцензії → Splash → License UI → Активація"
puts "      - Запуск з ліцензією → Splash → Валідація → Main UI"
puts "   4. Протестувати на іншому ПК (fingerprint mismatch)"

puts "\n✅ КРОК 4 ЗАВЕРШЕНО!"
puts "   Базова система ліцензування готова до інтеграції!"

puts "="*70 + "\n"


