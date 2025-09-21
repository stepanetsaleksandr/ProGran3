# Тестовий файл для перевірки правильного heartbeat після завантаження UI
require_relative 'proGran3'

puts "🧪 Тестування heartbeat після завантаження UI..."
puts "=" * 60

# Перевіряємо початковий статус (має бути неактивний)
puts "📊 Перевірка початкового статусу (має бути неактивний):"
ProGran3.tracking_status

puts "\n📱 Відкриваємо UI для запуску heartbeat..."
ProGran3::UI.show_dialog

puts "\n⏳ Чекаємо 5 секунд після відкриття UI..."
sleep(5)

puts "\n📊 Перевірка статусу після відкриття UI (має бути активний):"
ProGran3.tracking_status

puts "\n⏳ Чекаємо 65 секунд для перевірки автоматичного heartbeat..."
puts "   (перший heartbeat відправляється при завантаженні UI, наступний через 60 секунд)"
puts "   Час початку очікування: #{Time.now.strftime('%H:%M:%S')}"

# Чекаємо 65 секунд
sleep(65)

puts "\n📊 Фінальна перевірка статусу:"
ProGran3.tracking_status

puts "\n✅ Тест завершено!"
puts "   Час завершення: #{Time.now.strftime('%H:%M:%S')}"
puts "   Очікуйте автоматичний heartbeat кожні 60 секунд..."
