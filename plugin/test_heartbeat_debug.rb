# Тестовий файл для діагностики проблем з автоматичними heartbeat
require_relative 'progran3'

puts "🧪 Діагностика автоматичних heartbeat..."
puts "=" * 60

# Перевіряємо початковий статус
puts "📊 Початковий статус:"
ProGran3.tracking_status

puts "\n📱 Відкриваємо UI для запуску відстеження..."
ProGran3::UI.show_dialog

puts "\n⏳ Чекаємо 3 секунди після відкриття UI..."
sleep(3)

puts "\n📊 Статус після відкриття UI:"
ProGran3.tracking_status

puts "\n🧪 Тестуємо ручний heartbeat:"
ProGran3.test_heartbeat

puts "\n⏳ Чекаємо 70 секунд для перевірки автоматичних heartbeat..."
puts "   Час початку: #{Time.now.strftime('%H:%M:%S')}"
puts "   Очікуємо:"
puts "   1. Перший автоматичний heartbeat через 60 секунд"
puts "   2. Логування фонового потоку"

# Чекаємо 70 секунд
sleep(70)

puts "\n📊 Фінальний статус:"
ProGran3.tracking_status

puts "\n✅ Діагностика завершена!"
puts "   Час завершення: #{Time.now.strftime('%H:%M:%S')}"

puts "\n💡 Якщо автоматичні heartbeat не працюють:"
puts "   1. Перевірте чи працює фоновый потік"
puts "   2. Перевірте чи працює SketchUp timer"
puts "   3. Використовуйте ProGran3.test_heartbeat для ручного тестування"
