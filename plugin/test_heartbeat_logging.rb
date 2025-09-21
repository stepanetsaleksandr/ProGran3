# Тестовий файл для перевірки логування heartbeat
require_relative 'progran3'

puts "🧪 Тестування логування heartbeat..."
puts "=" * 50

# Запускаємо відстеження
ProGran3.start_tracking

# Чекаємо кілька секунд
puts "⏳ Чекаємо 5 секунд для тестування..."
sleep(5)

# Відправляємо тестовий heartbeat
puts "📡 Відправка тестового heartbeat..."
ProGran3.send_heartbeat

# Чекаємо ще трохи
puts "⏳ Чекаємо ще 3 секунди..."
sleep(3)

# Зупиняємо відстеження
puts "🛑 Зупинка відстеження..."
ProGran3.stop_tracking

puts "✅ Тест завершено!"
