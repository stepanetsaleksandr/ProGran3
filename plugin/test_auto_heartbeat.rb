# Тестовий файл для перевірки автоматичного heartbeat
require_relative 'progran3'

puts "🧪 Тестування автоматичного heartbeat..."
puts "=" * 60

# Перевіряємо статус відстеження
puts "📊 Перевірка початкового статусу:"
ProGran3.tracking_status

puts "\n⏳ Чекаємо 70 секунд для перевірки автоматичного heartbeat..."
puts "   (перший heartbeat відправляється одразу, наступний через 60 секунд)"
puts "   Час початку: #{Time.now.strftime('%H:%M:%S')}"

# Чекаємо 70 секунд
sleep(70)

puts "\n📊 Перевірка статусу після очікування:"
ProGran3.tracking_status

puts "\n✅ Тест завершено!"
puts "   Час завершення: #{Time.now.strftime('%H:%M:%S')}"
puts "   Очікуйте автоматичний heartbeat кожні 60 секунд..."
