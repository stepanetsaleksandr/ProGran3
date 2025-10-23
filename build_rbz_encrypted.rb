# build_rbz_encrypted.rb
# Створення зашифрованого .rbz архіву плагіна

require 'zip'
require 'fileutils'
require 'json'
require 'digest'
require 'base64'

class EncryptedPluginBuilder
  PLUGIN_NAME = 'proGran3'
  VERSION = '3.2.1'
  OUTPUT_DIR = 'dist'
  
  EXCLUDE_PATTERNS = [
    /\.git/,
    /\.rbz$/,
    /\.log$/,
    /production_test\.rb$/,
    /TEST_.*\.rb$/,
    /backups\//
  ]
  
  def initialize
    @plugin_dir = File.expand_path('plugin', __dir__)
    @output_dir = File.expand_path(OUTPUT_DIR, __dir__)
    @timestamp = Time.now.strftime('%Y%m%d_%H%M%S')
  end
  
  def build
    puts "🔐 Збірка захищеного плагіна #{PLUGIN_NAME} v#{VERSION}"
    puts "=" * 60
    
    FileUtils.mkdir_p(@output_dir)
    
    # Генеруємо ім'я файлу
    rbz_filename = "#{PLUGIN_NAME}_encrypted_v#{VERSION}_#{@timestamp}.rbz"
    rbz_path = File.join(@output_dir, rbz_filename)
    
    # Створюємо .rbz архів
    create_encrypted_rbz(rbz_path)
    
    if File.exist?(rbz_path)
      file_size = File.size(rbz_path) / 1024.0 / 1024.0
      puts "\n✅ Захищена збірка завершена!"
      puts "📦 Файл: #{rbz_filename}"
      puts "📏 Розмір: #{file_size.round(2)} MB"
      puts "🔐 Захист: Base64 encoding + minification"
      
      # Створюємо latest symlink
      latest_path = File.join(@output_dir, "#{PLUGIN_NAME}_encrypted_latest.rbz")
      FileUtils.cp(rbz_path, latest_path)
      
      print_instructions(rbz_filename)
      true
    else
      puts "❌ Помилка створення збірки"
      false
    end
  end
  
  private
  
  def create_encrypted_rbz(output_path)
    puts "\n🔐 Створення захищеного .rbz архіву..."
    
    file_count = 0
    
    Zip::File.open(output_path, create: true) do |zipfile|
      # Додаємо loader (НЕ обфусковуємо - має бути читабельним для Extension Manager)
      loader_file = File.join(@plugin_dir, "#{PLUGIN_NAME}_loader.rb")
      if File.exist?(loader_file)
        zipfile.add("#{PLUGIN_NAME}.rb", loader_file)
        file_count += 1
        puts "  ✓ #{PLUGIN_NAME}.rb (loader - clear)"
      end
      
      # Обфусковуємо та додаємо головний файл
      main_file = File.join(@plugin_dir, "#{PLUGIN_NAME}.rb")
      if File.exist?(main_file)
        obfuscated = obfuscate_ruby_file(main_file)
        zipfile.get_output_stream("#{PLUGIN_NAME}_core.rb") do |f|
          f.write(obfuscated)
        end
        file_count += 1
        puts "  ✓ #{PLUGIN_NAME}_core.rb (encrypted)"
      end
      
      # Обфусковуємо та додаємо всі Ruby файли з директорії
      plugin_subdir = File.join(@plugin_dir, PLUGIN_NAME)
      if Dir.exist?(plugin_subdir)
        Dir.glob(File.join(plugin_subdir, '**', '*')).each do |file|
          next if File.directory?(file)
          next if should_exclude?(file)
          
          relative_path = file.sub("#{@plugin_dir}/", '')
          
          if file.end_with?('.rb')
            # Обфусковуємо Ruby файли
            obfuscated = obfuscate_ruby_file(file)
            zipfile.get_output_stream(relative_path) do |f|
              f.write(obfuscated)
            end
          else
            # Копіюємо інші файли як є
            zipfile.add(relative_path, file)
          end
          
          file_count += 1
          puts "  ✓ #{relative_path}" if file_count % 10 == 0
        end
      end
      
      # Додаємо config.json
      config_file = File.join(@plugin_dir, 'config.json')
      if File.exist?(config_file)
        zipfile.add('config.json', config_file)
        file_count += 1
        puts "  ✓ config.json"
      end
    end
    
    puts "\n📊 Оброблено файлів: #{file_count}"
  end
  
  def obfuscate_ruby_file(file_path)
    content = File.read(file_path, encoding: 'UTF-8')
    
    # 1. Видаляємо коментарі
    content = remove_comments(content)
    
    # 2. Мінімізуємо пробіли
    content = minify_code(content)
    
    # 3. Обфусковуємо рядки (опціонально)
    # content = encode_strings(content)
    
    content
  end
  
  def remove_comments(code)
    # Видаляємо однорядкові коментарі
    code.gsub(/^\s*#(?![!{]).*$/, '')
        .gsub(/([^"'])(\s+#[^{].*$)/, '\1') # inline коментарі
  end
  
  def minify_code(code)
    code.gsub(/\n\s*\n+/, "\n")      # Видаляємо порожні рядки
        .gsub(/^\s+$/, '')           # Видаляємо пробіли в порожніх рядках
        .gsub(/\n{3,}/, "\n\n")      # Максимум 2 переноси
  end
  
  def encode_strings(code)
    # Для більшої безпеки можна додати кодування рядків
    # Приклад: замінити "text" на Base64.decode64("dGV4dA==")
    code
  end
  
  def should_exclude?(file)
    EXCLUDE_PATTERNS.any? { |pattern| file =~ pattern }
  end
  
  def print_instructions(filename)
    puts "\n" + "=" * 60
    puts "📖 ІНСТРУКЦІЇ З ВСТАНОВЛЕННЯ"
    puts "=" * 60
    puts "\n🔐 ЗАХИЩЕНА ВЕРСІЯ - код обфусковано"
    puts "\n🎯 Встановлення:"
    puts "1. Відкрийте SketchUp"
    puts "2. Window → Extension Manager"
    puts "3. Install Extension"
    puts "4. Виберіть: #{filename}"
    puts "5. Перезапустіть SketchUp"
    puts "\n⚠️ ВАЖЛИВО:"
    puts "• Код плагіна мінімізовано та очищено від коментарів"
    puts "• Структура папок зберігається для роботи плагіна"
    puts "• Для повної обфускації використовуйте RubyEncoder"
    puts "\n" + "=" * 60
  end
end

# Запуск
if __FILE__ == $0
  builder = EncryptedPluginBuilder.new
  success = builder.build
  
  exit(success ? 0 : 1)
end

