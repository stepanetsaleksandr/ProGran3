# progran3.rb
require 'sketchup.rb'

module ProGran3
  # Підключаємо нові системні модулі першими
  require_relative 'progran3/constants'
  require_relative 'progran3/logger'
  require_relative 'progran3/error_handler'
  require_relative 'progran3/validation'
  require_relative 'progran3/dimensions_manager'
  require_relative 'progran3/coordination_manager'
  require_relative 'progran3/callback_manager'
  
  # Підключаємо основні модулі
  require_relative 'progran3/loader'
  require_relative 'progran3/builders/foundation_builder'
  require_relative 'progran3/builders/tiling_builder'
  require_relative 'progran3/builders/cladding_builder'
  require_relative 'progran3/builders/blind_area_builder'
  require_relative 'progran3/ui'
  require_relative 'progran3/skp_preview_extractor'

  # Метод для створення панелі інструментів
  def self.create_toolbar
    ErrorHandler.safe_execute("Toolbar", "Створення панелі інструментів") do
      # Створюємо панель інструментів
      toolbar = ::UI::Toolbar.new("ProGran3")
      
      # Команда для запуску плагіна
      cmd = ::UI::Command.new("ProGran3 Конструктор") {
        ErrorHandler.safe_execute("UI", "Запуск діалогу") do
          ProGran3::UI.show_dialog
        end
      }
      
      # Встановлюємо іконки
      icon_path = File.join(Constants::ICONS_PATH, "icon_24.png")
      ErrorHandler.validate_file_exists(icon_path, "Toolbar")
      cmd.small_icon = icon_path
      cmd.large_icon = icon_path
      
      cmd.tooltip = "ProGran3 Конструктор - Створення конструкцій"
      
      # Додаємо команду до панелі
      toolbar.add_item(cmd)
      
      # Показуємо панель
      toolbar.show
      
      Logger.success("Панель інструментів ProGran3 створена", "Toolbar")
    end
  end

  # Додаємо пункт у меню Plugins
  unless file_loaded?(__FILE__)
    # Меню Plugins
    ::UI.menu("Plugins").add_item("proGran3 Конструктор") {
      ErrorHandler.safe_execute("Menu", "Запуск з меню") do
        ProGran3::UI.show_dialog
      end
    }
    
    # Створюємо панель інструментів
    create_toolbar
    file_loaded(__FILE__)
    
    Logger.info("Плагін ProGran3 завантажено", "Main")
  end

  # Метод для перезавантаження плагіна
  def self.reload
    Logger.start("Перезавантаження плагіна ProGran3", "Main")
    
    # Очищаємо завантажені файли
    $LOADED_FEATURES.delete_if { |file| file.include?('progran3') }
    
          # Перезавантажуємо тільки наші файли
      plugin_dir = File.dirname(__FILE__)
      our_files = [
        File.join(plugin_dir, 'proGran3.rb'),
        File.join(plugin_dir, 'proGran3', 'constants.rb'),
        File.join(plugin_dir, 'proGran3', 'logger.rb'),
        File.join(plugin_dir, 'proGran3', 'error_handler.rb'),
        File.join(plugin_dir, 'proGran3', 'validation.rb'),
        File.join(plugin_dir, 'proGran3', 'dimensions_manager.rb'),
        File.join(plugin_dir, 'proGran3', 'coordination_manager.rb'),
        File.join(plugin_dir, 'proGran3', 'callback_manager.rb'),
        File.join(plugin_dir, 'proGran3', 'loader.rb'),
        File.join(plugin_dir, 'proGran3', 'ui.rb'),
        File.join(plugin_dir, 'proGran3', 'builders', 'foundation_builder.rb'),
        File.join(plugin_dir, 'proGran3', 'builders', 'tiling_builder.rb'),
        File.join(plugin_dir, 'proGran3', 'builders', 'cladding_builder.rb'),
        File.join(plugin_dir, 'proGran3', 'builders', 'blind_area_builder.rb'),
        File.join(plugin_dir, 'proGran3', 'skp_preview_extractor.rb'),
        File.join(plugin_dir, 'proGran3', 'carousel', 'carousel_manager.rb'),
        File.join(plugin_dir, 'proGran3', 'carousel', 'carousel_ui.rb')
      ]
    
    our_files.each do |file|
      if File.exist?(file)
        ErrorHandler.safe_execute("Reload", "Завантаження #{File.basename(file)}") do
          load file
          Logger.success(File.basename(file), "Reload")
        end
      else
        Logger.warn("Файл не знайдено: #{File.basename(file)}", "Reload")
      end
    end
    
    Logger.finish("Перезавантаження плагіна ProGran3", "Main")
  end
  

  # Універсальний метод для витягування превью з .skp файлів
  def self.extract_skp_preview(component_path, size = 256)
    SkpPreviewExtractor.extract_preview(component_path, size)
  end
  
  # Метод для отримання base64 даних превью
  def self.get_preview_base64(component_path, size = 256)
    SkpPreviewExtractor.get_preview_base64(component_path, size)
  end

  # Метод для координації елементів
  def self.coordinate_elements
    CoordinationManager.update_all_elements
  end

  # Тестовий метод для генерації превью поточної моделі
  def self.test_model_preview
    Logger.info("🧪 Тестування генерації превью поточної моделі", "Main")
    
    begin
      # Тестуємо різні розміри та якості
      test_cases = [
        { size: 256, quality: 'low' },
        { size: 512, quality: 'medium' },
        { size: 1024, quality: 'high' }
      ]
      
      test_cases.each do |params|
        Logger.info("📐 Тестуємо: розмір=#{params[:size]}, якість=#{params[:quality]}", "Main")
        
        result = SkpPreviewExtractor.generate_current_model_preview(params[:size], params[:quality])
        
        if result
          Logger.success("✅ Тест успішний для #{params[:size]}x#{params[:size]} (#{params[:quality]})", "Main")
        else
          Logger.error("❌ Тест невдалий для #{params[:size]}x#{params[:size]} (#{params[:quality]})", "Main")
        end
      end
      
    rescue => e
      Logger.error("Помилка тестування превью: #{e.message}", "Main")
    end
  end

  # Простий тест генерації превью
  def self.test_simple_preview
    Logger.info("🧪 Простий тест генерації превью", "Main")
    
    begin
      result = SkpPreviewExtractor.generate_current_model_preview(256, 'low')
      
      if result
        Logger.success("✅ Простий тест успішний", "Main")
        Logger.info("📏 Довжина результату: #{result.length}", "Main")
      else
        Logger.error("❌ Простий тест невдалий", "Main")
      end
      
    rescue => e
      Logger.error("Помилка простого тесту: #{e.message}", "Main")
      Logger.error("Stack trace: #{e.backtrace.join("\n")}", "Main")
    end
  end

end