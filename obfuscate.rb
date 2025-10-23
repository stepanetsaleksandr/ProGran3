# obfuscate.rb
# Обфускація Ruby коду для SketchUp плагіна

require 'fileutils'
require 'base64'

class RubyObfuscator
  
  def initialize(source_dir, output_dir)
    @source_dir = source_dir
    @output_dir = output_dir
    @exclude_patterns = [
      /\.git/,
      /\.rbz$/,
      /backups\//,
      /production_test\.rb$/,
      /TEST_.*\.rb$/
    ]
  end
  
  def obfuscate_all
    puts "🔐 Початок обфускації..."
    puts "=" * 60
    
    # Створюємо output директорію
    FileUtils.mkdir_p(@output_dir)
    
    # Обфускуємо Ruby файли
    obfuscated_count = 0
    Dir.glob(File.join(@source_dir, '**', '*.rb')).each do |file|
      next if should_exclude?(file)
      
      relative_path = file.sub("#{@source_dir}/", '')
      output_file = File.join(@output_dir, relative_path)
      
      # Створюємо папки
      FileUtils.mkdir_p(File.dirname(output_file))
      
      # Обфускуємо файл
      obfuscate_file(file, output_file)
      obfuscated_count += 1
      
      puts "  ✓ #{relative_path}" if obfuscated_count % 5 == 0
    end
    
    # Копіюємо не-Ruby файли
    copy_non_ruby_files
    
    puts "\n✅ Обфусковано файлів: #{obfuscated_count}"
  end
  
  private
  
  def obfuscate_file(input_file, output_file)
    content = File.read(input_file, encoding: 'UTF-8')
    
    # Методи обфускації
    obfuscated = content
    obfuscated = remove_comments(obfuscated)
    obfuscated = minify_whitespace(obfuscated)
    obfuscated = encode_strings(obfuscated)
    
    File.write(output_file, obfuscated, encoding: 'UTF-8')
  end
  
  def remove_comments(code)
    # Видаляємо коментарі (прості випадки)
    code.gsub(/^\s*#[^!].*$/, '')
        .gsub(/\s+#[^{].*$/, '') # Видаляємо inline коментарі
  end
  
  def minify_whitespace(code)
    # Видаляємо зайві пробіли та порожні рядки
    code.gsub(/\n\s*\n+/, "\n")
        .gsub(/^\s+$/, '')
  end
  
  def encode_strings(code)
    # Кодуємо важливі рядки (опціонально)
    # Для production можна додати складнішу логіку
    code
  end
  
  def copy_non_ruby_files
    # Копіюємо assets, HTML, CSS, JS, JSON
    patterns = ['**/*.{html,css,js,json,png,jpg,skp,skb}']
    
    patterns.each do |pattern|
      Dir.glob(File.join(@source_dir, pattern)).each do |file|
        next if should_exclude?(file)
        
        relative_path = file.sub("#{@source_dir}/", '')
        output_file = File.join(@output_dir, relative_path)
        
        FileUtils.mkdir_p(File.dirname(output_file))
        FileUtils.cp(file, output_file)
      end
    end
  end
  
  def should_exclude?(file)
    @exclude_patterns.any? { |pattern| file =~ pattern }
  end
  
end

# Використання
if __FILE__ == $0
  source = File.expand_path('plugin', __dir__)
  output = File.expand_path('plugin_obfuscated', __dir__)
  
  obfuscator = RubyObfuscator.new(source, output)
  obfuscator.obfuscate_all
  
  puts "\n📦 Обфусковані файли в: #{output}"
end

