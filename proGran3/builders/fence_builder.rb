# progran3/builders/fence_builder.rb
require_relative '../validation'

module ProGran3
  module FenceBuilder
    extend self
    
    # Допоміжний метод для визначення базової висоти огорожі
    def calculate_fence_base_height
      model = Sketchup.active_model
      entities = model.entities
      
      # Спочатку шукаємо плитку
      tiles = entities.grep(Sketchup::ComponentInstance).select do |c| 
        c.definition.name.start_with?("Perimeter_Tile_") || c.definition.name.start_with?("Modular_Tile")
      end
      
      if tiles.any?
        # Якщо є плитка, беремо максимальну висоту всіх плиток
        max_tile_height = tiles.map { |tile| tile.bounds.max.z }.max
        return max_tile_height
      end
      
      # Якщо плитки немає, шукаємо фундамент
      foundation = entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name == "Foundation" }
      if foundation
        return foundation.bounds.max.z
      end
      
      # Якщо нічого немає, повертаємо 0
      0.0
    end
    
    def create_corner_fence(post_height, post_width, post_depth, side_height, side_length, side_thickness, decorative_size)
      # Валідація вхідних параметрів
      validation_result = Validation.validate_dimensions(post_height, post_width, post_depth, "FenceBuilder.corner_fence")
      unless validation_result.valid
        ErrorHandler.handle_error(
          Validation::ValidationError.new("Помилка валідації кутової огорожі: #{validation_result.error_messages.join(', ')}"),
          "FenceBuilder",
          "create_corner_fence"
        )
        return false
      end
      
      model = Sketchup.active_model
      entities = model.active_entities
      defs = model.definitions
      
      # Видаляємо старі компоненти периметральної огорожі
      model.active_entities.grep(Sketchup::ComponentInstance).select { |c| c.definition.name == "PerimeterFence" }.each(&:erase!)
      
      # Видаляємо старі компоненти кутової огорожі та їх підкомпоненти
      old_corner_fences = model.active_entities.grep(Sketchup::ComponentInstance).select { |c| c.definition.name == "CornerFence" }
      old_corner_fences.each(&:erase!)
      
      # Видаляємо тільки старі декоративні елементи огорожі
      old_decor_components = model.active_entities.grep(Sketchup::ComponentInstance).find_all { |c| 
        name = c.definition.name
        # Видаляємо тільки декоративні елементи огорожі
        name.include?('fence_decor') || 
        name.include?('FenceDecor') ||
        (name.include?('ball') && name.include?('fence')) ||
        (name.include?('pancake') && name.include?('fence'))
      }
      old_decor_components.each do |decor|
        if decor && decor.valid?
          decor.erase!
        end
      end
      
      # Видаляємо старі визначення компонентів кутової огорожі
      old_defs = defs.select { |definition| definition.name.start_with?("CornerFence") }
      old_defs.each { |definition| defs.remove(definition) }
      
      # Визначаємо базову висоту для огорожі
      base_height = calculate_fence_base_height
      
      # Отримуємо розміри фундаменту для позиціонування кутів
      foundation = model.entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name == "Foundation" }
      unless foundation
        ErrorHandler.handle_error(
          Validation::ValidationError.new("Фундамент не знайдено для створення кутових елементів огорожі"),
          "FenceBuilder",
          "create_corner_fence"
        )
        return false
      end
      
      foundation_bounds = foundation.bounds
      foundation_min_x = foundation_bounds.min.x
      foundation_max_x = foundation_bounds.max.x
      foundation_min_y = foundation_bounds.min.y
      foundation_max_y = foundation_bounds.max.y
      
      # 1. Створюємо компонент стовпа
      post_def = defs.add("CornerFence_Post")
      post_points = [
        Geom::Point3d.new(0, 0, 0),
        Geom::Point3d.new(post_depth.mm, 0, 0),
        Geom::Point3d.new(post_depth.mm, post_width.mm, 0),
        Geom::Point3d.new(0, post_width.mm, 0)
      ]
      post_face = post_def.entities.add_face(post_points)
      post_face.reverse! if post_face.normal.z < 0
      post_face.pushpull(post_height.mm)
      
      # 2. Створюємо компонент панелі по осі X
      panel_x_def = defs.add("CornerFence_Panel_X")
      side_x_points = [
        Geom::Point3d.new(0, 0, 0),
        Geom::Point3d.new(side_length.mm, 0, 0),
        Geom::Point3d.new(side_length.mm, side_thickness.mm, 0),
        Geom::Point3d.new(0, side_thickness.mm, 0)
      ]
      side_x_face = panel_x_def.entities.add_face(side_x_points)
      side_x_face.reverse! if side_x_face.normal.z < 0
      side_x_face.pushpull(side_height.mm)
      
      # 3. Створюємо компонент панелі по осі Y
      panel_y_def = defs.add("CornerFence_Panel_Y")
      side_y_points = [
        Geom::Point3d.new(0, 0, 0),
        Geom::Point3d.new(side_thickness.mm, 0, 0),
        Geom::Point3d.new(side_thickness.mm, side_length.mm, 0),
        Geom::Point3d.new(0, side_length.mm, 0)
      ]
      side_y_face = panel_y_def.entities.add_face(side_y_points)
      side_y_face.reverse! if side_y_face.normal.z < 0
      side_y_face.pushpull(side_height.mm)
      
      # 4. Створюємо головний компонент кутової огорожі
      corner_fence_def = defs.add("CornerFence")
      
      # Додаємо стовп
      post_transform = Geom::Transformation.new([0, 0, base_height])
      corner_fence_def.entities.add_instance(post_def, post_transform)
      
      # Додаємо панель по осі X
      panel_x_transform = Geom::Transformation.new([post_depth.mm, 0, base_height])
      corner_fence_def.entities.add_instance(panel_x_def, panel_x_transform)
      
      # Додаємо панель по осі Y
      panel_y_transform = Geom::Transformation.new([0, post_width.mm, base_height])
      corner_fence_def.entities.add_instance(panel_y_def, panel_y_transform)
      
      # Створюємо 4 кутові елементи на кожному куті фундаменту
      
      # Кут 1: Південно-західний (нижній лівий)
      sw_transform = Geom::Transformation.new([foundation_min_x, foundation_min_y, 0])
      entities.add_instance(corner_fence_def, sw_transform)
      
      # Кут 2: Південно-східний (нижній правий) - повернутий на 90 градусів
      se_transform = Geom::Transformation.new([foundation_max_x, foundation_min_y, 0]) * 
                     Geom::Transformation.rotation(ORIGIN, Z_AXIS, 90.degrees)
      entities.add_instance(corner_fence_def, se_transform)
      
      # Кут 3: Північно-східний (верхній правий) - повернутий на 180 градусів
      ne_transform = Geom::Transformation.new([foundation_max_x, foundation_max_y, 0]) * 
                     Geom::Transformation.rotation(ORIGIN, Z_AXIS, 180.degrees)
      entities.add_instance(corner_fence_def, ne_transform)
      
      # Кут 4: Північно-західний (верхній лівий) - повернутий на 270 градусів
      nw_transform = Geom::Transformation.new([foundation_min_x, foundation_max_y, 0]) * 
                     Geom::Transformation.rotation(ORIGIN, Z_AXIS, 270.degrees)
      entities.add_instance(corner_fence_def, nw_transform)
      
      true
    end
    
    def create_perimeter_fence(post_height, post_width, post_depth, north_count, south_count, east_west_count, decorative_height, decorative_thickness)
      # Валідація вхідних параметрів (дозволяє 0 для кількості стовпів)
      validation_result = Validation.validate_fence_perimeter(
        post_height, post_width, post_depth, 
        north_count, south_count, east_west_count,
        decorative_height, decorative_thickness, 
        "FenceBuilder.perimeter_fence"
      )
      unless validation_result.valid
        ErrorHandler.handle_error(
          Validation::ValidationError.new("Помилка валідації периметральної огорожі: #{validation_result.error_messages.join(', ')}"),
          "FenceBuilder",
          "create_perimeter_fence"
        )
        return false
      end
      
      model = Sketchup.active_model
      entities = model.active_entities
      defs = model.definitions
      
      # Логуємо параметри створення огорожі
      ProGran3::Logger.info("Створення периметральної огорожі з параметрами:", "FenceBuilder")
      ProGran3::Logger.info("  - north_count: #{north_count}", "FenceBuilder")
      ProGran3::Logger.info("  - south_count: #{south_count}", "FenceBuilder")
      ProGran3::Logger.info("  - east_west_count: #{east_west_count}", "FenceBuilder")
      
      # Видаляємо ВСІ старі компоненти периметральної огорожі
      all_components = model.active_entities.grep(Sketchup::ComponentInstance)
      ProGran3::Logger.info("Всі компоненти в моделі: #{all_components.map { |c| c.definition.name }.join(', ')}", "FenceBuilder")
      
      # Видаляємо тільки компоненти огорожі (не всі компоненти з "Fence" в назві)
      fence_components = all_components.select { |c| 
        name = c.definition.name
        # Видаляємо тільки специфічні компоненти огорожі
        name.include?("PerimeterFence") || 
        name.include?("CornerFence") ||
        name.include?("FencePost") ||
        name.include?("FencePanel") ||
        name.include?("FenceDecor") ||
        name.include?("fence_decor") ||
        name.include?("fence_corner") ||
        name.include?("fence_perimeter")
      }
      ProGran3::Logger.info("Видаляємо тільки компоненти огорожі: #{fence_components.length} компонентів", "FenceBuilder")
      fence_components.each(&:erase!)
      
      # Видаляємо тільки старі декоративні елементи огорожі
      old_decor_components = model.active_entities.grep(Sketchup::ComponentInstance).find_all { |c| 
        name = c.definition.name
        # Видаляємо тільки декоративні елементи огорожі
        name.include?('fence_decor') || 
        name.include?('FenceDecor') ||
        (name.include?('ball') && name.include?('fence')) ||
        (name.include?('pancake') && name.include?('fence'))
      }
      ProGran3::Logger.info("Видаляємо тільки декоративні елементи огорожі: #{old_decor_components.length} компонентів", "FenceBuilder")
      old_decor_components.each do |decor|
        if decor && decor.valid?
          decor.erase!
        end
      end
      
      # Видаляємо тільки визначення компонентів огорожі (не всі визначення)
      fence_definitions = model.definitions.to_a.select { |definition| 
        name = definition.name
        name.include?("PerimeterFence") || 
        name.include?("CornerFence") ||
        name.include?("FencePost") ||
        name.include?("FencePanel") ||
        name.include?("FenceDecor") ||
        name.include?("fence_decor") ||
        name.include?("fence_corner") ||
        name.include?("fence_perimeter")
      }
      ProGran3::Logger.info("Видаляємо тільки визначення огорожі: #{fence_definitions.length} визначень", "FenceBuilder")
      fence_definitions.each { |definition| defs.remove(definition) }
      
      # Отримуємо розміри фундаменту для позиціонування
      foundation = model.entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name == "Foundation" }
      unless foundation
        ErrorHandler.handle_error(
          Validation::ValidationError.new("Фундамент не знайдено для створення периметральної огорожі"),
          "FenceBuilder",
          "create_perimeter_fence"
        )
        return false
      end
      
      foundation_bounds = foundation.bounds
      foundation_min_x = foundation_bounds.min.x
      foundation_max_x = foundation_bounds.max.x
      foundation_min_y = foundation_bounds.min.y
      foundation_max_y = foundation_bounds.max.y
      
      # Визначаємо базову висоту для огорожі
      base_height = calculate_fence_base_height
      
      # Створюємо компонент стовпа
      post_def = defs.add("PerimeterFence_Post")
      post_points = [
        Geom::Point3d.new(0, 0, 0),
        Geom::Point3d.new(post_depth.mm, 0, 0),
        Geom::Point3d.new(post_depth.mm, post_width.mm, 0),
        Geom::Point3d.new(0, post_width.mm, 0)
      ]
      post_face = post_def.entities.add_face(post_points)
      post_face.reverse! if post_face.normal.z < 0
      post_face.pushpull(post_height.mm)
      
      # Створюємо головний компонент периметральної огорожі
      perimeter_fence_def = defs.add("PerimeterFence")
      
      # Додаємо стовп
      post_transform = Geom::Transformation.new([0, 0, base_height])
      perimeter_fence_def.entities.add_instance(post_def, post_transform)
      
      # Створюємо 4 кутові стовпчики на кожному куті фундаменту
      
      # Кут 1: Південно-західний (нижній лівий)
      sw_transform = Geom::Transformation.new([foundation_min_x, foundation_min_y, 0])
      entities.add_instance(perimeter_fence_def, sw_transform)
      
      # Кут 2: Південно-східний (нижній правий)
      se_transform = Geom::Transformation.new([foundation_max_x - post_depth.mm, foundation_min_y, 0])
      entities.add_instance(perimeter_fence_def, se_transform)
      
      # Кут 3: Північно-східний (верхній правий)
      ne_transform = Geom::Transformation.new([foundation_max_x - post_depth.mm, foundation_max_y - post_width.mm, 0])
      entities.add_instance(perimeter_fence_def, ne_transform)
      
      # Кут 4: Північно-західний (верхній лівий)
      nw_transform = Geom::Transformation.new([foundation_min_x, foundation_max_y - post_width.mm, 0])
      entities.add_instance(perimeter_fence_def, nw_transform)
      
      # Додаємо проміжні стовпчики на кожній стороні відповідно до параметрів
      ProGran3::Logger.info("Додавання проміжних стовпів:", "FenceBuilder")
      
      # Північна сторона (західна/ліва) - задня сторона
      ProGran3::Logger.info("  - Північна сторона: #{north_count} стовпів", "FenceBuilder")
      if north_count > 0
        foundation_height = foundation_max_y - foundation_min_y
        north_spacing = foundation_height / (north_count + 1.0)
        
        north_count.times do |i|
          post_y = foundation_min_y + north_spacing * (i + 1) - post_width.mm / 2.0
          north_transform = Geom::Transformation.new([foundation_min_x, post_y, 0])
          entities.add_instance(perimeter_fence_def, north_transform)
        end
      end
      
      # Південна сторона (східна/права) - вхід
      ProGran3::Logger.info("  - Південна сторона: #{south_count} стовпів", "FenceBuilder")
      if south_count > 0
        foundation_height = foundation_max_y - foundation_min_y
        south_spacing = foundation_height / (south_count + 1.0)
        
        south_count.times do |i|
          post_y = foundation_min_y + south_spacing * (i + 1) - post_width.mm / 2.0
          south_transform = Geom::Transformation.new([foundation_max_x - post_depth.mm, post_y, 0])
          entities.add_instance(perimeter_fence_def, south_transform)
        end
      end
      
      # Східна та західна сторони (бокові сторони)
      ProGran3::Logger.info("  - Бокові сторони: #{east_west_count} стовпів", "FenceBuilder")
      if east_west_count > 0
        foundation_width = foundation_max_x - foundation_min_x
        spacing = foundation_width / (east_west_count + 1.0)
        
        east_west_count.times do |i|
          post_x = foundation_min_x + spacing * (i + 1) - post_depth.mm / 2.0
          
          # Східна сторона (північна/верхня)
          east_transform = Geom::Transformation.new([post_x, foundation_max_y - post_width.mm, 0])
          entities.add_instance(perimeter_fence_def, east_transform)
          
          # Західна сторона (південна/нижня)
          west_transform = Geom::Transformation.new([post_x, foundation_min_y, 0])
          entities.add_instance(perimeter_fence_def, west_transform)
        end
      end
      
      ProGran3::Logger.info("Периметральна огорожа створена успішно", "FenceBuilder")
      true
    end
  end
end
