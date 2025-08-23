# progran3.rb
require 'sketchup.rb'

module ProGran3
  # Підключаємо модулі в правильному порядку
  require_relative 'progran3/loader'
  require_relative 'progran3/builders/foundation_builder'
  require_relative 'progran3/builders/tiling_builder'
  require_relative 'progran3/builders/cladding_builder'
  require_relative 'progran3/ui'

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
      File.join(plugin_dir, 'proGran3', 'builders', 'cladding_builder.rb')
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
  end
end