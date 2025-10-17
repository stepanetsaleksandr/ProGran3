# RELOAD_LICENSE_UI.rb
# Швидке перезавантаження License UI з виправленнями

puts "\n" + "="*70
puts "🔄 ПЕРЕЗАВАНТАЖЕННЯ LICENSE UI"
puts "="*70

puts "\n1️⃣ Завантажуємо оновлений license_ui.rb..."
begin
  load File.join(File.dirname(__FILE__), '..', 'license_ui.rb')
  puts "   ✅ Файл завантажено з виправленнями"
rescue => e
  puts "   ❌ Помилка: #{e.message}"
  puts e.backtrace.first(3)
end

puts "\n2️⃣ Відкриваємо License UI..."
begin
  ProGran3::LicenseUI.show
  puts "   ✅ License UI відкрито"
rescue => e
  puts "   ❌ Помилка: #{e.message}"
  puts e.backtrace.first(3)
end

puts "\n✅ ЩО ВИПРАВЛЕНО:"
puts "   • Видалено обмеження в 19 символів"
puts "   • Тепер підтримуються ключі будь-якої довжини"
puts "   • Автоматичне переведення в UPPERCASE"
puts "   • Оновлений placeholder: PROGRAN3-2025-XXXXXXXX-XXXXXXXX"

puts "\n💡 ВАШ КЛЮЧ:"
puts "   PROGRAN3-2025-F46FAAB674CE-MGSDDCRZ"
puts ""
puts "   Тепер він має повністю поміститись в поле вводу!"

puts "\n📝 ІНСТРУКЦІЯ:"
puts "   1. В відкритому License UI введіть email"
puts "   2. Вставте ключ: PROGRAN3-2025-F46FAAB674CE-MGSDDCRZ"
puts "   3. Натисніть 'Активувати ліцензію'"
puts "   4. Очікуйте на відповідь від сервера (5-10 сек)"

puts "="*70 + "\n"


