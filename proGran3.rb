# progran3.rb
require 'sketchup.rb'

module ProGran3
  # Підключаємо нові системні модулі першими
  require_relative 'progran3/constants'
  require_relative 'progran3/logger'
  require_relative 'progran3/error_handler'
  require_relative 'progran3/validation'
  
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
        File.join(plugin_dir, 'proGran3', 'loader.rb'),
        File.join(plugin_dir, 'proGran3', 'ui.rb'),
        File.join(plugin_dir, 'proGran3', 'builders', 'foundation_builder.rb'),
        File.join(plugin_dir, 'proGran3', 'builders', 'tiling_builder.rb'),
        File.join(plugin_dir, 'proGran3', 'builders', 'cladding_builder.rb'),
        File.join(plugin_dir, 'proGran3', 'builders', 'blind_area_builder.rb'),
        File.join(plugin_dir, 'proGran3', 'skp_preview_extractor.rb')
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
  
  # Метод для швидкого тестування
  def self.test
    Logger.info("Тестування плагіна ProGran3", "Test")
    Logger.info("Шлях до плагіна: #{File.dirname(__FILE__)}", "Test")
    Logger.info("Версія: #{Constants::VERSION}", "Test")
    
    # Тестуємо систему валідації
    Validation.test
    
    Logger.success("Плагін готовий до роботи!", "Test")
  end

  # Універсальний метод для витягування превью з .skp файлів
  def self.extract_skp_preview(component_path, size = 256)
    SkpPreviewExtractor.extract_preview(component_path, size)
  end
  
  # Метод для отримання base64 даних превью
  def self.get_preview_base64(component_path, size = 256)
    SkpPreviewExtractor.get_preview_base64(component_path, size)
  end

  def self.test_skp_preview_extractor
    SkpPreviewExtractor.test_extraction
  end
  
  def self.test_universal_extraction
    SkpPreviewExtractor.test_universal_extraction
  end
  
  # Метод для тестування системи валідації
  def self.test_validation
    Validation.test
  end
end