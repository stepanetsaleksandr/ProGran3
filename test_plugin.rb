#!/usr/bin/env ruby
# test_plugin.rb
# Скрипт для тестування синтаксису Ruby файлів плагіна

require 'fileutils'

puts "🧪 Тестування плагіна ProGran3..."
puts "=" * 50

# Перевіряємо синтаксис всіх Ruby файлів
def test_ruby_syntax
  puts "📝 Перевірка синтаксису Ruby файлів..."
  
  rb_files = Dir.glob("**/*.rb").sort
  errors = []
  
  rb_files.each do |file|
    begin
      # Перевіряємо синтаксис без виконання
      File.open(file, 'r') do |f|
        content = f.read
        # Пропускаємо файли, які потребують SketchUp API
        if content.include?('require') && (content.include?('sketchup') || content.include?('UI.menu'))
          puts "  ⚠️  #{file} (потребує SketchUp API)"
        else
          # Перевіряємо тільки синтаксис
          RubyVM::InstructionSequence.compile(content, file)
          puts "  ✅ #{file}"
        end
      end
    rescue SyntaxError => e
      puts "  ❌ #{file}: #{e.message}"
      errors << "#{file}: #{e.message}"
    rescue LoadError => e
      puts "  ⚠️  #{file}: #{e.message}"
    rescue => e
      puts "  ⚠️  #{file}: #{e.message}"
    end
  end
  
  if errors.empty?
    puts "🎉 Всі Ruby файли мають правильний синтаксис!"
  else
    puts "❌ Знайдено помилки синтаксису:"
    errors.each { |error| puts "  - #{error}" }
  end
  
  errors.empty?
end

# Перевіряємо структуру файлів
def test_file_structure
  puts "\n📁 Перевірка структури файлів..."
  
  required_files = [
    "proGran3.rb",
    "proGran3/loader.rb",
    "proGran3/ui.rb",
    "proGran3/builders/foundation_builder.rb",
    "proGran3/builders/tiling_builder.rb",
    "proGran3/builders/cladding_builder.rb"
  ]
  
  missing_files = []
  
  required_files.each do |file|
    if File.exist?(file)
      puts "  ✅ #{file}"
    else
      puts "  ❌ #{file} - відсутній"
      missing_files << file
    end
  end
  
  if missing_files.empty?
    puts "🎉 Всі необхідні файли присутні!"
  else
    puts "❌ Відсутні файли:"
    missing_files.each { |file| puts "  - #{file}" }
  end
  
  missing_files.empty?
end

# Перевіряємо assets
def test_assets
  puts "\n🎨 Перевірка assets..."
  
  asset_categories = ["flowerbeds", "gravestones", "pavement_tiles", "stands", "steles"]
  missing_categories = []
  
  asset_categories.each do |category|
    category_path = "proGran3/assets/#{category}"
    if Dir.exist?(category_path)
      files = Dir.glob("#{category_path}/*.{skp,png}")
      puts "  ✅ #{category}: #{files.length} файлів"
    else
      puts "  ❌ #{category}: папка відсутня"
      missing_categories << category
    end
  end
  
  if missing_categories.empty?
    puts "🎉 Всі категорії assets присутні!"
  else
    puts "⚠️  Відсутні категорії:"
    missing_categories.each { |cat| puts "  - #{cat}" }
  end
  
  missing_categories.empty?
end

# Головна логіка тестування
begin
  syntax_ok = test_ruby_syntax
  structure_ok = test_file_structure
  assets_ok = test_assets
  
  puts "\n" + "=" * 50
  puts "📊 Результати тестування:"
  puts "  Синтаксис Ruby: #{syntax_ok ? '✅' : '❌'}"
  puts "  Структура файлів: #{structure_ok ? '✅' : '❌'}"
  puts "  Assets: #{assets_ok ? '✅' : '⚠️'}"
  
  if syntax_ok && structure_ok
    puts "\n🎉 Плагін готовий до розгортання!"
    puts "💡 Запустіть: .\\deploy.bat або .\\deploy_to_sketchup.ps1"
  else
    puts "\n❌ Виправте помилки перед розгортанням"
  end
  
rescue => e
  puts "❌ Помилка тестування: #{e.message}"
  puts e.backtrace.first(5)
end
