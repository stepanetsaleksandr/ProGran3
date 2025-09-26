# Тест для діагностики ліцензійних функцій
require_relative 'proGran3.rb'

puts "🧪 Тест ліцензійних функцій ProGran3"
puts "=" * 50

# Перевіряємо LicenseManager
puts "1. Перевірка LicenseManager:"
puts "   $license_manager: #{$license_manager}"
puts "   $license_manager.class: #{$license_manager.class}"

# Перевіряємо has_license?
puts "\n2. Перевірка has_license?:"
begin
  result = ProGran3.has_license?
  puts "   has_license? = #{result}"
rescue => e
  puts "   Помилка: #{e.message}"
end

# Перевіряємо license_info
puts "\n3. Перевірка license_info:"
begin
  result = ProGran3.license_info
  puts "   license_info = #{result}"
rescue => e
  puts "   Помилка: #{e.message}"
end

# Перевіряємо стан блокування
puts "\n4. Перевірка стану блокування:"
puts "   $plugin_blocked = #{$plugin_blocked}"

# Перевіряємо LicenseManager напряму
puts "\n5. Перевірка LicenseManager напряму:"
if $license_manager
  puts "   has_license? = #{$license_manager.has_license?}"
  puts "   is_blocked? = #{$license_manager.is_blocked?}"
  puts "   email = #{$license_manager.instance_variable_get(:@email)}"
  puts "   license_key = #{$license_manager.instance_variable_get(:@license_key)}"
else
  puts "   LicenseManager не ініціалізований"
end

puts "\n" + "=" * 50
puts "✅ Тест завершено"
