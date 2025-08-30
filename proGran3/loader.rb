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
      name = e.definition.name.downcase
      if category == "gravestones"
        name.include?(search_name) || name.include?('plate')
      else
        name.include?(search_name)
      end
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
    
    # Якщо немає фундаменту, розміщуємо в центрі
    if !foundation
      x = 0 - comp_def.bounds.center.x
      y = 0 - comp_def.bounds.center.y
      z = 0 - comp_def.bounds.min.z
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
      # Якщо немає фундаменту, координати вже встановлені вище
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
        elsif category == "gravestones"
          # Шукаємо квітник
          flowerbed = entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.downcase.include?('flowerbed') }
          if flowerbed
            # Позиціонуємо на південній стороні квітника з вирівнюванням країв
            flowerbed_bounds = flowerbed.bounds
            x = flowerbed_bounds.min.x - comp_bounds.min.x  # Південний край квітника збігається з південним краєм плити
            y = flowerbed_bounds.center.y - comp_bounds.center.y  # По центру квітника
            z = flowerbed_bounds.max.z - comp_bounds.min.z  # На верхній поверхні квітника
          else
            # Якщо немає квітника, позиціонуємо прилягаючи до південної площини підставки
            x = stand_bounds.max.x - comp_bounds.min.x  # Південна сторона надгробки прилягає до північної сторони підставки
            y = stand_bounds.center.y - comp_bounds.center.y  # По центру підставки відносно ЗХ-СХ
            z = stand_bounds.min.z - comp_bounds.min.z  # На тому ж рівні що і підставка (по низу)
          end
        end
      elsif category == "gravestones"
        # Якщо немає підставки, розміщуємо на фундаменті
        if foundation
          x = foundation_bounds.center.x - comp_def.bounds.center.x
          y = foundation_bounds.center.y - comp_def.bounds.center.y
          z = foundation_bounds.max.z - comp_def.bounds.min.z
        end
        # Якщо немає фундаменту, координати вже встановлені вище
      end
      # Якщо немає підставки для інших категорій, координати вже встановлені вище
    end
    trans = Geom::Transformation.new([x, y, z])
    instance = entities.add_instance(comp_def, trans)
    
    # Діагностика для надгробної плити
    if category == "gravestones"
             flowerbed = entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.downcase.include?('flowerbed') }
       if flowerbed
         puts "Надгробна плита розміщена на південній стороні квітника з вирівнюванням країв: x=#{x}, y=#{y}, z=#{z}"
      else
        stand = last_stand_instance
                 if stand
           puts "Надгробна плита розміщена прилягаючи до північної площини підставки (південна сторона плити до північної сторони підставки, на тому ж рівні): x=#{x}, y=#{y}, z=#{z}"
        else
          puts "Надгробна плита розміщена на фундаменті: x=#{x}, y=#{y}, z=#{z}"
        end
      end
      
             # Додаткова діагностика для розуміння позиціонування
       puts "Надгробна плита: південний край (min.x)=#{comp_bounds.min.x}, північний край (max.x)=#{comp_bounds.max.x}, центр (center.x)=#{comp_bounds.center.x}"
       puts "Надгробна плита: західна сторона (min.y)=#{comp_bounds.min.y}, східна сторона (max.y)=#{comp_bounds.max.y}, центр (center.y)=#{comp_bounds.center.y}"
       puts "Надгробна плита: низ (min.z)=#{comp_bounds.min.z}, верх (max.z)=#{comp_bounds.max.z}, центр (center.z)=#{comp_bounds.center.z}"
       
       flowerbed = entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.downcase.include?('flowerbed') }
       if flowerbed
         flowerbed_bounds = flowerbed.bounds
         puts "Квітник: південна сторона (min.x)=#{flowerbed_bounds.min.x}, північна сторона (max.x)=#{flowerbed_bounds.max.x}, центр (center.x)=#{flowerbed_bounds.center.x}"
         puts "Квітник: західна сторона (min.y)=#{flowerbed_bounds.min.y}, східна сторона (max.y)=#{flowerbed_bounds.max.y}, центр (center.y)=#{flowerbed_bounds.center.y}"
         puts "Квітник: низ (min.z)=#{flowerbed_bounds.min.z}, верх (max.z)=#{flowerbed_bounds.max.z}"
       end
      
             stand = last_stand_instance
       if stand
         stand_bounds = stand.bounds
         puts "Підставка: південна сторона (min.x)=#{stand_bounds.min.x}, північна сторона (max.x)=#{stand_bounds.max.x}, центр (center.x)=#{stand_bounds.center.x}"
         puts "Підставка: західна сторона (min.y)=#{stand_bounds.min.y}, східна сторона (max.y)=#{stand_bounds.max.y}, центр (center.y)=#{stand_bounds.center.y}"
         puts "Підставка: низ (min.z)=#{stand_bounds.min.z}, верх (max.z)=#{stand_bounds.max.z}, центр (center.z)=#{stand_bounds.center.z}"
       end
    end
    
    instance
  end
end