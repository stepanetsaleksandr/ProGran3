#!/usr/bin/env ruby
# create_icons.rb
# Скрипт для створення заглушок іконок

require 'fileutils'

puts "Створення заглушок іконок..."

# Створюємо папку icons якщо її немає
icons_dir = File.join(File.dirname(__FILE__), 'proGran3', 'icons')
FileUtils.mkdir_p(icons_dir)

# Створюємо простий SVG файл для іконки
svg_content = <<~SVG
<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" fill="#4CAF50" rx="4"/>
  <text x="16" y="20" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="white">PG3</text>
</svg>
SVG

# Зберігаємо SVG файл
svg_file = File.join(icons_dir, 'icon.svg')
File.write(svg_file, svg_content)
puts "✅ Створено: #{svg_file}"

# Створюємо простий HTML файл для перетворення в PNG
html_content = <<~HTML
<!DOCTYPE html>
<html>
<head>
    <title>ProGran3 Icon</title>
    <style>
        body { margin: 0; padding: 0; }
        .icon { width: 32px; height: 32px; }
    </style>
</head>
<body>
    <div class="icon">
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" fill="#4CAF50" rx="4"/>
            <text x="16" y="20" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="white">PG3</text>
        </svg>
    </div>
</body>
</html>
HTML

html_file = File.join(icons_dir, 'icon.html')
File.write(html_file, html_content)
puts "✅ Створено: #{html_file}"

puts "\n📝 Інструкції для створення PNG іконок:"
puts "1. Відкрийте #{html_file} в браузері"
puts "2. Зробіть скріншот іконки"
puts "3. Збережіть як:"
puts "   - icon_16.png (16x16 пікселів)"
puts "   - icon_32.png (32x32 пікселів)"
puts "4. Помістіть файли в папку: #{icons_dir}"
puts "\n💡 Або надайте свою іконку, і я допоможу її інтегрувати!"
