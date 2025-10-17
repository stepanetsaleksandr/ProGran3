# TEST_STEP_2.rb
# Тестовий скрипт для License Storage
# 
# ЯК ЗАПУСТИТИ:
# 1. Відкрийте SketchUp
# 2. Window → Ruby Console
# 3. Скопіюйте код нижче і вставте в консоль

puts "\n" + "="*70
puts "🧪 ТЕСТ КРОКУ 2: License Storage"
puts "="*70

# Завантажуємо модулі
begin
  base_path = 'C:/Users/ProVis3D/Desktop/ProGran3/plugin/proGran3/security'
  load File.join(base_path, 'hardware_fingerprint.rb')
  load File.join(base_path, 'license_storage.rb')
  puts "✅ Модулі завантажено успішно"
rescue => e
  puts "❌ Помилка завантаження модулів: #{e.message}"
  puts e.backtrace.first(5)
end

# Підготовка тестових даних
test_license = {
  license_key: 'TEST-ABCD-1234-EFGH-5678',
  email: 'test@progran3.com',
  fingerprint: ProGran3::Security::HardwareFingerprint.generate[:fingerprint],
  status: 'active',
  activated_at: Time.now.iso8601,
  expires_at: (Time.now + 30*24*60*60).iso8601,
  duration_days: 30
}

puts "\n📋 Тестові дані підготовлено:"
puts "   License Key: #{test_license[:license_key]}"
puts "   Email: #{test_license[:email]}"
puts "   Fingerprint: #{test_license[:fingerprint][0..16]}..."

# Тест 1: Перевірка що файл не існує (чистий старт)
puts "\n📝 ТЕСТ 1: Початковий стан..."
begin
  ProGran3::Security::LicenseStorage.delete if ProGran3::Security::LicenseStorage.exists?
  
  exists = ProGran3::Security::LicenseStorage.exists?
  if !exists
    puts "   ✅ PASSED: Файл ліцензії не існує (чистий старт)"
  else
    puts "   ⚠️ WARNING: Файл ліцензії вже існує"
  end
rescue => e
  puts "   ❌ FAILED: #{e.message}"
end

# Тест 2: Збереження ліцензії
puts "\n📝 ТЕСТ 2: Збереження ліцензії..."
begin
  saved = ProGran3::Security::LicenseStorage.save(test_license)
  
  if saved
    puts "   ✅ PASSED: Ліцензію збережено"
  else
    puts "   ❌ FAILED: Не вдалося зберегти ліцензію"
  end
rescue => e
  puts "   ❌ FAILED: #{e.message}"
end

# Тест 3: Перевірка що файл створено
puts "\n📝 ТЕСТ 3: Перевірка існування файлу..."
begin
  exists = ProGran3::Security::LicenseStorage.exists?
  
  if exists
    puts "   ✅ PASSED: Файл ліцензії існує"
    
    info = ProGran3::Security::LicenseStorage.file_info
    puts "      📁 Шлях: #{info[:path]}"
    puts "      📊 Розмір: #{info[:size]} bytes"
    puts "      🕐 Змінено: #{info[:modified_at]}"
  else
    puts "   ❌ FAILED: Файл не створено"
  end
rescue => e
  puts "   ❌ FAILED: #{e.message}"
end

# Тест 4: Завантаження ліцензії
puts "\n📝 ТЕСТ 4: Завантаження ліцензії..."
begin
  loaded = ProGran3::Security::LicenseStorage.load
  
  if loaded
    puts "   ✅ PASSED: Ліцензію завантажено"
    puts "      License Key: #{loaded[:license_key]}"
    puts "      Email: #{loaded[:email]}"
    puts "      Status: #{loaded[:status]}"
    puts "      Fingerprint: #{loaded[:fingerprint][0..16]}..."
  else
    puts "   ❌ FAILED: Не вдалося завантажити ліцензію"
  end
rescue => e
  puts "   ❌ FAILED: #{e.message}"
end

# Тест 5: Перевірка цілісності даних
puts "\n📝 ТЕСТ 5: Перевірка цілісності даних..."
begin
  if loaded[:license_key] == test_license[:license_key] &&
     loaded[:email] == test_license[:email] &&
     loaded[:fingerprint] == test_license[:fingerprint]
    puts "   ✅ PASSED: Всі дані збережено правильно"
  else
    puts "   ❌ FAILED: Дані не збігаються"
    puts "      Очікувалось: #{test_license[:license_key]}"
    puts "      Отримано: #{loaded[:license_key]}"
  end
rescue => e
  puts "   ❌ FAILED: #{e.message}"
end

# Тест 6: Перевірка шифрування (файл має бути нечитабельним)
puts "\n📝 ТЕСТ 6: Перевірка шифрування..."
begin
  file_path = ProGran3::Security::LicenseStorage.const_get(:LICENSE_FILE)
  raw_content = File.read(file_path)
  
  # Перевіряємо що в файлі немає відкритого тексту
  if !raw_content.include?(test_license[:license_key]) &&
     !raw_content.include?(test_license[:email])
    puts "   ✅ PASSED: Дані зашифровано (не видно в файлі)"
  else
    puts "   ❌ FAILED: Дані НЕ зашифровано (видно відкритий текст)"
  end
rescue => e
  puts "   ❌ FAILED: #{e.message}"
end

# Тест 7: Оновлення ліцензії
puts "\n📝 ТЕСТ 7: Оновлення ліцензії..."
begin
  updated_license = loaded.merge({
    status: 'renewed',
    updated_at: Time.now.iso8601
  })
  
  saved = ProGran3::Security::LicenseStorage.save(updated_license)
  reloaded = ProGran3::Security::LicenseStorage.load
  
  if reloaded[:status] == 'renewed'
    puts "   ✅ PASSED: Ліцензію оновлено"
  else
    puts "   ❌ FAILED: Оновлення не збережено"
  end
rescue => e
  puts "   ❌ FAILED: #{e.message}"
end

# Тест 8: Видалення ліцензії
puts "\n📝 ТЕСТ 8: Видалення ліцензії..."
begin
  deleted = ProGran3::Security::LicenseStorage.delete
  exists_after = ProGran3::Security::LicenseStorage.exists?
  
  if deleted && !exists_after
    puts "   ✅ PASSED: Ліцензію видалено"
  else
    puts "   ❌ FAILED: Не вдалося видалити ліцензію"
  end
rescue => e
  puts "   ❌ FAILED: #{e.message}"
end

# Тест 9: Завантаження після видалення (має повернути nil)
puts "\n📝 ТЕСТ 9: Завантаження після видалення..."
begin
  loaded_after_delete = ProGran3::Security::LicenseStorage.load
  
  if loaded_after_delete.nil?
    puts "   ✅ PASSED: Правильно повертає nil"
  else
    puts "   ❌ FAILED: Не повертає nil після видалення"
  end
rescue => e
  puts "   ❌ FAILED: #{e.message}"
end

# Підсумок
puts "\n" + "="*70
puts "📊 ПІДСУМОК ТЕСТІВ - КРОК 2"
puts "="*70

puts "\n✅ Що працює:"
puts "   • Збереження ліцензії на диск"
puts "   • Шифрування AES-256 (прив'язане до ПК)"
puts "   • Завантаження та розшифрування"
puts "   • Оновлення ліцензії"
puts "   • Видалення ліцензії"

puts "\n🔐 Безпека:"
puts "   • Ліцензія зашифрована (неможливо прочитати файл)"
puts "   • Ключ базується на fingerprint (не працює на іншому ПК)"
puts "   • Файл прихований (~/.progran3/license.enc)"

puts "\n✅ Якщо всі тести PASSED - КРОК 2 завершено!"
puts "   Можна рухатись до Кроку 3: API Client"

puts "="*70 + "\n"


