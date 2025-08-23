# proGran3/skp_preview_generator.rb
# Модуль для створення превью безпосередньо з .skp файлів
# Використовує API SketchUp 2024 для роботи з файлами

require 'sketchup.rb'

module ProGran3
  module SkpPreviewGenerator
    extend self

    # Шлях до папки з превью
    PREVIEW_PATH = File.join(File.dirname(__FILE__), 'previews')
    
    # Константи для геометрії
    ORIGIN = Geom::Point3d.new(0, 0, 0)
    X_AXIS = Geom::Vector3d.new(1, 0, 0)
    Y_AXIS = Geom::Vector3d.new(0, 1, 0)
    Z_AXIS = Geom::Vector3d.new(0, 0, 1)

    # Створення папки для превью
    def ensure_preview_directory
      Dir.mkdir(PREVIEW_PATH) unless Dir.exist?(PREVIEW_PATH)
    end

    # Основний метод для створення превью з .skp файлу
    def generate_preview_from_skp(skp_file_path, size = 256)
      ensure_preview_directory
      
      begin
        puts "🔄 Генерація превью з .skp файлу: #{File.basename(skp_file_path)}"
        
        # Перевіряємо чи існує файл
        unless File.exist?(skp_file_path)
          puts "❌ Файл не знайдено: #{skp_file_path}"
          return nil
        end

        # Створюємо тимчасову модель для роботи
        temp_model = create_temp_model_from_skp(skp_file_path)
        return nil unless temp_model

        # Налаштовуємо камеру для превью
        setup_preview_camera_for_model(temp_model)
        
        # Генеруємо зображення
        image_path = get_preview_image_path(skp_file_path)
        success = export_preview_image_from_model(temp_model, image_path, size)
        
        # Закриваємо тимчасову модель
        close_temp_model(temp_model)
        
        if success
          puts "✅ Превью створено: #{File.basename(image_path)}"
          image_path
        else
          puts "❌ Помилка створення превью"
          nil
        end
        
      rescue => e
        puts "❌ Помилка генерації превью з .skp: #{e.message}"
        puts "   Файл: #{skp_file_path}"
        nil
      end
    end

    # Робота з .skp файлом в поточній моделі
    def create_temp_model_from_skp(skp_file_path)
      begin
        # Отримуємо поточну модель
        model = Sketchup.active_model
        
        # Завантажуємо .skp файл як компонент
        full_path = File.expand_path(skp_file_path)
        puts "📁 Завантаження файлу: #{full_path}"
        
        # Спробуємо завантажити як компонент
        begin
          comp_def = model.definitions.load(full_path)
          puts "✅ Компонент завантажено: #{comp_def.name}"
          
          # Створюємо тимчасовий екземпляр компонента
          @temp_instance = model.active_entities.add_instance(comp_def, Geom::Transformation.new)
          puts "✅ Тимчасовий екземпляр створено"
          
          return model
          
        rescue => e
          puts "❌ Не вдалося завантажити як компонент: #{e.message}"
          return nil
        end
        
      rescue => e
        puts "❌ Помилка роботи з .skp файлом: #{e.message}"
        nil
      end
    end

    # Налаштування камери для превью моделі
    def setup_preview_camera_for_model(model)
      begin
        view = model.active_view
        
        # Отримуємо всі об'єкти в моделі
        entities = model.active_entities
        
        # Знаходимо перший компонент або групу
        target_entity = find_main_entity(entities)
        
        if target_entity
          # Налаштовуємо камеру на об'єкт
          setup_camera_on_entity(view, target_entity)
        else
          # Налаштовуємо стандартну ізометричну камеру
          setup_default_isometric_camera(view)
        end
        
        # Налаштовуємо прозорий фон
        setup_transparent_background(model, view)
        
        puts "📐 Камера налаштована для превью"
        
      rescue => e
        puts "⚠️ Помилка налаштування камери: #{e.message}"
      end
    end

    # Пошук головного об'єкта в моделі
    def find_main_entity(entities)
      # Якщо є тимчасовий екземпляр, використовуємо його
      if @temp_instance && @temp_instance.valid?
        return @temp_instance
      end
      
      # Спочатку шукаємо компоненти
      entities.each do |entity|
        if entity.is_a?(Sketchup::ComponentInstance)
          return entity
        elsif entity.is_a?(Sketchup::Group)
          return entity
        end
      end
      
      # Якщо не знайшли, шукаємо в підоб'єктах
      entities.each do |entity|
        if entity.respond_to?(:entities)
          sub_entity = find_main_entity(entity.entities)
          return sub_entity if sub_entity
        end
      end
      
      nil
    end

    # Налаштування камери на конкретний об'єкт
    def setup_camera_on_entity(view, entity)
      begin
        # Отримуємо межі об'єкта
        bounds = entity.bounds
        center = bounds.center
        
        # Розраховуємо відстань до камери
        diagonal = bounds.diagonal
        distance = diagonal * 2.5
        
        # Встановлюємо ізометричну позицію камери
        angle_x_rad = 35.264 * Math::PI / 180  # Нахил 35.264°
        angle_y_rad = 45 * Math::PI / 180      # Обертання 45°
        
        # Базовий вектор камери
        base_eye = Geom::Vector3d.new(distance, distance, distance)
        
        # Повертаємо вектор для ізометрії
        rotation_y = Geom::Transformation.rotation(ORIGIN, Y_AXIS, angle_y_rad)
        eye_after_y = rotation_y * base_eye
        
        rotation_x = Geom::Transformation.rotation(ORIGIN, X_AXIS, angle_x_rad)
        rotated_eye = rotation_x * eye_after_y
        
        # Встановлюємо позицію камери
        eye = center + rotated_eye
        target = center
        up = Geom::Vector3d.new(0, 0, 1)
        
        # Створюємо камеру
        camera = Sketchup::Camera.new(eye, target, up)
        view.camera = camera
        
        # Налаштовуємо zoom
        view.zoom(entity)
        
        puts "📐 Камера налаштована на об'єкт"
        
      rescue => e
        puts "⚠️ Помилка налаштування камери на об'єкт: #{e.message}"
        setup_default_isometric_camera(view)
      end
    end

    # Налаштування стандартної ізометричної камери
    def setup_default_isometric_camera(view)
      begin
        # Стандартна ізометрична камера
        eye = Geom::Point3d.new(100, 100, 100)
        target = Geom::Point3d.new(0, 0, 0)
        up = Geom::Vector3d.new(0, 0, 1)
        
        camera = Sketchup::Camera.new(eye, target, up)
        view.camera = camera
        
        puts "📐 Встановлено стандартну ізометричну камеру"
        
      rescue => e
        puts "⚠️ Помилка встановлення стандартної камери: #{e.message}"
      end
    end

    # Налаштування прозорого фону
    def setup_transparent_background(model, view)
      begin
        rendering_options = model.rendering_options
        
        # Налаштування для прозорості
        rendering_options["DrawHorizon"] = false if rendering_options.keys.include?("DrawHorizon")
        rendering_options["DrawGround"] = false if rendering_options.keys.include?("DrawGround")
        rendering_options["DrawSky"] = false if rendering_options.keys.include?("DrawSky")
        rendering_options["BackgroundColor"] = [255, 255, 255, 0] if rendering_options.keys.include?("BackgroundColor")
        
        puts "🎨 Налаштовано прозорий фон"
        
      rescue => e
        puts "⚠️ Не вдалося налаштувати фон: #{e.message}"
      end
    end

    # Експорт превью зображення з моделі
    def export_preview_image_from_model(model, image_path, size)
      begin
        view = model.active_view
        
        puts "📸 Експорт превью: #{File.basename(image_path)}"
        puts "📏 Розмір: #{size}x#{size}"
        
        # Налаштування для експорту
        options = {
          filename: image_path,
          width: size,
          height: size,
          antialias: true,
          compression: 0.9,
          transparent: true
        }
        
        success = view.write_image(options)
        
        if success
          puts "✅ Експорт успішний"
          
          # Перевіряємо розмір файлу
          if File.exist?(image_path)
            file_size = File.size(image_path)
            puts "📏 Розмір файлу: #{file_size} байт"
            
            if file_size < 100
              puts "⚠️ Файл занадто малий, можливо помилка експорту"
              return false
            end
          end
          
          return true
        else
          puts "❌ Експорт не вдався"
          return false
        end
        
      rescue => e
        puts "❌ Помилка експорту: #{e.message}"
        false
      end
    end

    # Очищення тимчасового екземпляра
    def close_temp_model(model)
      begin
        # Видаляємо тимчасовий екземпляр
        if @temp_instance && @temp_instance.valid?
          @temp_instance.erase!
          puts "🔒 Тимчасовий екземпляр видалено"
        end
        
        # Очищаємо невикористані компоненти
        begin
          if model.respond_to?(:purge_unused)
            model.purge_unused
            puts "🧹 Модель очищена (purge_unused)"
          elsif model.definitions.respond_to?(:purge_unused)
            model.definitions.purge_unused
            puts "🧹 Компоненти очищені (definitions.purge_unused)"
          end
        rescue => e
          puts "⚠️ Не вдалося очистити модель: #{e.message}"
        end
        
        @temp_instance = nil
        
      rescue => e
        puts "⚠️ Помилка очищення: #{e.message}"
      end
    end

    # Отримання шляху до превью зображення
    def get_preview_image_path(skp_file_path)
      component_name = File.basename(skp_file_path, '.skp')
      File.join(PREVIEW_PATH, "#{component_name}_skp_preview.png")
    end

    # Генерація превью для всіх .skp файлів категорії
    def generate_category_skp_previews(category)
      skp_files = Dir.glob(File.join(ProGran3::ASSETS_PATH, category, "*.skp"))
      
      puts "🔄 Генерація превью з .skp файлів для категорії: #{category}"
      puts "📁 Знайдено #{skp_files.length} .skp файлів"
      
      generated_count = 0
      
      skp_files.each do |skp_file_path|
        if generate_preview_from_skp(skp_file_path)
          generated_count += 1
        end
      end
      
      puts "✅ Згенеровано #{generated_count} з #{skp_files.length} превью"
      generated_count
    end

    # Генерація превью для всіх .skp файлів
    def generate_all_skp_previews
      categories = ["stands", "steles", "flowerbeds", "gravestones", "pavement_tiles"]
      total_generated = 0
      
      puts "🔄 Генерація превью з .skp файлів для всіх компонентів..."
      
      categories.each do |category|
        total_generated += generate_category_skp_previews(category)
      end
      
      puts "🎉 Загалом згенеровано #{total_generated} превью з .skp файлів"
      total_generated
    end

    # Перевірка чи потрібно генерувати превью
    def needs_skp_preview_generation?(skp_file_path)
      image_path = get_preview_image_path(skp_file_path)
      !File.exist?(image_path)
    end

    # Автоматична генерація превью при потребі
    def ensure_skp_preview_exists(skp_file_path)
      if needs_skp_preview_generation?(skp_file_path)
        generate_preview_from_skp(skp_file_path)
      else
        get_preview_image_path(skp_file_path)
      end
    end

    # Метод для тестування генератора
    def test_skp_preview_generator
      puts "🧪 Тестування генератора превью з .skp файлів..."
      
      # Знаходимо перший .skp файл для тесту
      test_file = nil
      categories = ["stands", "steles", "flowerbeds", "gravestones", "pavement_tiles"]
      
      categories.each do |category|
        skp_files = Dir.glob(File.join(ProGran3::ASSETS_PATH, category, "*.skp"))
        if skp_files.any?
          test_file = skp_files.first
          break
        end
      end
      
      if test_file
        puts "🧪 Тестовий файл: #{File.basename(test_file)}"
        result = generate_preview_from_skp(test_file, 128)
        
        if result
          puts "✅ Тест успішний: #{File.basename(result)}"
        else
          puts "❌ Тест не вдався"
        end
        
        return result
      else
        puts "❌ Не знайдено .skp файлів для тестування"
        return nil
      end
    end
  end
end
