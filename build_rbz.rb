# build_rbz.rb
# Створення .rbz архіву плагіна ProGran3 для деплою

require 'zip'
require 'fileutils'
require 'json'

class PluginBuilder
  PLUGIN_NAME = 'proGran3'
  VERSION = '3.2.1'
  OUTPUT_DIR = 'dist'
  
  # Файли які НЕ потрібно включати в збірку
  EXCLUDE_PATTERNS = [
    /\.git/,
    /\.rbz$/,
    /\.log$/,
    /\.tmp$/,
    /~$/,
    /production_test\.rb$/,
    /TEST_.*\.rb$/,
    /backups\//,
    /\.DS_Store/,
    /Thumbs\.db/
  ]
  
  def initialize
    @plugin_dir = File.expand_path('plugin', __dir__)
    @output_dir = File.expand_path(OUTPUT_DIR, __dir__)
    @timestamp = Time.now.strftime('%Y%m%d_%H%M%S')
  end
  
  def build
    puts "🏗️ Збірка плагіна #{PLUGIN_NAME} v#{VERSION}"
    puts "=" * 60
    
    # Створюємо output директорію
    FileUtils.mkdir_p(@output_dir)
    
    # Генеруємо ім'я файлу
    rbz_filename = "#{PLUGIN_NAME}_v#{VERSION}_#{@timestamp}.rbz"
    rbz_path = File.join(@output_dir, rbz_filename)
    
    # Перевіряємо наявність плагіна
    unless Dir.exist?(@plugin_dir)
      puts "❌ Помилка: Директорія plugin/ не знайдена"
      return false
    end
    
    # Створюємо .rbz архів
    create_rbz(rbz_path)
    
    # Перевіряємо результат
    if File.exist?(rbz_path)
      file_size = File.size(rbz_path) / 1024.0 / 1024.0
      puts "\n✅ Збірка завершена успішно!"
      puts "📦 Файл: #{rbz_filename}"
      puts "📏 Розмір: #{file_size.round(2)} MB"
      puts "📂 Шлях: #{rbz_path}"
      
      # Створюємо symlink на останню версію
      create_latest_symlink(rbz_path, rbz_filename)
      
      # Виводимо інструкції
      print_installation_instructions(rbz_filename)
      
      true
    else
      puts "❌ Помилка створення .rbz файлу"
      false
    end
  end
  
  private
  
  def create_rbz(output_path)
    puts "\n📦 Створення .rbz архіву..."
    
    file_count = 0
    
    Zip::File.open(output_path, create: true) do |zipfile|
      # Додаємо loader (точка входу для Extension Manager)
      loader_file = File.join(@plugin_dir, "#{PLUGIN_NAME}_loader.rb")
      if File.exist?(loader_file)
        add_to_zip(zipfile, loader_file, "#{PLUGIN_NAME}.rb")  # Має бути .rb для автозавантаження
        file_count += 1
        puts "  ✓ #{PLUGIN_NAME}.rb (loader)"
      end
      
      # Додаємо головний файл плагіна
      main_file = File.join(@plugin_dir, "#{PLUGIN_NAME}.rb")
      if File.exist?(main_file)
        add_to_zip(zipfile, main_file, "#{PLUGIN_NAME}/#{PLUGIN_NAME}_core.rb")
        file_count += 1
        puts "  ✓ #{PLUGIN_NAME}/#{PLUGIN_NAME}_core.rb"
      end
      
      # Додаємо всі файли з директорії proGran3/
      plugin_subdir = File.join(@plugin_dir, PLUGIN_NAME)
      if Dir.exist?(plugin_subdir)
        Dir.glob(File.join(plugin_subdir, '**', '*')).each do |file|
          next if File.directory?(file)
          next if should_exclude?(file)
          
          # Відносний шлях
          relative_path = file.sub("#{@plugin_dir}/", '')
          
          add_to_zip(zipfile, file, relative_path)
          file_count += 1
          
          # Виводимо прогрес кожні 10 файлів
          puts "  ✓ #{relative_path}" if file_count % 10 == 0
        end
      end
      
      # Додаємо config.json
      config_file = File.join(@plugin_dir, 'config.json')
      if File.exist?(config_file)
        add_to_zip(zipfile, config_file, 'config.json')
        file_count += 1
        puts "  ✓ config.json"
      end
    end
    
    puts "\n📊 Додано файлів: #{file_count}"
  end
  
  def add_to_zip(zipfile, file_path, zip_path)
    zipfile.add(zip_path, file_path)
  rescue Zip::EntryExistsError
    puts "  ⚠️ Файл #{zip_path} вже існує в архіві"
  end
  
  def should_exclude?(file_path)
    EXCLUDE_PATTERNS.any? { |pattern| file_path =~ pattern }
  end
  
  def create_latest_symlink(rbz_path, rbz_filename)
    latest_path = File.join(@output_dir, "#{PLUGIN_NAME}_latest.rbz")
    
    begin
      File.delete(latest_path) if File.exist?(latest_path)
      FileUtils.cp(rbz_path, latest_path)
      puts "\n🔗 Створено symlink: #{PLUGIN_NAME}_latest.rbz"
    rescue => e
      puts "\n⚠️ Не вдалося створити symlink: #{e.message}"
    end
  end
  
  def print_installation_instructions(filename)
    puts "\n" + "=" * 60
    puts "📖 ІНСТРУКЦІЇ З ВСТАНОВЛЕННЯ"
    puts "=" * 60
    puts "\n🎯 Для користувачів:"
    puts "1. Відкрийте SketchUp"
    puts "2. Перейдіть: Window → Extension Manager"
    puts "3. Натисніть: Install Extension"
    puts "4. Виберіть файл: #{filename}"
    puts "5. Підтвердіть встановлення"
    puts "6. Перезапустіть SketchUp"
    puts "\n🔧 Альтернативний спосіб:"
    puts "1. Розпакуйте .rbz архів"
    puts "2. Скопіюйте файли в:"
    puts "   %APPDATA%\\SketchUp\\SketchUp 2024\\SketchUp\\Plugins\\"
    puts "\n⚠️ ВАЖЛИВО:"
    puts "• Плагін потребує інтернет з'єднання"
    puts "• Необхідна активація ліцензії"
    puts "• Мінімальна версія SketchUp: 2020"
    puts "\n" + "=" * 60
  end
end

# Запуск збірки
if __FILE__ == $0
  builder = PluginBuilder.new
  success = builder.build
  
  exit(success ? 0 : 1)
end

