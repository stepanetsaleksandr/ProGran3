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
      
      # Видаляємо старі компоненти кутової огорожі та їх підкомпоненти
      old_corner_fences = model.active_entities.grep(Sketchup::ComponentInstance).select { |c| c.definition.name == "CornerFence" }
      old_corner_fences.each(&:erase!)
      
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
      
      # 4. Створюємо компонент декоративного елемента
      decor_def = defs.add("CornerFence_Decor")
      decor_half_size = decorative_size.mm / 2.0
      decor_points = [
        Geom::Point3d.new(-decor_half_size, -decor_half_size, 0),
        Geom::Point3d.new(decor_half_size, -decor_half_size, 0),
        Geom::Point3d.new(decor_half_size, decor_half_size, 0),
        Geom::Point3d.new(-decor_half_size, decor_half_size, 0)
      ]
      decor_face = decor_def.entities.add_face(decor_points)
      decor_face.reverse! if decor_face.normal.z < 0
      decor_face.pushpull(decorative_size.mm)
      
      # 5. Створюємо головний компонент кутової огорожі
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
      
      # Додаємо декоративний елемент (по центру стовпа)
      decor_center_x = post_depth.mm / 2.0
      decor_center_y = post_width.mm / 2.0
      decor_transform = Geom::Transformation.new([decor_center_x, decor_center_y, base_height + post_height.mm])
      corner_fence_def.entities.add_instance(decor_def, decor_transform)
      
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
    
    def create_perimeter_fence(post_height, post_width, post_depth, intermediate_count, decorative_height, decorative_thickness)
      # Валідація вхідних параметрів
      validation_result = Validation.validate_dimensions(post_height, post_width, post_depth, "FenceBuilder.perimeter_fence")
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
      
      # Видаляємо старі компоненти периметральної огорожі
      model.active_entities.grep(Sketchup::ComponentInstance).select { |c| c.definition.name == "PerimeterFence" }.each(&:erase!)
      
      # Видаляємо старі компоненти кутової огорожі та їх підкомпоненти
      old_corner_fences = model.active_entities.grep(Sketchup::ComponentInstance).select { |c| c.definition.name == "CornerFence" }
      old_corner_fences.each(&:erase!)
      
      # Видаляємо старі визначення компонентів кутової огорожі
      old_corner_defs = defs.select { |definition| definition.name.start_with?("CornerFence") }
      old_corner_defs.each { |definition| defs.remove(definition) }
      
      # Створюємо новий компонент периметральної огорожі
      comp_def = defs.add("PerimeterFence")
      
      # Визначаємо базову висоту для огорожі
      base_height = calculate_fence_base_height
      
      # Створюємо геометрію периметральної огорожі
      # Основний стовп
      main_post_points = [
        Geom::Point3d.new(0, 0, base_height),
        Geom::Point3d.new(post_depth.mm, 0, base_height),
        Geom::Point3d.new(post_depth.mm, post_width.mm, base_height),
        Geom::Point3d.new(0, post_width.mm, base_height)
      ]
      
      main_post_face = comp_def.entities.add_face(main_post_points)
      main_post_face.reverse! if main_post_face.normal.z < 0
      main_post_face.pushpull(post_height.mm)
      
      # Проміжні стовпи
      if intermediate_count > 0
        spacing = 1000.mm # 1 метр між стовпами
        intermediate_count.times do |i|
          x_pos = (i + 1) * spacing
          intermediate_post_points = [
            Geom::Point3d.new(x_pos, 0, base_height),
            Geom::Point3d.new(x_pos + post_depth.mm, 0, base_height),
            Geom::Point3d.new(x_pos + post_depth.mm, post_width.mm, base_height),
            Geom::Point3d.new(x_pos, post_width.mm, base_height)
          ]
          
          intermediate_post_face = comp_def.entities.add_face(intermediate_post_points)
          intermediate_post_face.reverse! if intermediate_post_face.normal.z < 0
          intermediate_post_face.pushpull(post_height.mm)
        end
      end
      
      # Декор
      decor_points = [
        Geom::Point3d.new(0, 0, base_height + post_height.mm),
        Geom::Point3d.new((intermediate_count + 1) * 1000.mm, 0, base_height + post_height.mm),
        Geom::Point3d.new((intermediate_count + 1) * 1000.mm, decorative_thickness.mm, base_height + post_height.mm),
        Geom::Point3d.new(0, decorative_thickness.mm, base_height + post_height.mm)
      ]
      
      decor_face = comp_def.entities.add_face(decor_points)
      decor_face.reverse! if decor_face.normal.z < 0
      decor_face.pushpull(decorative_height.mm)
      
      # Додаємо екземпляр компонента до моделі
      entities.add_instance(comp_def, Geom::Transformation.new)
      
      true
    end
  end
end
