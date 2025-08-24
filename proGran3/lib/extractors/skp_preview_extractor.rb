# universal_skp_preview_extractor.rb
# Універсальний модуль для витягування превью з .skp файлів
# Автор: ProGran3 Team
# Версія: 1.0.0

require 'fileutils'
require 'sketchup.rb'

module UniversalSkpPreviewExtractor
  extend self
  
  # Конфігурація за замовчуванням
  DEFAULT_CONFIG = {
    output_size: 256,
    output_format: 'png',
    output_dir: nil, # nil = автоматично створюється в тимчасовій папці
    cleanup_after_extraction: true,
    verbose_logging: true,
    error_handling: :raise # :raise, :return_nil, :log_only
  }
  
  # Клас для налаштувань екстрактора
  class Config
    attr_accessor :output_size, :output_format, :output_dir, :cleanup_after_extraction, :verbose_logging, :error_handling
    
    def initialize(options = {})
      config = DEFAULT_CONFIG.merge(options)
      
      @output_size = config[:output_size]
      @output_format = config[:output_format]
      @output_dir = config[:output_dir]
      @cleanup_after_extraction = config[:cleanup_after_extraction]
      @verbose_logging = config[:verbose_logging]
      @error_handling = config[:error_handling]
    end
    
    def output_dir
      @output_dir ||= File.join(Dir.tmpdir, 'skp_previews')
    end
  end
  
  # Основний метод витягування превью
  def extract_preview(skp_file_path, config = nil)
    config = Config.new if config.nil?
    
    log("🔄 Витягування превью з: #{File.basename(skp_file_path)}", config)
    
    # Валідація вхідних даних
    unless validate_input(skp_file_path, config)
      return handle_error("Невірний шлях до файлу або файл не існує", config)
    end
    
    begin
      # Завантажуємо компонент через model.definitions.load
      model = Sketchup.active_model
      definitions = model.definitions
      
      definition = definitions.load(skp_file_path)
      
      if definition && definition.respond_to?(:save_thumbnail)
        # Генеруємо шлях для збереження
        output_path = generate_output_path(skp_file_path, config)
        
        # Створюємо директорію якщо її немає
        FileUtils.mkdir_p(File.dirname(output_path))
        
        # Зберігаємо вбудоване превью
        success = definition.save_thumbnail(output_path)
        
        if success && File.exist?(output_path) && File.size(output_path) > 0
          log("  ✅ Превью витягнуто: #{File.basename(output_path)}", config)
          log("  📏 Розмір: #{File.size(output_path)} байт", config)
          
          # Очищаємо тимчасово завантажений компонент
          cleanup_loaded_definition(definition, definitions, config) if config.cleanup_after_extraction
          
          return {
            success: true,
            output_path: output_path,
            file_size: File.size(output_path),
            original_file: skp_file_path
          }
        else
          return handle_error("Помилка збереження превью", config)
        end
      else
        return handle_error("Компонент не завантажено або save_thumbnail недоступний", config)
      end
      
    rescue => e
      return handle_error("Помилка витягування: #{e.message}", config)
    ensure
      # Очищаємо в разі помилки
      if definition && config.cleanup_after_extraction
        cleanup_loaded_definition(definition, definitions, config)
      end
    end
  end
  
  # Метод для витягування превью з кількох файлів
  def extract_multiple_previews(skp_file_paths, config = nil)
    config = Config.new if config.nil?
    
    log("🔄 Витягування превью з #{skp_file_paths.length} файлів...", config)
    
    results = []
    
    skp_file_paths.each_with_index do |file_path, index|
      log("  📁 [#{index + 1}/#{skp_file_paths.length}] #{File.basename(file_path)}", config)
      
      result = extract_preview(file_path, config)
      results << result
      
      # Невелика пауза між файлами для стабільності
      sleep(0.1) if index < skp_file_paths.length - 1
    end
    
    successful = results.select { |r| r[:success] }
    failed = results.reject { |r| r[:success] }
    
    log("✅ Завершено: #{successful.length} успішно, #{failed.length} невдало", config)
    
    {
      total_files: skp_file_paths.length,
      successful: successful.length,
      failed: failed.length,
      results: results
    }
  end
  
  # Метод для пошуку та витягування превью з директорії
  def extract_from_directory(directory_path, config = nil)
    config = Config.new if config.nil?
    
    log("🔍 Пошук .skp файлів в: #{directory_path}", config)
    
    # Рекурсивний пошук .skp файлів
    skp_files = Dir.glob(File.join(directory_path, "**/*.skp"))
    
    if skp_files.empty?
      log("❌ .skp файли не знайдено", config)
      return { total_files: 0, successful: 0, failed: 0, results: [] }
    end
    
    log("📋 Знайдено #{skp_files.length} .skp файлів", config)
    
    extract_multiple_previews(skp_files, config)
  end
  
  # Валідація вхідних даних
  private def validate_input(skp_file_path, config)
    return false unless skp_file_path.is_a?(String)
    return false unless File.exist?(skp_file_path)
    return false unless File.extname(skp_file_path).downcase == '.skp'
    return false unless File.file?(skp_file_path)
    return false unless File.size(skp_file_path) > 0
    
    true
  end
  
  # Генерація шляху для виводу
  private def generate_output_path(skp_file_path, config)
    filename = File.basename(skp_file_path, '.skp')
    File.join(config.output_dir, "#{filename}_#{config.output_size}x#{config.output_size}.#{config.output_format}")
  end
  
  # Очищення тимчасово завантаженого компонента
  private def cleanup_loaded_definition(definition, definitions, config)
    return unless definition
    
    begin
      # Видаляємо всі екземпляри компонента
      definition.instances.each(&:erase!) if definition.instances.any?
      
      # Видаляємо визначення з колекції
      definitions.remove(definition) if definitions.include?(definition)
      
      log("  🧹 Компонент очищено з пам'яті", config)
    rescue => e
      log("  ⚠️ Помилка очищення: #{e.message}", config)
    end
  end
  
  # Обробка помилок
  private def handle_error(message, config)
    case config.error_handling
    when :raise
      raise StandardError, message
    when :return_nil
      log("❌ #{message}", config)
      nil
    when :log_only
      log("❌ #{message}", config)
      { success: false, error: message }
    else
      log("❌ #{message}", config)
      { success: false, error: message }
    end
  end
  
  # Логування
  private def log(message, config)
    puts message if config.verbose_logging
  end
  
  # Тестування модуля
  def test_extraction(test_file_path = nil, config = nil)
    config = Config.new if config.nil?
    
    log("🧪 Тестування універсального екстрактора превью...", config)
    
    # Знаходимо тестовий файл
    unless test_file_path
      test_file_path = Dir.glob("**/*.skp").first
    end
    
    if test_file_path && File.exist?(test_file_path)
      log("📁 Тестовий файл: #{File.basename(test_file_path)}", config)
      
      result = extract_preview(test_file_path, config)
      
      if result && result[:success]
        log("✅ Тест успішний: #{File.basename(result[:output_path])}", config)
        return result
      else
        log("❌ Тест невдалий", config)
        return result
      end
    else
      log("❌ Не знайдено тестовий .skp файл", config)
      return { success: false, error: "Тестовий файл не знайдено" }
    end
  end
end

# Аліас для зручності
SkpPreviewExtractor = UniversalSkpPreviewExtractor
