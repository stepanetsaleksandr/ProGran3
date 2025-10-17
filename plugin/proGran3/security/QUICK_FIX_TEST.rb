# QUICK_FIX_TEST.rb
# Швидка перевірка чи виправлення працює

puts "\n" + "="*70
puts "🔧 ШВИДКА ПЕРЕВІРКА ВИПРАВЛЕННЯ"
puts "="*70

puts "\n1️⃣ Перезавантажуємо splash_screen.rb..."
begin
  load File.join(File.dirname(__FILE__), '..', 'splash_screen.rb')
  puts "   ✅ Завантажено"
rescue => e
  puts "   ❌ Помилка: #{e.message}"
end

puts "\n2️⃣ Відкриваємо Splash Screen..."
puts "   (Має показати splash → перевірка → License UI)"

begin
  ProGran3::SplashScreen.show
  puts "   ✅ Splash Screen показано"
rescue => e
  puts "   ❌ Помилка: #{e.message}"
  puts e.backtrace.first(3)
end

puts "\n💡 ЩО МАЄ СТАТИСЯ:"
puts "   1. Splash Screen з'явиться"
puts "   2. Progress bar завантажиться"
puts "   3. 'Перевірка ліцензії...'"
puts "   4. 'Ліцензія не знайдена'"
puts "   5. АВТОМАТИЧНО відкриється License UI"
puts ""
puts "   Якщо зависло - подивіться Ruby Console на помилки"
puts "="*70 + "\n"


