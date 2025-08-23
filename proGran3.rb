# progran3.rb
require 'sketchup.rb'

module ProGran3
  # Підключаємо модулі в правильному порядку
  require_relative 'progran3/loader'
  require_relative 'progran3/builders/foundation_builder'
  require_relative 'progran3/builders/tiling_builder'
  require_relative 'progran3/builders/cladding_builder'
  require_relative 'progran3/ui'
  require_relative 'progran3/test_features'
  require_relative 'progran3/preview_generator'
  require_relative 'progran3/skp_preview_generator'
  require_relative 'progran3/skp_preview_extractor'

  # Метод для створення панелі інструментів
  def self.create_toolbar
    begin
      # Створюємо панель інструментів
      toolbar = ::UI::Toolbar.new("ProGran3")
      
      # Команда для запуску плагіна
      cmd = ::UI::Command.new("ProGran3 Конструктор") {
        begin
          ProGran3::UI.show_dialog
        rescue => e
          puts "❌ Помилка запуску UI: #{e.message}"
          ::UI.messagebox("Помилка запуску ProGran3: #{e.message}")
        end
      }
      
      # Встановлюємо іконки
      icon_path = "proGran3/icons/icon_24.png"
      if File.exist?(File.join(File.dirname(__FILE__), icon_path))
        cmd.small_icon = icon_path
        cmd.large_icon = icon_path
      else
        puts "⚠️ Іконка не знайдена: #{icon_path}"
      end
      
      cmd.tooltip = "ProGran3 Конструктор - Створення конструкцій"
      
      # Додаємо команду до панелі
      toolbar.add_item(cmd)
      
      # Показуємо панель
      toolbar.show
      
      puts "✅ Панель інструментів ProGran3 створена"
    rescue => e
      puts "❌ Помилка створення панелі інструментів: #{e.message}"
    end
  end

  # Додаємо пункт у меню Plugins
  unless file_loaded?(__FILE__)
    # Меню Plugins
    ::UI.menu("Plugins").add_item("proGran3 Конструктор") {
      ProGran3::UI.show_dialog
    }
    
    # Створюємо панель інструментів
    create_toolbar
    file_loaded(__FILE__)
  end

  # Метод для перезавантаження плагіна
  def self.reload
    puts "🔄 Перезавантаження плагіна ProGran3..."
    
    # Очищаємо завантажені файли
    $LOADED_FEATURES.delete_if { |file| file.include?('progran3') }
    
    # Перезавантажуємо тільки наші файли
    plugin_dir = File.dirname(__FILE__)
    our_files = [
      File.join(plugin_dir, 'proGran3.rb'),
      File.join(plugin_dir, 'proGran3', 'loader.rb'),
      File.join(plugin_dir, 'proGran3', 'ui.rb'),
      File.join(plugin_dir, 'proGran3', 'builders', 'foundation_builder.rb'),
      File.join(plugin_dir, 'proGran3', 'builders', 'tiling_builder.rb'),
      File.join(plugin_dir, 'proGran3', 'builders', 'cladding_builder.rb'),
      File.join(plugin_dir, 'proGran3', 'skp_preview_generator.rb'),
      File.join(plugin_dir, 'proGran3', 'skp_preview_extractor.rb')
    ]
    
    our_files.each do |file|
      if File.exist?(file)
        begin
          load file
          puts "  ✅ #{File.basename(file)}"
        rescue => e
          puts "  ❌ #{File.basename(file)}: #{e.message}"
        end
      end
    end
    
    puts "🎉 Плагін перезавантажено!"
  end
  
  # Метод для швидкого тестування
  def self.test
    puts "🧪 Тестування плагіна ProGran3..."
    puts "📁 Шлях до плагіна: #{File.dirname(__FILE__)}"
    puts "📦 Версія: 1.0.0"
    puts "✅ Плагін готовий до роботи!"
    
    # Тестуємо нову логіку превью
    puts "\n🔄 Тестування нової логіки превью..."
    if defined?(SkpPreviewGenerator)
      puts "✅ Новий модуль превью завантажено"
      test_result = test_skp_preview_generator
      if test_result
        puts "✅ Тест нової логіки успішний"
      else
        puts "❌ Тест нової логіки не вдався"
      end
    else
      puts "❌ Новий модуль превью не знайдено"
    end
  end

  # Методи для тестування нових функцій

  # Методи для роботи з превью (стара логіка)
  def self.generate_preview_image(component_path)
    PreviewGenerator.generate_preview_image(component_path)
  end

  def self.generate_web_preview(component_path)
    PreviewGenerator.generate_web_preview(component_path)
  end

  def self.ensure_preview_exists(component_path)
    PreviewGenerator.ensure_preview_exists(component_path)
  end

  # Нові методи для роботи з .skp файлами
  def self.generate_skp_preview(skp_file_path)
    SkpPreviewGenerator.generate_preview_from_skp(skp_file_path)
  end

  def self.generate_all_skp_previews
    SkpPreviewGenerator.generate_all_skp_previews
  end

  def self.test_skp_preview_generator
    SkpPreviewGenerator.test_skp_preview_generator
  end

      # Метод для витягування превью з .skp файлів
    def self.extract_skp_preview(skp_file_path, size = 256)
      SkpPreviewExtractor.extract_preview_from_skp(skp_file_path, size)
    end

    def self.test_skp_preview_extractor
      SkpPreviewExtractor.test_extraction
    end
end