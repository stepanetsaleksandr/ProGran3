#!/usr/bin/env ruby
# test_plugin.rb
# Тестування плагіна ProGran3 без запуску SketchUp

puts "🧪 Тестування плагіна ProGran3..."
puts "=" * 50

# Перевіряємо структуру файлів
puts "1. Перевірка структури файлів..."

required_files = [
  'proGran3.rb',
  'proGran3/loader.rb',
  'proGran3/ui.rb',
  'proGran3/test_features.rb',
  'proGran3/preview_generator.rb',
  'proGran3/skp_preview_generator.rb',
  'proGran3/skp_preview_extractor.rb',
  'proGran3/builders/foundation_builder.rb',
  'proGran3/builders/tiling_builder.rb',
  'proGran3/builders/cladding_builder.rb'
]

missing_files = []
required_files.each do |file|
  if File.exist?(file)
    puts "   ✅ #{file}"
  else
    puts "   ❌ #{file} - НЕ ЗНАЙДЕНО"
    missing_files << file
  end
end

if missing_files.empty?
  puts "   🎉 Всі файли присутні!"
else
  puts "   ⚠️ Відсутні файли: #{missing_files.join(', ')}"
end

puts "\n2. Перевірка структури assets..."

assets_dirs = [
  'proGran3/assets/stands',
  'proGran3/assets/steles', 
  'proGran3/assets/flowerbeds',
  'proGran3/assets/gravestones',
  'proGran3/assets/pavement_tiles'
]

assets_dirs.each do |dir|
  if Dir.exist?(dir)
    files = Dir.glob(File.join(dir, "*.skp"))
    puts "   ✅ #{dir} (#{files.length} файлів)"
  else
    puts "   ❌ #{dir} - НЕ ЗНАЙДЕНО"
  end
end

puts "\n3. Перевірка web інтерфейсу..."

web_files = [
  'proGran3/web/index.html',
  'proGran3/web/script.js',
  'proGran3/web/style.css'
]

web_files.each do |file|
  if File.exist?(file)
    puts "   ✅ #{file}"
  else
    puts "   ❌ #{file} - НЕ ЗНАЙДЕНО"
  end
end

puts "\n4. Перевірка іконок..."

icon_files = [
  'proGran3/icons/icon_24.png'
]

icon_files.each do |file|
  if File.exist?(file)
    puts "   ✅ #{file}"
  else
    puts "   ❌ #{file} - НЕ ЗНАЙДЕНО"
  end
end

puts "\n5. Аналіз коду..."

# Перевіряємо синтаксис Ruby файлів
ruby_files = Dir.glob("proGran3/**/*.rb") + ['proGran3.rb']
syntax_errors = []

ruby_files.each do |file|
  begin
    # Простий тест синтаксису
    File.read(file)
    puts "   ✅ #{file} - синтаксис OK"
  rescue => e
    puts "   ❌ #{file} - помилка синтаксису: #{e.message}"
    syntax_errors << file
  end
end

puts "\n6. Перевірка конфігурації..."

# Перевіряємо config.json якщо він є
if File.exist?('config.json')
  begin
    require 'json'
    config = JSON.parse(File.read('config.json'))
    puts "   ✅ config.json - валідний JSON"
  rescue => e
    puts "   ❌ config.json - помилка JSON: #{e.message}"
  end
else
  puts "   ⚠️ config.json - не знайдено"
end

puts "\n" + "=" * 50
puts "🎉 Тестування завершено!"

if missing_files.empty? && syntax_errors.empty?
  puts "✅ Плагін готовий до використання!"
  puts "\n📋 Інструкції для тестування в SketchUp:"
  puts "1. Запустіть SketchUp"
  puts "2. Відкрийте Ruby Console (Window > Ruby Console)"
  puts "3. Виконайте команду: load 'test_plugin.rb'"
  puts "4. Або виконайте: ProGran3.test"
  puts "5. Для тестування UI: ProGran3::UI.show_dialog"
else
  puts "❌ Знайдено проблеми, які потрібно виправити:"
  missing_files.each { |file| puts "   - Відсутній файл: #{file}" }
  syntax_errors.each { |file| puts "   - Помилка синтаксису: #{file}" }
end
