# Тест активації ліцензії ProGran3
puts "🧪 Тест активації ліцензії ProGran3"
puts "=" * 50

# Перевіряємо поточний стан
puts "1. Поточний стан:"
puts "   has_license?: #{ProGran3.has_license?}"
puts "   license_info: #{ProGran3.license_info}"
puts "   plugin_blocked: #{$plugin_blocked}"

# Тестуємо активацію з неправильними даними
puts "\n2. Тест з неправильними даними:"
begin
  result = ProGran3.activate_license("WRONG-KEY-1234", "wrong@test.com")
  puts "   Результат: #{result}"
rescue => e
  puts "   Помилка: #{e.message}"
end

# Перевіряємо стан після невдалої активації
puts "\n3. Стан після невдалої активації:"
puts "   has_license?: #{ProGran3.has_license?}"
puts "   license_info: #{ProGran3.license_info}"

# Тестуємо активацію з правильними даними
puts "\n4. Тест з правильними даними:"
begin
  result = ProGran3.activate_license("TEST-1234-5678-9ABC", "test@progran3.com")
  puts "   Результат: #{result}"
rescue => e
  puts "   Помилка: #{e.message}"
end

# Перевіряємо стан після успішної активації
puts "\n5. Стан після успішної активації:"
puts "   has_license?: #{ProGran3.has_license?}"
puts "   license_info: #{ProGran3.license_info}"
puts "   plugin_blocked: #{$plugin_blocked}"

puts "\n" + "=" * 50
puts "✅ Тест активації завершено"
