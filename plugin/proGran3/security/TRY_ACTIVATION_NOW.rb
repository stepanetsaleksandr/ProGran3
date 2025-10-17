# TRY_ACTIVATION_NOW.rb
# Спроба активації з оновленим кодом

puts "\n" + "="*70
puts "🔄 СПРОБА АКТИВАЦІЇ З ВИПРАВЛЕННЯМИ"
puts "="*70

puts "\n1️⃣ Перезавантажуємо оновлені модулі..."
begin
  base_path = 'C:/Users/ProVis3D/Desktop/ProGran3/plugin/proGran3/security'
  load File.join(base_path, 'api_client.rb')
  load File.join(base_path, 'license_manager.rb')
  load File.join(File.dirname(__FILE__), '..', 'license_ui.rb')
  puts "   ✅ Модулі перезавантажено"
rescue => e
  puts "   ❌ Помилка: #{e.message}"
end

puts "\n2️⃣ Конфігурація:"
puts "   API URL: #{ProGran3::Security::ApiClient.const_get(:API_BASE_URL)}"

puts "\n3️⃣ Відкриваємо License UI з виправленнями..."
begin
  ProGran3::LicenseUI.show
  puts "   ✅ License UI відкрито"
rescue => e
  puts "   ❌ Помилка: #{e.message}"
end

puts "\n✅ ЩО ВИПРАВЛЕНО:"
puts "   • Оновлено URL сервера (новий deployment)"
puts "   • Додано endpoint /api/licenses/validate"
puts "   • Покращено логування помилок"
puts "   • Видалено обмеження довжини ключа"

puts "\n📝 ВАШ КЛЮЧ:"
puts "   PROGRAN3-2025-F46FAAB674CE-MGSDDCRZ"

puts "\n💡 ІНСТРУКЦІЯ:"
puts "   1. Введіть email: testkey@mai.com (або інший)"
puts "   2. Вставте ключ: PROGRAN3-2025-F46FAAB674CE-MGSDDCRZ"
puts "   3. Натисніть 'Активувати'"
puts "   4. Дивіться Ruby Console на детальні повідомлення"

puts "\n🔍 ЯКЩО ЗНОВУ 401:"
puts "   Це означає що ключ не існує в БД або має неправильний статус."
puts "   Згенеруйте НОВИЙ ключ в Dashboard і спробуйте його."

puts "="*70 + "\n"


