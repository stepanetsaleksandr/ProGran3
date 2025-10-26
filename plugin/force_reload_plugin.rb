# force_reload_plugin.rb
# Скрипт для примусового перезавантаження плагіна ProGran3

puts "🔄 Примусове перезавантаження плагіна ProGran3..."

# Видаляємо глобальні змінні
$progran3_tracker = nil
$tracker = nil
$plugin_blocked = false  # Скидаємо блокування

# Видаляємо модуль ProGran3
if defined?(ProGran3)
  Object.send(:remove_const, :ProGran3)
  puts "✅ Модуль ProGran3 видалено з пам'яті"
end

# Очищаємо ресурси
if defined?(ProGran3::ResourceManager)
  ProGran3::ResourceManager.cleanup_resources(true)
  puts "✅ Ресурси очищено"
end

# Перезавантажуємо плагін
begin
  load File.join(File.dirname(__FILE__), 'proGran3.rb')
  puts "✅ Плагін ProGran3 перезавантажено"
  
  # Примусово оновлюємо конфігурацію NetworkClient
  if defined?(ProGran3::System::Network::NetworkClient)
    ProGran3::System::Network::NetworkClient.reload_config!
    puts "✅ Конфігурація NetworkClient оновлена"
  end
  
rescue => e
  puts "❌ Помилка перезавантаження: #{e.message}"
  puts "   Деталі: #{e.backtrace.first(3).join("\n   ")}"
end

puts "🎯 Перезавантаження завершено. Спробуйте запустити плагін знову."