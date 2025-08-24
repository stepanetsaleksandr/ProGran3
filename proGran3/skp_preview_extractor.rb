# proGran3/skp_preview_extractor.rb
# Модуль для витягування превью з .skp файлів через SketchUp API

require 'fileutils'

module ProGran3
  module SkpPreviewExtractor
    extend self
    
    # Шлях до папки з превью
    PREVIEW_PATH = File.join(File.dirname(__FILE__), '..', 'previews')
    
    # Створюємо папку для превью якщо її немає
    Dir.mkdir(PREVIEW_PATH) unless Dir.exist?(PREVIEW_PATH)
    
    # Універсальний метод для всіх категорій
    def extract_preview(component_path, size = 256)
      # Розбираємо шлях компонента (наприклад: "steles/stele_100x50x8.skp")
      category, filename = component_path.split('/')
      
      # Формуємо повний шлях до .skp файла
      skp_file_path = File.join(File.dirname(__FILE__), 'assets', category, filename)
      
      puts "🔄 Універсальне витягування превью: #{component_path}"
      
      # Використовуємо основний метод
      result = extract_preview_from_skp(skp_file_path, size)
      
      if result
        puts "✅ Превью створено: #{File.basename(result)}"
        return result
      else
        puts "❌ Помилка створення превью для: #{component_path}"
        return nil
      end
    end
    
    # Основний метод витягування превью
    def extract_preview_from_skp(skp_file_path, output_size = 256)
      puts "🔄 Витягування превью з: #{File.basename(skp_file_path)}"
      
      begin
        # Завантажуємо компонент через model.definitions.load
        model = Sketchup.active_model
        definitions = model.definitions
        
        definition = definitions.load(skp_file_path)
        
        if definition && definition.respond_to?(:save_thumbnail)
          # Генеруємо шлях для збереження
          output_path = generate_preview_path(skp_file_path, output_size)
          
          # Зберігаємо вбудоване превью
          success = definition.save_thumbnail(output_path)
          
          if success && File.exist?(output_path) && File.size(output_path) > 0
            puts "  ✅ Превью витягнуто: #{File.basename(output_path)}"
            puts "  📏 Розмір: #{File.size(output_path)} байт"
            
            # Очищаємо тимчасово завантажений компонент
            cleanup_loaded_definition(definition, definitions)
            
            return output_path
          else
            puts "  ❌ Помилка збереження превью"
          end
        else
          puts "  ❌ Компонент не завантажено або save_thumbnail недоступний"
        end
        
        # Очищаємо в разі помилки
        cleanup_loaded_definition(definition, definitions) if definition
        
        nil
        
      rescue => e
        puts "  ❌ Помилка витягування: #{e.message}"
        nil
      end
    end
    
    # Очищення тимчасово завантаженого компонента
    def cleanup_loaded_definition(definition, definitions)
      return unless definition
      
      begin
        # Видаляємо всі екземпляри компонента
        definition.instances.each(&:erase!) if definition.instances.any?
        
        # Видаляємо визначення з колекції
        definitions.remove(definition) if definitions.include?(definition)
        
        puts "  🧹 Компонент очищено з пам'яті"
      rescue => e
        puts "  ⚠️ Помилка очищення: #{e.message}"
      end
    end
    
    # Генерація шляху для превью
    def generate_preview_path(skp_file_path, size)
      filename = File.basename(skp_file_path, '.skp')
      File.join(PREVIEW_PATH, "#{filename}_#{size}x#{size}.png")
    end
    
    # Метод для отримання base64 даних превью
    def get_preview_base64(component_path, size = 256)
      preview_path = extract_preview(component_path, size)
      
      if preview_path && File.exist?(preview_path)
        begin
          require 'base64'
          image_data = File.read(preview_path, mode: 'rb')
          base64_data = Base64.strict_encode64(image_data)
          return "data:image/png;base64,#{base64_data}"
        rescue => e
          puts "❌ Помилка конвертації в base64: #{e.message}"
          return nil
        end
      end
      
      nil
    end
    
    # Тестування методу
    def test_extraction
      puts "🧪 Тестування витягування превью..."
      
      # Знаходимо тестовий файл
      test_file = Dir.glob("proGran3/assets/**/*.skp").first
      
      if test_file
        puts "📁 Тестовий файл: #{File.basename(test_file)}"
        
        result = extract_preview_from_skp(test_file, 256)
        
        if result
          puts "✅ Тест успішний: #{File.basename(result)}"
        else
          puts "❌ Тест невдалий"
        end
      else
        puts "❌ Не знайдено тестовий .skp файл"
      end
    end
    
    # Тестування універсального методу
    def test_universal_extraction
      puts "🧪 Тестування універсального витягування..."
      
      # Тестуємо з різними категоріями
      test_cases = [
        "steles/stele_100x50x8.skp",
        "stands/stand_50x20x15.skp",
        "flowerbeds/flowerbed_100x50x10.skp"
      ]
      
      test_cases.each do |component_path|
        puts "📁 Тестуємо: #{component_path}"
        result = extract_preview(component_path, 256)
        
        if result
          puts "✅ Успішно: #{File.basename(result)}"
        else
          puts "❌ Невдало"
        end
      end
    end
  end
end

