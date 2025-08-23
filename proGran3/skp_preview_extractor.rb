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
  end
end

