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

# Перезавантажуємо основний файл (спочатку пробуємо core, потім основний)
begin
  load 'proGran3_core.rb'
rescue LoadError
  load 'proGran3.rb'
end

puts "✅ Плагін примусово перезавантажено"

# Перевіряємо чи є ProGran3 модуль
if defined?(ProGran3)
  puts "✅ ProGran3 модуль завантажено"
  
  # Перевіряємо SessionManager (новий LicenseManager)
  if defined?(ProGran3::System::Core::SessionManager)
    puts "✅ SessionManager доступний"
    begin
      manager = ProGran3::System::Core::SessionManager.new
      puts "🔐 Has license: #{manager.has_license?}"
      puts "📧 Email: #{manager.email || 'немає'}"
      puts "🔑 License key: #{manager.license_key ? manager.license_key[0..8] + '...' : 'немає'}"
    rescue => e
      puts "❌ Помилка доступу до SessionManager: #{e.message}"
    end
  else
    puts "❌ SessionManager НЕ завантажено!"
  end
else
  puts "❌ ProGran3 модуль НЕ завантажено!"
end
