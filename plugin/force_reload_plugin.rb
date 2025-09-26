# Примусове перезавантаження плагіна ProGran3
# Виконати в Ruby Console SketchUp

puts "🔄 Примусове перезавантаження плагіна ProGran3..."

# Очищаємо всі завантажені файли
$LOADED_FEATURES.delete_if { |file| file.include?('progran3') }

# Видаляємо глобальні змінні
$plugin_blocked = nil
$license_manager = nil
$progran3_tracker = nil
$tracker = nil

# Видаляємо модуль
Object.send(:remove_const, :ProGran3) if defined?(ProGran3)

# Перезавантажуємо основний файл
load 'progran3.rb'

puts "✅ Плагін примусово перезавантажено"
puts "🔐 LicenseManager: #{$license_manager ? 'завантажено' : 'НЕ завантажено'}"
puts "📊 Tracker: #{$progran3_tracker ? 'завантажено' : 'НЕ завантажено'}"
puts "🚫 Plugin blocked: #{$plugin_blocked}"

# Перевіряємо чи є LicenseManager
if $license_manager
  puts "✅ LicenseManager доступний"
  puts "🔐 Has license: #{$license_manager.has_license?}"
  puts "📧 Email: #{$license_manager.email || 'немає'}"
  puts "🔑 License key: #{$license_manager.license_key ? $license_manager.license_key[0..8] + '...' : 'немає'}"
else
  puts "❌ LicenseManager НЕ завантажено!"
end
