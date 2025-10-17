# TEST_STEP_1.rb
# Тестовий скрипт для Hardware Fingerprint
# 
# ЯК ЗАПУСТИТИ:
# 1. Відкрийте SketchUp
# 2. Window → Ruby Console
# 3. Скопіюйте і вставте цей код в консоль
# 4. Натисніть Enter

puts "\n" + "="*70
puts "🧪 ТЕСТ КРОКУ 1: Hardware Fingerprint"
puts "="*70

# Завантажуємо модуль
begin
  load File.join(File.dirname(__FILE__), 'hardware_fingerprint.rb')
  puts "✅ Модуль завантажено успішно"
rescue => e
  puts "❌ Помилка завантаження модуля: #{e.message}"
  puts e.backtrace.first(5)
  exit
end

# Тест 1: Генерація fingerprint
puts "\n📝 ТЕСТ 1: Генерація fingerprint..."
begin
  fp1 = ProGran3::Security::HardwareFingerprint.generate
  
  if fp1 && fp1[:fingerprint] && fp1[:fingerprint].length == 64
    puts "   ✅ PASSED: Fingerprint згенеровано (#{fp1[:fingerprint][0..16]}...)"
  else
    puts "   ❌ FAILED: Неправильний формат fingerprint"
  end
rescue => e
  puts "   ❌ FAILED: #{e.message}"
end

# Тест 2: Компоненти
puts "\n📝 ТЕСТ 2: Збір компонентів..."
begin
  components = fp1[:components]
  required_keys = [:motherboard, :cpu, :mac, :disk, :hostname, :platform]
  
  missing = required_keys - components.keys
  
  if missing.empty?
    puts "   ✅ PASSED: Всі компоненти зібрано"
    components.each do |key, value|
      puts "      #{key.to_s.ljust(15)}: #{value}"
    end
  else
    puts "   ❌ FAILED: Відсутні компоненти: #{missing.join(', ')}"
  end
rescue => e
  puts "   ❌ FAILED: #{e.message}"
end

# Тест 3: Консистентність (генерація двічі дає той самий результат)
puts "\n📝 ТЕСТ 3: Консистентність..."
begin
  fp2 = ProGran3::Security::HardwareFingerprint.generate
  
  if fp1[:fingerprint] == fp2[:fingerprint]
    puts "   ✅ PASSED: Fingerprint консистентний"
  else
    puts "   ❌ FAILED: Fingerprint змінюється при кожній генерації"
    puts "      FP1: #{fp1[:fingerprint]}"
    puts "      FP2: #{fp2[:fingerprint]}"
  end
rescue => e
  puts "   ❌ FAILED: #{e.message}"
end

# Тест 4: Метод matches?
puts "\n📝 ТЕСТ 4: Перевірка співпадіння..."
begin
  matches = ProGran3::Security::HardwareFingerprint.matches?(fp1[:fingerprint])
  
  if matches
    puts "   ✅ PASSED: Fingerprint збігається"
  else
    puts "   ❌ FAILED: Fingerprint не збігається з поточною системою"
  end
  
  # Негативний тест
  fake_fp = "0000000000000000000000000000000000000000000000000000000000000000"
  matches_fake = ProGran3::Security::HardwareFingerprint.matches?(fake_fp)
  
  if !matches_fake
    puts "   ✅ PASSED: Фейковий fingerprint правильно відхилено"
  else
    puts "   ❌ FAILED: Фейковий fingerprint помилково прийнято"
  end
rescue => e
  puts "   ❌ FAILED: #{e.message}"
end

# Тест 5: Debug info
puts "\n📝 ТЕСТ 5: Debug інформація..."
begin
  debug_data = ProGran3::Security::HardwareFingerprint.debug_info
  
  if debug_data && debug_data[:fingerprint]
    puts "   ✅ PASSED: Debug info працює"
  else
    puts "   ❌ FAILED: Debug info не працює"
  end
rescue => e
  puts "   ❌ FAILED: #{e.message}"
end

# Підсумок
puts "\n" + "="*70
puts "📊 ПІДСУМОК ТЕСТІВ"
puts "="*70

puts "\n🎯 ВАШ FINGERPRINT:"
puts "   #{fp1[:fingerprint]}"

puts "\n💾 Збережіть цей fingerprint - він унікальний для вашого ПК!"

puts "\n✅ Якщо всі тести PASSED - КРОК 1 завершено успішно!"
puts "   Можна рухатись до Кроку 2: License Storage"

puts "\n❓ Якщо є FAILED тести - повідомте про помилки"

puts "="*70 + "\n"

# Повертаємо fingerprint для подальшого використання
fp1


