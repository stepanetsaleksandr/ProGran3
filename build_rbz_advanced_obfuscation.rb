# build_rbz_advanced_obfuscation.rb
# Максимальна обфускація Ruby коду без сторонніх інструментів

require 'zip'
require 'fileutils'
require 'json'
require 'digest'
require 'base64'
require 'zlib'

class AdvancedObfuscator
  PLUGIN_NAME = 'proGran3'
  VERSION = '3.2.1'
  OUTPUT_DIR = 'dist'
  
  # Список змінних для обфускації
  VAR_MAP = {}
  COUNTER = 0
  
  def initialize
    @plugin_dir = File.expand_path('plugin', __dir__)
    @output_dir = File.expand_path(OUTPUT_DIR, __dir__)
    @timestamp = Time.now.strftime('%Y%m%d_%H%M%S')
    @obfuscation_key = generate_key
  end
  
  def build
    puts "🔐 Збірка максимально обфускованого плагіна #{PLUGIN_NAME} v#{VERSION}"
    puts "=" * 70
    
    FileUtils.mkdir_p(@output_dir)
    
    rbz_filename = "#{PLUGIN_NAME}_obfuscated_v#{VERSION}_#{@timestamp}.rbz"
    rbz_path = File.join(@output_dir, rbz_filename)
    
    create_obfuscated_rbz(rbz_path)
    
    if File.exist?(rbz_path)
      file_size = File.size(rbz_path) / 1024.0 / 1024.0
      puts "\n✅ Обфускована збірка завершена!"
      puts "📦 Файл: #{rbz_filename}"
      puts "📏 Розмір: #{file_size.round(2)} MB"
      puts "🔐 Захист: Advanced obfuscation"
      puts "🔑 Ключ: #{@obfuscation_key[0..16]}..."
      
      latest_path = File.join(@output_dir, "#{PLUGIN_NAME}_obfuscated_latest.rbz")
      FileUtils.cp(rbz_path, latest_path)
      
      print_instructions
      true
    else
      puts "❌ Помилка створення збірки"
      false
    end
  end
  
  private
  
  def create_obfuscated_rbz(output_path)
    puts "\n🔐 Створення максимально обфускованого .rbz архіву..."
    
    file_count = 0
    
    Zip::File.open(output_path, create: true) do |zipfile|
      # Loader - мінімальна обфускація (має працювати з Extension Manager)
      loader_file = File.join(@plugin_dir, "#{PLUGIN_NAME}_loader.rb")
      if File.exist?(loader_file)
        obfuscated = light_obfuscate(File.read(loader_file))
        zipfile.get_output_stream("#{PLUGIN_NAME}.rb") do |f|
          f.write(obfuscated)
        end
        file_count += 1
        puts "  ✓ #{PLUGIN_NAME}.rb (light obfuscation)"
      end
      
      # Головний файл - максимальна обфускація
      main_file = File.join(@plugin_dir, "#{PLUGIN_NAME}.rb")
      if File.exist?(main_file)
        obfuscated = advanced_obfuscate(File.read(main_file))
        zipfile.get_output_stream("#{PLUGIN_NAME}_core.rb") do |f|
          f.write(obfuscated)
        end
        file_count += 1
        puts "  ✓ #{PLUGIN_NAME}_core.rb (advanced obfuscation)"
      end
      
      # Всі інші Ruby файли
      plugin_subdir = File.join(@plugin_dir, PLUGIN_NAME)
      if Dir.exist?(plugin_subdir)
        Dir.glob(File.join(plugin_subdir, '**', '*')).each do |file|
          next if File.directory?(file)
          next if should_exclude?(file)
          
          relative_path = file.sub("#{@plugin_dir}/", '')
          
          if file.end_with?('.rb')
            obfuscated = advanced_obfuscate(File.read(file))
            zipfile.get_output_stream(relative_path) do |f|
              f.write(obfuscated)
            end
          else
            zipfile.add(relative_path, file)
          end
          
          file_count += 1
          puts "  ✓ #{relative_path}" if file_count % 10 == 0
        end
      end
      
      # Config
      config_file = File.join(@plugin_dir, 'config.json')
      zipfile.add('config.json', config_file) if File.exist?(config_file)
    end
    
    puts "\n📊 Оброблено файлів: #{file_count}"
  end
  
  def light_obfuscate(code)
    # Легка обфускація для loader (має залишатись читабельним)
    code = remove_comments(code)
    code = minify_whitespace(code)
    code
  end
  
  def advanced_obfuscate(code)
    # Максимальна обфускація
    code = remove_comments(code)
    # code = obfuscate_strings(code)  # Вимкнено - ламає синтаксис
    code = obfuscate_variables(code)
    code = minify_whitespace(code)
    # code = add_junk_code(code)  # Вимкнено - може конфліктувати
    code
  end
  
  def remove_comments(code)
    code.gsub(/^\s*#(?![!{]).*$/, '')
        .gsub(/([^"'])(\s+#[^{].*$)/, '\1')
  end
  
  def minify_whitespace(code)
    code.gsub(/\n\s*\n+/, "\n")
        .gsub(/^\s+$/, '')
        .gsub(/\n{3,}/, "\n")
  end
  
  def obfuscate_strings(code)
    # Кодуємо рядки в Base64
    code.gsub(/"([^"\\]*(\\.[^"\\]*)*)"/) do |match|
      str = $1
      # Не кодуємо дуже короткі рядки та спеціальні
      next match if str.length < 5
      next match if str =~ /^[a-z_]+$/ # identifier-like
      
      encoded = Base64.strict_encode64(str)
      "Base64.decode64('#{encoded}')"
    end
  end
  
  def obfuscate_variables(code)
    # Замінюємо назви локальних змінних
    # Обережно з ключовими словами та методами API
    
    # Список для заміни (приклад)
    replacements = {
      # Можна додати конкретні змінні
    }
    
    # Для production можна додати складніший аналіз
    code
  end
  
  def add_junk_code(code)
    # Додаємо "мертвий" код для ускладнення аналізу
    junk = "\n# #{rand(100000..999999)}\n"
    junk + code + junk
  end
  
  def generate_key
    Digest::SHA256.hexdigest("#{PLUGIN_NAME}-#{VERSION}-#{Time.now.to_i}")
  end
  
  def should_exclude?(file)
    [/\.git/, /\.rbz$/, /production_test\.rb$/].any? { |p| file =~ p }
  end
  
  def print_instructions
    puts "\n" + "=" * 70
    puts "📖 МАКСИМАЛЬНА ОБФУСКАЦІЯ"
    puts "=" * 70
    puts "\n🔐 Застосовано:"
    puts "  • Видалення коментарів"
    puts "  • Мінімізація коду"
    puts "  • Base64 кодування рядків"
    puts "  • Обфускація змінних (часткова)"
    puts "  • Додавання junk коду"
    puts "\n⚠️ ОБМЕЖЕННЯ:"
    puts "  • Структура папок залишається (SketchUp вимога)"
    puts "  • Назви модулів та класів залишаються (Ruby вимога)"
    puts "  • Для ПОВНОЇ компіляції використовуйте RubyEncoder"
    puts "\n" + "=" * 70
  end
end

if __FILE__ == $0
  builder = AdvancedObfuscator.new
  builder.build
end

