# progran3/builders/blind_area_builder.rb
# Модуль для створення відмостки по периметру фундаменту
require_relative '../validation'
require_relative '../logger'
require_relative '../error_handler'

module ProGran3
  module BlindAreaBuilder
    extend self
    
    # Створення відмостки з однаковою шириною по всіх сторонах
    def create_uniform(width, thickness = 50)
      create(width, width, width, width, thickness)
    end
    
    # Створення відмостки з різною шириною по сторонах
    def create(north_width = 300, south_width = 300, east_width = 300, west_width = 300, thickness = 50)
      # Валідація вхідних параметрів
      validation_result = Validation.validate_dimensions(
        [north_width, south_width, east_width, west_width].max, 
        100, 
        thickness, 
        "BlindAreaBuilder"
      )
      
      unless validation_result.valid
        ErrorHandler.handle_error(
          Validation::ValidationError.new("Помилка валідації відмостки: #{validation_result.error_messages.join(', ')}"),
          "BlindAreaBuilder",
          "create"
        )
        return false
      end
      
      model = Sketchup.active_model
      entities = model.active_entities
      model.start_operation('Create Blind Area', true)
      
      # Знаходимо фундамент
      foundation = model.entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name == "Foundation" }
      unless foundation
        ErrorHandler.handle_error(
          Validation::ValidationError.new("Фундамент не знайдено. Спочатку створіть фундамент."),
          "BlindAreaBuilder",
          "create"
        )
        model.abort_operation
        return false
      end
      
      # Видаляємо старі відмостки
      entities.grep(Sketchup::ComponentInstance).select { |inst| inst.definition.name.start_with?("BlindArea") }.each(&:erase!)
      model.definitions.purge_unused
      
      # Отримуємо межі фундаменту
      bounds = foundation.bounds
      foundation_min_x = bounds.min.x
      foundation_max_x = bounds.max.x
      foundation_min_y = bounds.min.y
      foundation_max_y = bounds.max.y
      foundation_bottom_z = bounds.min.z # Нижня грань фундаменту
      
      # Конвертуємо розміри в SketchUp одиниці
      blind_thickness = thickness.mm
      north_offset = north_width.mm
      south_offset = south_width.mm
      east_offset = east_width.mm
      west_offset = west_width.mm
      
      # Розраховуємо межі відмостки з різною шириною по сторонах
      blind_min_x = foundation_min_x - west_offset
      blind_max_x = foundation_max_x + east_offset
      blind_min_y = foundation_min_y - south_offset
      blind_max_y = foundation_max_y + north_offset
      
      # Верхня грань відмостки повинна бути на рівні нижньої грані фундаменту
      blind_top_z = foundation_bottom_z
      blind_bottom_z = blind_top_z - blind_thickness
      
      # Створюємо один компонент відмостки
      create_single_blind_area(
        "BlindArea",
        blind_min_x, blind_max_x,
        blind_min_y, blind_max_y,
        blind_bottom_z, blind_top_z,
        entities
      )
      
      model.commit_operation
      Logger.success("Відмостка створена успішно", "BlindAreaBuilder")
      true
    end
    
    private
    
    # Створення одного компонента відмостки
    def create_single_blind_area(name, min_x, max_x, min_y, max_y, bottom_z, top_z, entities)
      model = Sketchup.active_model
      defs = model.definitions
      
      # Видаляємо старе визначення якщо воно існує
      if (old_def = defs[name]) && old_def.instances.empty?
        defs.purge(old_def)
      end
      
      comp_def = defs.add(name)
      
      # Розміри відмостки
      width = max_x - min_x
      depth = max_y - min_y
      height = top_z - bottom_z
      
      # Знаходимо фундамент щоб отримати його розміри для вирізу
      foundation = model.entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name == "Foundation" }
      foundation_bounds = foundation.bounds
      
      # Розраховуємо позицію фундаменту відносно відмостки
      foundation_rel_min_x = foundation_bounds.min.x - min_x
      foundation_rel_max_x = foundation_bounds.max.x - min_x
      foundation_rel_min_y = foundation_bounds.min.y - min_y
      foundation_rel_max_y = foundation_bounds.max.y - min_y
      
      # Створюємо зовнішній прямокутник (вся відмостка)
      outer_points = [
        Geom::Point3d.new(0, 0, bottom_z),
        Geom::Point3d.new(width, 0, bottom_z),
        Geom::Point3d.new(width, depth, bottom_z),
        Geom::Point3d.new(0, depth, bottom_z)
      ]
      
      # Створюємо внутрішній прямокутник (виріз для фундаменту)
      inner_points = [
        Geom::Point3d.new(foundation_rel_min_x, foundation_rel_min_y, bottom_z),
        Geom::Point3d.new(foundation_rel_max_x, foundation_rel_min_y, bottom_z),
        Geom::Point3d.new(foundation_rel_max_x, foundation_rel_max_y, bottom_z),
        Geom::Point3d.new(foundation_rel_min_x, foundation_rel_max_y, bottom_z)
      ]
      
      # Створюємо зовнішню грань
      outer_face = comp_def.entities.add_face(outer_points)
      outer_face.reverse! if outer_face.normal.z > 0
      
      # Створюємо внутрішню грань (виріз)
      inner_face = comp_def.entities.add_face(inner_points)
      inner_face.reverse! if inner_face.normal.z < 0
      
      # Видаляємо внутрішню грань (створюємо отвір)
      inner_face.erase!
      
      # Створюємо верхню грань (плоска, без ухилу)
      top_outer_points = [
        Geom::Point3d.new(0, 0, top_z),
        Geom::Point3d.new(width, 0, top_z),
        Geom::Point3d.new(width, depth, top_z),
        Geom::Point3d.new(0, depth, top_z)
      ]
      top_outer_face = comp_def.entities.add_face(top_outer_points)
      top_outer_face.reverse! if top_outer_face.normal.z < 0
      
      # Створюємо верхню грань вирізу (плоска)
      top_inner_points = [
        Geom::Point3d.new(foundation_rel_min_x, foundation_rel_min_y, top_z),
        Geom::Point3d.new(foundation_rel_max_x, foundation_rel_min_y, top_z),
        Geom::Point3d.new(foundation_rel_max_x, foundation_rel_max_y, top_z),
        Geom::Point3d.new(foundation_rel_min_x, foundation_rel_max_y, top_z)
      ]
      top_inner_face = comp_def.entities.add_face(top_inner_points)
      top_inner_face.reverse! if top_inner_face.normal.z > 0
      
      # Видаляємо верхню грань вирізу
      top_inner_face.erase!
      
      # Створюємо вертикальні грані для закриття вирізу фундаменту
      # Західна стінка вирізу (ліва)
      west_cut_points = [
        Geom::Point3d.new(foundation_rel_min_x, foundation_rel_min_y, bottom_z),
        Geom::Point3d.new(foundation_rel_min_x, foundation_rel_min_y, top_z),
        Geom::Point3d.new(foundation_rel_min_x, foundation_rel_max_y, top_z),
        Geom::Point3d.new(foundation_rel_min_x, foundation_rel_max_y, bottom_z)
      ]
      west_cut_face = comp_def.entities.add_face(west_cut_points)
      west_cut_face.reverse! if west_cut_face.normal.x < 0
      
      # Східна стінка вирізу (права)
      east_cut_points = [
        Geom::Point3d.new(foundation_rel_max_x, foundation_rel_min_y, bottom_z),
        Geom::Point3d.new(foundation_rel_max_x, foundation_rel_min_y, top_z),
        Geom::Point3d.new(foundation_rel_max_x, foundation_rel_max_y, top_z),
        Geom::Point3d.new(foundation_rel_max_x, foundation_rel_max_y, bottom_z)
      ]
      east_cut_face = comp_def.entities.add_face(east_cut_points)
      east_cut_face.reverse! if east_cut_face.normal.x > 0
      
      # Південна стінка вирізу (передня)
      south_cut_points = [
        Geom::Point3d.new(foundation_rel_min_x, foundation_rel_min_y, bottom_z),
        Geom::Point3d.new(foundation_rel_max_x, foundation_rel_min_y, bottom_z),
        Geom::Point3d.new(foundation_rel_max_x, foundation_rel_min_y, top_z),
        Geom::Point3d.new(foundation_rel_min_x, foundation_rel_min_y, top_z)
      ]
      south_cut_face = comp_def.entities.add_face(south_cut_points)
      south_cut_face.reverse! if south_cut_face.normal.y < 0
      
      # Північна стінка вирізу (задня)
      north_cut_points = [
        Geom::Point3d.new(foundation_rel_min_x, foundation_rel_max_y, bottom_z),
        Geom::Point3d.new(foundation_rel_max_x, foundation_rel_max_y, bottom_z),
        Geom::Point3d.new(foundation_rel_max_x, foundation_rel_max_y, top_z),
        Geom::Point3d.new(foundation_rel_min_x, foundation_rel_max_y, top_z)
      ]
      north_cut_face = comp_def.entities.add_face(north_cut_points)
      north_cut_face.reverse! if north_cut_face.normal.y > 0
      
      # Створюємо бічні грані для закриття торців
      # Західна грань (ліва)
      west_points = [
        Geom::Point3d.new(0, 0, bottom_z),
        Geom::Point3d.new(0, 0, top_z),
        Geom::Point3d.new(0, depth, top_z),
        Geom::Point3d.new(0, depth, bottom_z)
      ]
      west_face = comp_def.entities.add_face(west_points)
      west_face.reverse! if west_face.normal.x > 0
      
      # Східна грань (права)
      east_points = [
        Geom::Point3d.new(width, 0, bottom_z),
        Geom::Point3d.new(width, 0, top_z),
        Geom::Point3d.new(width, depth, top_z),
        Geom::Point3d.new(width, depth, bottom_z)
      ]
      east_face = comp_def.entities.add_face(east_points)
      east_face.reverse! if east_face.normal.x < 0
      
      # Південна грань (передня)
      south_points = [
        Geom::Point3d.new(0, 0, bottom_z),
        Geom::Point3d.new(width, 0, bottom_z),
        Geom::Point3d.new(width, 0, top_z),
        Geom::Point3d.new(0, 0, top_z)
      ]
      south_face = comp_def.entities.add_face(south_points)
      south_face.reverse! if south_face.normal.y > 0
      
      # Північна грань (задня)
      north_points = [
        Geom::Point3d.new(0, depth, bottom_z),
        Geom::Point3d.new(width, depth, bottom_z),
        Geom::Point3d.new(width, depth, top_z),
        Geom::Point3d.new(0, depth, top_z)
      ]
      north_face = comp_def.entities.add_face(north_points)
      north_face.reverse! if north_face.normal.y < 0
      
      # Додаємо екземпляр компонента
      transformation = Geom::Transformation.new([min_x, min_y, 0])
      entities.add_instance(comp_def, transformation)
    end
    
    # Створення відмостки з автоматичним визначенням розмірів
    def create_auto(thickness = 50)
      create(thickness)
    end
  end
end
