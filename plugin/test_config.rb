# test_config.rb
# Тестування системи конфігурації ProGran3

require_relative 'progran3.rb'

puts "🧪 Тестування системи конфігурації ProGran3"
puts "=" * 50

# Тест 1: Отримання поточного URL
puts "\n1. Поточний URL сервера:"
current_url = ProGran3.get_server_url
puts "   #{current_url}"

# Тест 2: Тестування підключення
puts "\n2. Тестування підключення до сервера:"
connection_test = ProGran3.test_server_connection
if connection_test[:success]
  puts "   ✅ Сервер доступний (#{connection_test[:status]})"
else
  puts "   ❌ Сервер недоступний: #{connection_test[:error] || connection_test[:status]}"
end

# Тест 3: Отримання всіх налаштувань
puts "\n3. Всі налаштування конфігурації:"
config = ProGran3.get_config
config.each do |key, value|
  puts "   #{key}: #{value}"
end

# Тест 4: Оновлення URL (тестовий)
puts "\n4. Тестування оновлення URL:"
test_url = "https://httpbin.org/post"
puts "   Встановлюємо тестовий URL: #{test_url}"
if ProGran3.set_server_url(test_url)
  puts "   ✅ URL оновлено"
  
  # Перевіряємо новий URL
  new_url = ProGran3.get_server_url
  puts "   Новий URL: #{new_url}"
  
  # Тестуємо підключення до нового URL
  puts "   Тестуємо підключення до нового URL:"
  new_connection_test = ProGran3.test_server_connection
  if new_connection_test[:success]
    puts "   ✅ Новий сервер доступний"
  else
    puts "   ❌ Новий сервер недоступний: #{new_connection_test[:error]}"
  end
  
  # Повертаємо оригінальний URL
  puts "   Повертаємо оригінальний URL..."
  ProGran3.set_server_url("https://progran3-tracking-server-1rp48ns42-provis3ds-projects.vercel.app")
  puts "   ✅ Оригінальний URL відновлено"
else
  puts "   ❌ Не вдалося оновити URL"
end

# Тест 5: Оновлення налаштувань
puts "\n5. Тестування оновлення налаштувань:"
new_settings = {
  'debug_mode' => true,
  'heartbeat_interval' => 1800
}
if ProGran3.update_config(new_settings)
  puts "   ✅ Налаштування оновлено"
  
  # Перевіряємо оновлені налаштування
  updated_config = ProGran3.get_config
  puts "   Debug mode: #{updated_config['debug_mode']}"
  puts "   Heartbeat interval: #{updated_config['heartbeat_interval']}"
  
  # Повертаємо оригінальні налаштування
  ProGran3.update_config({
    'debug_mode' => false,
    'heartbeat_interval' => 3600
  })
  puts "   ✅ Оригінальні налаштування відновлено"
else
  puts "   ❌ Не вдалося оновити налаштування"
end

puts "\n" + "=" * 50
puts "🎉 Тестування завершено!"
puts "\nКорисні команди для консолі Ruby в SketchUp:"
puts "  ProGran3.get_server_url                    # Отримати поточний URL"
puts "  ProGran3.set_server_url('новый_url')      # Встановити новий URL"
puts "  ProGran3.test_server_connection            # Тестувати підключення"
puts "  ProGran3.get_config                        # Отримати всі налаштування"
puts "  ProGran3.update_config({key: value})      # Оновити налаштування"
