# test_foundation.rb
# Тестування створення фундаменту

puts "🧪 Тестування створення фундаменту..."

# Завантажуємо плагін
load File.join(File.dirname(__FILE__), 'proGran3.rb')

# Перевіряємо, чи завантажений FoundationBuilder
if defined?(ProGran3::FoundationBuilder)
  puts "✅ FoundationBuilder завантажено"
  
  # Тестуємо створення фундаменту
  begin
    puts "🔨 Створюємо фундамент..."
    ProGran3::FoundationBuilder.create(100, 200, 50)
    puts "✅ Фундамент створено успішно!"
  rescue => e
    puts "❌ Помилка створення фундаменту: #{e.message}"
    puts "📋 Backtrace: #{e.backtrace.first(5)}"
  end
else
  puts "❌ FoundationBuilder не завантажено"
  
  # Перевіряємо, які модулі завантажені
  puts "📋 Доступні модулі ProGran3:"
  ProGran3.constants.each do |const|
    puts "  - #{const}"
  end
end

puts "🎉 Тестування завершено!"
