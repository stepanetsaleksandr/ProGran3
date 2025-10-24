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
      
      # Універсальне витягування превью - без логування
      
      # Використовуємо основний метод
      result = extract_preview_from_skp(skp_file_path, size)
      
      if result
        # Превью створено - без логування
        return result
      else
        puts "❌ Помилка створення превью для: #{component_path}"
        return nil
      end
    end
    
    # Основний метод витягування превью
    def extract_preview_from_skp(skp_file_path, output_size = 256)
      # Витягування превью - без логування
      
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
        # ПОВНІСТЮ ВІДМОВЛЯЄМОСЬ ВІД ОЧИЩЕННЯ!
        # Це запобігає видаленню існуючих компонентів
        # SketchUp сам очистить пам'ять при необхідності
        
        puts "  🧹 Компонент залишається в пам'яті (захист існуючих екземплярів)"
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
    
    # Генерація превью поточної моделі
    def generate_current_model_preview(size = 512, quality = 'medium')
      puts "🎨 Генерація превью поточної моделі"
      puts "📐 Параметри: розмір=#{size}, якість=#{quality}"
      
      begin
        puts "🔍 Перевіряємо активну модель..."
        model = Sketchup.active_model
        if model.nil?
          puts "❌ Активна модель не знайдена"
          return nil
        end
        puts "✅ Активна модель знайдена"

        # Перевіряємо чи є щось в моделі
        puts "🔍 Перевіряємо вміст моделі..."
        if model.entities.length == 0
          puts "❌ Модель порожня"
          return nil
        end
        puts "✅ Модель містить #{model.entities.length} елементів"

        # Налаштування для рендерингу
        size = size.to_i
        size = [64, size, 2048].sort[1] # Обмежуємо розмір від 64 до 2048 пікселів
        puts "📏 Фінальний розмір: #{size}x#{size}"

        # Створюємо тимчасовий файл для збереження зображення
        puts "📁 Створюємо тимчасовий файл..."
        temp_dir = File.join(Dir.tmpdir, "progran3_previews")
        Dir.mkdir(temp_dir) unless Dir.exist?(temp_dir)
        
        timestamp = Time.now.strftime("%Y%m%d_%H%M%S")
        temp_file = File.join(temp_dir, "model_preview_#{timestamp}.png")
        puts "📄 Шлях до тимчасового файлу: #{temp_file}"

        # Налаштування рендерингу
        puts "🔍 Перевіряємо активний вид..."
        view = model.active_view
        if view.nil?
          puts "❌ Активний вид не знайдено"
          return nil
        end
        puts "✅ Активний вид знайдено"

        # Налаштовуємо оптимальний вид для превью
        puts "🎯 Налаштування виду для превью..."
        
        # Зберігаємо поточний стан виду
        original_camera = view.camera
        original_eye = original_camera.eye
        original_target = original_camera.target
        original_up = original_camera.up
        
        begin
          # Встановлюємо ізометричний вид
          puts "📐 Встановлення ізометричного виду..."
          view.camera = Sketchup::Camera.new([100, 100, 100], [0, 0, 0], [0, 0, 1])
          
          # Оновлюємо вид
          view.refresh
          
          # Zoom to extents (показуємо всю модель)
          puts "🔍 Масштабування до всієї моделі..."
          view.zoom_extents
          
          # Додаткова затримка для завершення оновлення виду
          sleep(0.1)
          
          puts "✅ Вид налаштовано для превью"
          
        rescue => view_error
          puts "⚠️ Помилка налаштування виду: #{view_error.message}"
          # Продовжуємо з поточним видом
        end

        # Генеруємо зображення без складних налаштувань
        puts "📸 Генерація зображення розміром #{size}x#{size}"
        
        # Використовуємо write_image для створення превью
        # Параметри: filename, width, height, antialias, compression
        success = view.write_image(temp_file, size, size, true, 0.9)
        
        if success && File.exist?(temp_file) && File.size(temp_file) > 0
          puts "✅ Превью успішно згенеровано"
          puts "📏 Розмір файлу: #{File.size(temp_file)} байт"
          
          # Читаємо файл і конвертуємо в base64
          require 'base64'
          image_data = File.binread(temp_file)
          base64_data = Base64.strict_encode64(image_data)
          data_url = "data:image/png;base64,#{base64_data}"
          
          # Розмір зображення - без логування
          
          # Видаляємо тимчасовий файл
          File.delete(temp_file) if File.exist?(temp_file)
          
          return data_url
        else
          puts "❌ Не вдалося згенерувати зображення"
          puts "Файл існує: #{File.exist?(temp_file)}, розмір: #{File.exist?(temp_file) ? File.size(temp_file) : 'N/A'}"
          return nil
        end

      rescue => e
        puts "❌ Помилка генерації превью: #{e.message}"
        puts "Stack trace: #{e.backtrace.join("\n")}"
        return nil
      ensure
        # Відновлюємо початковий вид
        begin
          puts "🔄 Відновлення початкового виду..."
          view.camera = original_camera
          view.refresh
          puts "✅ Початковий вид відновлено"
        rescue => restore_error
          puts "⚠️ Помилка відновлення виду: #{restore_error.message}"
        end
        
        puts "🏁 Завершення генерації превью"
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

