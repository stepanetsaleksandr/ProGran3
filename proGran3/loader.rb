# progran3/loader.rb
# Модуль відповідає тільки за завантаження .skp компонентів та їх розміщення.

module ProGran3
  extend self

  ASSETS_PATH = File.join(File.dirname(__FILE__), 'assets')
  
  # Завантажуємо новий модуль для роботи з .skp файлами
  require_relative 'skp_preview_extractor'
  
  # Завантажуємо новий модуль каруселі
  require_relative 'carousel/carousel_manager'
  require_relative 'carousel/carousel_ui'

  def load_component(category, filename)
    path = File.join(ASSETS_PATH, category, filename)
    model = Sketchup.active_model
    defs = model.definitions
    begin
      comp_def = defs.load(path)
      comp_def.name = filename
      comp_def
    rescue IOError
      ::UI.messagebox("Помилка: Неможливо завантажити файл #{filename}. Перевірте, що це правильний .skp файл.")
      nil
    end
  end

  def all_instances_by_category(category)
    model = Sketchup.active_model
    search_name = category[0..-2]
    model.active_entities.grep(Sketchup::ComponentInstance).select do |e|
      e.definition.name.downcase.include?(search_name)
    end
  end

  def last_stand_instance
    all_instances_by_category("stands").last
  end

  def insert_component(category, filename)
    model = Sketchup.active_model
    entities = model.active_entities
    all_instances_by_category(category).each(&:erase!)
    comp_def = load_component(category, filename)
    return unless comp_def
    foundation = model.entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name == "Foundation" }
    x, y, z = 0, 0, 0
    foundation_z = 0
    foundation_bounds = nil
    if foundation
      foundation_bounds = foundation.bounds
      foundation_z = foundation_bounds.max.z
    end

    if category == "stands"
      if foundation
        placement_z = foundation_z
        tile_instance = entities.grep(Sketchup::ComponentInstance).find { |inst| inst.definition.name.start_with?("Perimeter_Tile_") || inst.definition.name.start_with?("Modular_Tile") }
        if tile_instance
          placement_z = tile_instance.bounds.max.z
        end
        x = (foundation_bounds.min.x + 300.mm) - comp_def.bounds.min.x
        y = foundation_bounds.center.y - comp_def.bounds.center.y
        z = placement_z - comp_def.bounds.min.z
      end
    else
      stand = last_stand_instance
      if stand
        stand_bounds = stand.bounds
        comp_bounds = comp_def.bounds
        if category == "steles"
          x = stand_bounds.center.x - comp_bounds.center.x
          y = stand_bounds.center.y - comp_bounds.center.y
          z = stand_bounds.max.z - comp_bounds.min.z
        elsif category == "flowerbeds"
          placement_z = foundation_z
          tile_instance = entities.grep(Sketchup::ComponentInstance).find { |inst| inst.definition.name.start_with?("Perimeter_Tile_") || inst.definition.name.start_with?("Modular_Tile") }
          if tile_instance
            placement_z = tile_instance.bounds.max.z
          end
          insert_x = stand_bounds.min.x + stand_bounds.width
          center_y_stand = stand_bounds.center.y
          center_y_comp = comp_bounds.center.y
          x = insert_x - comp_bounds.min.x
          y = center_y_stand - center_y_comp
          z = placement_z - comp_bounds.min.z
        end
      end
    end
    trans = Geom::Transformation.new([x, y, z])
    entities.add_instance(comp_def, trans)
  end
end