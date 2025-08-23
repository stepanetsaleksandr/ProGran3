# proGran3/preview_generator.rb
# Модуль для автоматичної генерації 3D превью та зображень компонентів

require 'sketchup.rb'

module ProGran3
  module PreviewGenerator
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

    # Генерація превью зображення компонента
    def generate_preview_image(component_path, size = 256)
      ensure_preview_directory
      
      begin
        model = Sketchup.active_model
        
        # Завантажуємо компонент
        full_path = File.join(ProGran3::ASSETS_PATH, component_path)
        comp_def = model.definitions.load(full_path)
        
        # Створюємо тимчасовий екземпляр
        temp_instance = model.active_entities.add_instance(comp_def, Geom::Transformation.new)
        
        # Налаштовуємо камеру для превью
        setup_preview_camera(temp_instance)
        
        # Генеруємо зображення
        image_path = get_preview_image_path(component_path)
        success = export_preview_image(image_path, size)
        
        # Видаляємо тимчасовий екземпляр
        temp_instance.erase!
        
        # Спробуємо різні варіанти purge функції
        begin
          if model.respond_to?(:purge_unused)
            model.purge_unused
            puts "🧹 Модель очищена (purge_unused)"
          elsif model.respond_to?(:purge_all)
            model.purge_all
            puts "🧹 Модель очищена (purge_all)"
          elsif model.definitions.respond_to?(:purge_unused)
            model.definitions.purge_unused
            puts "🧹 Компоненти очищені (definitions.purge_unused)"
          else
            puts "🧹 Тимчасовий екземпляр видалено (purge недоступний)"
          end
        rescue => e
          puts "⚠️ Не вдалося очистити модель: #{e.message}"
          puts "🧹 Тимчасовий екземпляр видалено"
        end
        
        if success
          puts "✅ Превью зображення створено: #{File.basename(image_path)}"
          image_path
        else
          puts "❌ Помилка створення превью зображення"
          nil
        end
        
      rescue => e
        puts "❌ Помилка генерації превью: #{e.message}"
        nil
      end
    end

    # Генерація превью як base64 для веб-інтерфейсу
    def generate_web_preview(component_path, size = 256)
      begin
        model = Sketchup.active_model
        
        # Завантажуємо компонент
        full_path = File.join(ProGran3::ASSETS_PATH, component_path)
        comp_def = model.definitions.load(full_path)
        
        # Створюємо тимчасовий екземпляр
        temp_instance = model.active_entities.add_instance(comp_def, Geom::Transformation.new)
        
        # Налаштовуємо камеру для превью
        setup_preview_camera(temp_instance)
        
        # Невелика затримка для рендерингу
        sleep(0.1)
        
        # Створюємо тимчасовий файл
        temp_path = File.join(Dir.tmpdir, "temp_preview_#{Time.now.to_i}.png")
        
        # Експортуємо зображення
        success = export_preview_image(temp_path, size)
        
        # Видаляємо тимчасовий екземпляр
        temp_instance.erase!
        
        # Спробуємо різні варіанти purge функції
        begin
          if model.respond_to?(:purge_unused)
            model.purge_unused
            puts "🧹 Модель очищена (purge_unused)"
          elsif model.respond_to?(:purge_all)
            model.purge_all
            puts "🧹 Модель очищена (purge_all)"
          elsif model.definitions.respond_to?(:purge_unused)
            model.definitions.purge_unused
            puts "🧹 Компоненти очищені (definitions.purge_unused)"
          else
            puts "🧹 Тимчасовий екземпляр видалено (purge недоступний)"
          end
        rescue => e
          puts "⚠️ Не вдалося очистити модель: #{e.message}"
          puts "🧹 Тимчасовий екземпляр видалено"
        end
        
        if success && File.exist?(temp_path)
          # Перевіряємо розмір файлу
          file_size = File.size(temp_path)
          puts "📏 Розмір згенерованого файлу: #{file_size} байт"
          
          if file_size > 100  # Мінімальний розмір для PNG
            # Читаємо файл та конвертуємо в base64
            image_data = File.read(temp_path, mode: 'rb')  # Бінарний режим
            require 'base64'
            base64_data = Base64.strict_encode64(image_data)
            
            # Видаляємо тимчасовий файл
            File.delete(temp_path)
            
            puts "✅ Веб-превью згенеровано для: #{component_path}"
            puts "📊 Розмір бінарних даних: #{image_data.length} байт"
            puts "📊 Base64 довжина: #{base64_data.length}"
            "data:image/png;base64,#{base64_data}"
          else
            puts "❌ Згенерований файл занадто малий: #{file_size} байт"
            File.delete(temp_path) if File.exist?(temp_path)
            nil
          end
        else
          puts "❌ Помилка створення веб-превью для: #{component_path}"
          puts "   Успіх експорту: #{success}"
          puts "   Файл існує: #{File.exist?(temp_path)}"
          nil
        end
        
      rescue => e
        puts "❌ Помилка генерації веб-превью: #{e.message}"
        puts "   Компонент: #{component_path}"
        puts "   Повний шлях: #{File.join(ProGran3::ASSETS_PATH, component_path)}"
        nil
      end
    end

    # Налаштування камери для превью
    def setup_preview_camera(instance)
      view = Sketchup.active_model.active_view
      model = Sketchup.active_model
      
      # Налаштовуємо прозорий фон для експорту
      setup_transparent_background(model, view)
      
      # Отримуємо межі компонента
      bounds = instance.bounds
      center = bounds.center
      
      # Розраховуємо відстань до камери
      diagonal = bounds.diagonal
      distance = diagonal * 2
      
      # Встановлюємо позицію камери для чистої ізометрії
      # Конвертуємо градуси в радіани
      angle_x_rad = 35.264 * Math::PI / 180  # Нахил 35.264° по X (арктангенс 1/√2)
      angle_y_rad = 45 * Math::PI / 180      # Обертання 45° по Y
      angle_z_rad = 0 * Math::PI / 180       # Нульовий кут по Z
      
      # Базовий вектор камери (ізометричний кут)
      base_eye = Geom::Vector3d.new(distance, distance, distance)
      
      # Повертаємо вектор навколо осі Z (без обертання для класичної ізометрії)
      rotation_z = Geom::Transformation.rotation(ORIGIN, Z_AXIS, angle_z_rad)
      eye_after_z = rotation_z * base_eye
      
      # Повертаємо вектор навколо осі Y на 0 градусів
      rotation_y = Geom::Transformation.rotation(ORIGIN, Y_AXIS, angle_y_rad)
      eye_after_y = rotation_y * eye_after_z
      
             # Повертаємо вектор навколо осі X на 35.264 градусів (ізометричний нахил)
      rotation_x = Geom::Transformation.rotation(ORIGIN, X_AXIS, angle_x_rad)
      rotated_eye = rotation_x * eye_after_y
      
      # Встановлюємо позицію камери
      eye = center + rotated_eye
      target = center
      up = Geom::Vector3d.new(0, 0, 1)
      
      # Створюємо перетворення камери
      camera = Sketchup::Camera.new(eye, target, up)
      view.camera = camera
      
      # Налаштовуємо zoom до компонента
      view.zoom(instance)
      
             puts "📐 Камера налаштована (ізометрія: 35.264° по X, 45° по Y, 0° по Z з прозорим фоном)"
    end

    # Налаштування прозорого фону (спрощена версія)
    def setup_transparent_background(model, view)
      begin
        # Налаштовуємо параметри відображення для прозорості
        rendering_options = model.rendering_options
        
        # Спробуємо тільки базові налаштування
        rendering_options["DrawHorizon"] = false if rendering_options.keys.include?("DrawHorizon")
        rendering_options["DrawGround"] = false if rendering_options.keys.include?("DrawGround")
        rendering_options["DrawSky"] = false if rendering_options.keys.include?("DrawSky")
        
        puts "🎨 Налаштовано простий фон"
      rescue => e
        puts "⚠️ Не вдалося налаштувати фон: #{e.message}"
        puts "🔄 Продовжуємо без спеціальних налаштувань фону"
      end
    end

    # Експорт превью зображення
    def export_preview_image(image_path, size)
      view = Sketchup.active_model.active_view
      
      # Експортуємо зображення через view.write_image з прозорістю
      begin
        puts "📸 Спроба експорту в: #{image_path}"
        puts "📏 Розмір: #{size}x#{size}"
        
        # Налаштування для прозорого фону
        options = {
          filename: image_path,
          width: size,
          height: size,
          antialias: true,
          compression: 0.9,
          transparent: true
        }
        
        puts "🎨 Експорт з прозорим фоном"
        success = view.write_image(options)
        
        puts "📸 Експорт зображення: #{success ? 'успішно' : 'неуспішно'}"
        return success
      rescue => e
        puts "❌ Помилка експорту зображення: #{e.message}"
        puts "🔄 Спроба з базовими параметрами"
        
        # Резервний спосіб без options hash
        begin
          success = view.write_image(image_path, size, size, true, 0.9)
          puts "📸 Резервний експорт: #{success ? 'успішно' : 'неуспішно'}"
          return success
        rescue => e2
          puts "❌ Резервний експорт не вдався: #{e2.message}"
          return false
        end
      end
    end

    # Отримання шляху до превью зображення
    def get_preview_image_path(component_path)
      component_name = File.basename(component_path, '.skp')
      File.join(PREVIEW_PATH, "#{component_name}_preview.png")
    end

    # Генерація превью для всіх компонентів категорії
    def generate_category_previews(category)
      components = Dir.glob(File.join(ProGran3::ASSETS_PATH, category, "*.skp"))
      
      puts "🔄 Генерація превью для категорії: #{category}"
      puts "📁 Знайдено #{components.length} компонентів"
      
      generated_count = 0
      
      components.each do |component_path|
        if generate_preview_image(component_path)
          generated_count += 1
        end
      end
      
      puts "✅ Згенеровано #{generated_count} з #{components.length} превью"
      generated_count
    end

    # Генерація превью для всіх компонентів
    def generate_all_previews
      categories = ["stands", "steles", "flowerbeds", "gravestones", "pavement_tiles"]
      total_generated = 0
      
      puts "🔄 Генерація превью для всіх компонентів..."
      
      categories.each do |category|
        total_generated += generate_category_previews(category)
      end
      
      puts "🎉 Загалом згенеровано #{total_generated} превью"
      total_generated
    end

    # Отримання шляху до превью зображення (якщо існує)
    def get_existing_preview_path(component_path)
      image_path = get_preview_image_path(component_path)
      File.exist?(image_path) ? image_path : nil
    end

    # Перевірка чи потрібно генерувати превью
    def needs_preview_generation?(component_path)
      image_path = get_preview_image_path(component_path)
      !File.exist?(image_path)
    end

    # Автоматична генерація превью при потребі
    def ensure_preview_exists(component_path)
      if needs_preview_generation?(component_path)
        generate_preview_image(component_path)
      else
        get_preview_image_path(component_path)
      end
    end
  end
end
