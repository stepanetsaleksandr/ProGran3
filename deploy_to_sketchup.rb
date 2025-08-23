#!/usr/bin/env ruby
# deploy_to_sketchup.rb
# Скрипт для копіювання файлів плагіна в папку SketchUp

require 'fileutils'
require 'pathname'

# Шлях до папки плагінів SketchUp (можна змінити на ваш)
SKETCHUP_PLUGINS_PATH = File.expand_path("~/AppData/Roaming/SketchUp/SketchUp 2023/SketchUp/Plugins")

# Шлях до поточного проекту
CURRENT_PROJECT_PATH = File.dirname(__FILE__)

def deploy_plugin
  puts "🚀 Розгортання плагіна ProGran3..."
  
  # Перевіряємо чи існує папка плагінів
  unless Dir.exist?(SKETCHUP_PLUGINS_PATH)
    puts "❌ Папка плагінів SketchUp не знайдена: #{SKETCHUP_PLUGINS_PATH}"
    puts "📝 Будь ласка, вкажіть правильний шлях до папки плагінів SketchUp"
    return false
  end
  
  # Шляхи для копіювання
  source_main_file = File.join(CURRENT_PROJECT_PATH, "proGran3.rb")
  source_folder = File.join(CURRENT_PROJECT_PATH, "proGran3")
  target_main_file = File.join(SKETCHUP_PLUGINS_PATH, "proGran3.rb")
  target_folder = File.join(SKETCHUP_PLUGINS_PATH, "proGran3")
  
  begin
    # Копіюємо головний файл
    if File.exist?(source_main_file)
      FileUtils.cp(source_main_file, target_main_file)
      puts "✅ Скопійовано: proGran3.rb"
    else
      puts "❌ Файл proGran3.rb не знайдено"
      return false
    end
    
    # Копіюємо папку proGran3
    if Dir.exist?(source_folder)
      if Dir.exist?(target_folder)
        FileUtils.rm_rf(target_folder)
      end
      FileUtils.cp_r(source_folder, target_folder)
      puts "✅ Скопійовано: папка proGran3"
    else
      puts "❌ Папка proGran3 не знайдена"
      return false
    end
    
    puts "🎉 Плагін успішно розгорнуто!"
    puts "📍 Розташування: #{SKETCHUP_PLUGINS_PATH}"
    puts "💡 Перезапустіть SketchUp або використайте команду ProGran3.reload в консолі Ruby"
    
    return true
    
  rescue => e
    puts "❌ Помилка при копіюванні: #{e.message}"
    return false
  end
end

def watch_and_deploy
  puts "👀 Режим спостереження за змінами..."
  puts "📁 Відстежую зміни в: #{CURRENT_PROJECT_PATH}"
  puts "🔄 Автоматично копіюватиму зміни в SketchUp"
  puts "⏹️  Натисніть Ctrl+C для зупинки"
  
  require 'listen'
  
  listener = Listen.to(CURRENT_PROJECT_PATH) do |modified, added, removed|
    puts "\n🔄 Виявлено зміни..."
    deploy_plugin
  end
  
  listener.start
  sleep
rescue Interrupt
  puts "\n👋 Зупинено спостереження"
rescue LoadError
  puts "❌ Для режиму спостереження потрібен gem 'listen'"
  puts "💡 Встановіть: gem install listen"
end

# Головна логіка
if ARGV.include?('--watch')
  watch_and_deploy
else
  deploy_plugin
end
