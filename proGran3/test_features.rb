# proGran3/test_features.rb
# Тестовий модуль для нових функцій ProGran3

require 'sketchup.rb'

module ProGran3
  module TestFeatures
    extend self

    # Константа для тестового блоку
    TEST_BLOCK_NAME = "ProGran3_TestBlock"

    # Створення тестового блоку
    def create_test_block
      model = Sketchup.active_model
      entities = model.active_entities
      
      # Видаляємо старий тестовий блок якщо він є
      remove_test_block
      
      # Створюємо новий тестовий блок
      test_group = entities.add_group
      test_group.name = TEST_BLOCK_NAME
      
      # Додаємо базову платформу
      points = [
        Geom::Point3d.new(0, 0, 0),
        Geom::Point3d.new(1000.mm, 0, 0),
        Geom::Point3d.new(1000.mm, 1000.mm, 0),
        Geom::Point3d.new(0, 1000.mm, 0)
      ]
      
      face = test_group.entities.add_face(points)
      face.reverse! if face.normal.z < 0
      face.pushpull(50.mm)
      
      # Додаємо текст з інформацією
      add_info_text(test_group, "Тестовий блок ProGran3", [500.mm, 500.mm, 100.mm])
      
      puts "✅ Тестовий блок створено"
      test_group
    end

    # Видалення тестового блоку
    def remove_test_block
      model = Sketchup.active_model
      entities = model.active_entities
      
      test_groups = entities.grep(Sketchup::Group).select { |g| g.name == TEST_BLOCK_NAME }
      test_groups.each(&:erase!)
      
      puts "🗑️ Старий тестовий блок видалено" unless test_groups.empty?
    end

    # Додавання тексту
    def add_info_text(group, text, position)
      text_entity = group.entities.add_text(text, position)
      text_entity.text = text
      text_entity
    end

    # Генерація 3D превью компонента
    def generate_component_preview(component_path, preview_size = 200.mm)
      model = Sketchup.active_model
      entities = model.active_entities
      
      begin
        # Завантажуємо компонент
        defs = model.definitions
        comp_def = defs.load(component_path)
        
        # Створюємо превью групу
        preview_group = entities.add_group
        preview_group.name = "Preview_#{File.basename(component_path, '.skp')}"
        
        # Розміщуємо компонент
        instance = preview_group.entities.add_instance(comp_def, Geom::Transformation.new)
        
        # Масштабуємо до потрібного розміру
        bounds = instance.bounds
        scale_factor = preview_size / [bounds.width, bounds.height, bounds.depth].max
        scale_transform = Geom::Transformation.scaling(scale_factor)
        instance.transformation = scale_transform
        
        # Центруємо
        new_bounds = instance.bounds
        center_offset = Geom::Point3d.new(0, 0, 0) - new_bounds.center
        move_transform = Geom::Transformation.translation(center_offset)
        instance.transformation = move_transform * scale_transform
        
        puts "✅ 3D превью створено: #{File.basename(component_path)}"
        preview_group
        
      rescue => e
        puts "❌ Помилка створення превью: #{e.message}"
        nil
      end
    end

    # Створення галереї превью
    def create_preview_gallery(category = nil)
      model = Sketchup.active_model
      entities = model.active_entities
      
      # Створюємо тестовий блок якщо його немає
      test_block = find_test_block
      test_block = create_test_block unless test_block
      
      # Отримуємо список компонентів
      if category
        components = Dir.glob(File.join(ProGran3::ASSETS_PATH, category, "*.skp"))
      else
        components = Dir.glob(File.join(ProGran3::ASSETS_PATH, "**/*.skp"))
      end
      
      puts "📁 Знайдено #{components.length} компонентів"
      
      # Створюємо галерею
      gallery_group = entities.add_group
      gallery_group.name = "Preview_Gallery"
      
      components.each_with_index do |component_path, index|
        # Розраховуємо позицію в сітці
        row = index / 3
        col = index % 3
        x = col * 300.mm
        y = row * 300.mm
        
        # Створюємо превью
        preview = generate_component_preview(component_path, 150.mm)
        if preview
          # Переміщуємо в галерею
          preview.transformation = Geom::Transformation.translation([x, y, 0])
          preview.parent = gallery_group
          
          # Додаємо підпис
          component_name = File.basename(component_path, '.skp')
          add_info_text(gallery_group, component_name, [x + 75.mm, y - 20.mm, 0])
        end
      end
      
      puts "🎨 Галерея превью створена з #{components.length} компонентів"
      gallery_group
    end

    # Пошук тестового блоку
    def find_test_block
      model = Sketchup.active_model
      entities = model.active_entities
      
      entities.grep(Sketchup::Group).find { |g| g.name == TEST_BLOCK_NAME }
    end

    # Тестування всіх функцій
    def test_all_features
      puts "🧪 Тестування нових функцій ProGran3..."
      puts "=" * 50
      
      # Тест 1: Створення тестового блоку
      puts "1. Тестування створення тестового блоку..."
      test_block = create_test_block
      puts "   ✅ Тестовий блок створено"
      
      # Тест 2: Генерація превью одного компонента
      puts "2. Тестування генерації превью..."
      sample_component = Dir.glob(File.join(ProGran3::ASSETS_PATH, "stands", "*.skp")).first
      if sample_component
        preview = generate_component_preview(sample_component)
        puts "   ✅ Превью створено: #{File.basename(sample_component)}"
      else
        puts "   ⚠️ Компоненти не знайдено"
      end
      
      # Тест 3: Створення галереї
      puts "3. Тестування створення галереї..."
      gallery = create_preview_gallery("stands")
      puts "   ✅ Галерея створена"
      
      puts "=" * 50
      puts "🎉 Всі тести завершено!"
    end

    # Очищення тестових об'єктів
    def cleanup_test_objects
      model = Sketchup.active_model
      entities = model.active_entities
      
      # Видаляємо тестовий блок
      remove_test_block
      
      # Видаляємо галереї превью
      preview_groups = entities.grep(Sketchup::Group).select { |g| g.name.include?("Preview_") }
      preview_groups.each(&:erase!)
      
      puts "🧹 Тестові об'єкти очищено"
    end
  end
end

