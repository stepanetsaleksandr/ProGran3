# test_universal_extractor.rb
# Тестування універсального модуля витягування превью

# Завантажуємо універсальний модуль
load File.join(File.dirname(__FILE__), 'universal_skp_preview_extractor.rb')

puts "🧪 Тестування універсального модуля витягування превью"
puts "=" * 60

# Тест 1: Базове використання
puts "\n1️⃣ Тест базового використання:"
result1 = UniversalSkpPreviewExtractor.extract_preview("proGran3/assets/stands/stand_50x20x15.skp")
if result1 && result1[:success]
  puts "✅ Успішно: #{File.basename(result1[:output_path])}"
  puts "📏 Розмір: #{result1[:file_size]} байт"
else
  puts "❌ Помилка: #{result1[:error]}" if result1
end

# Тест 2: З налаштуваннями
puts "\n2️⃣ Тест з налаштуваннями:"
config = UniversalSkpPreviewExtractor::Config.new(
  output_size: 512,
  output_format: 'jpg',
  output_dir: File.join(Dir.tmpdir, 'test_previews'),
  verbose_logging: false
)

result2 = UniversalSkpPreviewExtractor.extract_preview("proGran3/assets/steles/stele_TEST.skp", config)
if result2 && result2[:success]
  puts "✅ Успішно: #{File.basename(result2[:output_path])}"
  puts "📏 Розмір: #{result2[:file_size]} байт"
else
  puts "❌ Помилка: #{result2[:error]}" if result2
end

# Тест 3: Обробка кількох файлів
puts "\n3️⃣ Тест обробки кількох файлів:"
skp_files = Dir.glob("proGran3/assets/**/*.skp").first(3) # Беремо перші 3 файли
if skp_files.any?
  result3 = UniversalSkpPreviewExtractor.extract_multiple_previews(skp_files)
  puts "📊 Результати:"
  puts "  Всього файлів: #{result3[:total_files]}"
  puts "  Успішно: #{result3[:successful]}"
  puts "  Невдало: #{result3[:failed]}"
else
  puts "❌ Не знайдено .skp файлів для тестування"
end

# Тест 4: Обробка директорії
puts "\n4️⃣ Тест обробки директорії:"
result4 = UniversalSkpPreviewExtractor.extract_from_directory("proGran3/assets")
puts "📊 Результати обробки директорії:"
puts "  Всього файлів: #{result4[:total_files]}"
puts "  Успішно: #{result4[:successful]}"
puts "  Невдало: #{result4[:failed]}"

# Тест 5: Тестування модуля
puts "\n5️⃣ Тест вбудованого тестування:"
result5 = UniversalSkpPreviewExtractor.test_extraction
if result5 && result5[:success]
  puts "✅ Модуль працює коректно"
  puts "📁 Превью збережено: #{File.basename(result5[:output_path])}"
else
  puts "❌ Помилка тестування: #{result5[:error]}" if result5
end

puts "\n🎉 Тестування завершено!"
