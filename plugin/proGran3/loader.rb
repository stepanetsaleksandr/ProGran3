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
  
  # Завантажуємо ModelStateManager
  require_relative 'model_state_manager'

  def load_component(category, filename)
    path = File.join(ASSETS_PATH, category, filename)
    model = Sketchup.active_model
    defs = model.definitions
    begin
      comp_def = defs.load(path)
      comp_def.name = filename
      
      # Нормалізуємо bounds компонента
      normalize_component_bounds(comp_def)
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

  # Функція для отримання останньої підставки (не проміжної)
  def last_base_stand_instance
    model = Sketchup.active_model
    entities = model.active_entities
    
    # Шукаємо всі компоненти підставки, але виключаємо проміжні
    stand_instances = entities.grep(Sketchup::ComponentInstance).select do |inst|
      inst.definition.name == "Stand" && !inst.definition.name.include?("Gaps")
    end
    
    stand_instances.last
  end

  # Функція для отримання проміжної
  def last_gaps_instance
    model = Sketchup.active_model
    entities = model.active_entities
    
    # Шукаємо компоненти проміжної
    gaps_instances = entities.grep(Sketchup::ComponentInstance).select do |inst|
      inst.definition.name == "StandGaps"
    end
    
    gaps_instances.last
  end

  # Функція для отримання поверхні для розміщення стел (проміжна або підставка)
  def get_steles_placement_surface
    # Пошук поверхні для розміщення стел - без логування
    
    gaps = last_gaps_instance
    if gaps
      # Знайдено проміжну - без логування
      gaps
    else
      stand = last_base_stand_instance
      if stand
        # Знайдено підставку - без логування
        stand
      else
        ProGran3::Logger.error("❌ Не знайдено поверхню для розміщення стел!", "Loader")
        nil
      end
    end
  end

  # Спеціальна функція для додавання декору на всі стовпчики огорожі
  def add_fence_decor_to_all_posts(filename)
    # Додавання декору на всі стовпчики огорожі - без логування
    
    model = Sketchup.active_model
    entities = model.active_entities
    
    # Завантажуємо компонент декору
    comp_def = load_component('fence_decor', filename)
    return false unless comp_def
    
    # Знаходимо всі стовпчики огорожі
    fence_posts = entities.grep(Sketchup::ComponentInstance).find_all { |c| 
      c.definition.name.include?('Fence') && c.definition.name.include?('Post')
    }
    
    if fence_posts.empty?
      ProGran3::Logger.warn("Не знайдено стовпчиків огорожі для додавання декору", "Loader")
      return false
    end
    
    # Знайдено стовпчиків огорожі - без логування
    
    # Додаємо декор на кожен стовпчик
    fence_posts.each_with_index do |post, index|
      post_bounds = post.bounds
      decor_x = post_bounds.center.x - comp_def.bounds.center.x
      decor_y = post_bounds.center.y - comp_def.bounds.center.y
      decor_z = post_bounds.max.z - comp_def.bounds.min.z
      
      decor_trans = Geom::Transformation.new([decor_x, decor_y, decor_z])
      decor_instance = entities.add_instance(comp_def, decor_trans)
      
      # Декор додано на стовпчик - без логування
    end
    
    # Декор успішно додано - без логування
    true
  end

  def insert_component(category, filename)
    # Перевірка через ModelStateManager
    unless ModelStateManager.can_add_component?(category.to_sym)
      ProGran3::Logger.error("Неможливо додати компонент: #{category}", "Loader")
      return false
    end
    
    # Перевіряємо, чи потрібно перебудовувати залежні компоненти
    if needs_rebuild_dependents?(category)
      ProGran3::Logger.info("Потрібна перебудова залежних компонентів для: #{category}", "Loader")
      rebuild_dependents_after_change(category, filename)
      return true
    end
    
    model = Sketchup.active_model
    entities = model.active_entities
    all_instances_by_category(category).each(&:erase!)
    comp_def = load_component(category, filename)
    return false unless comp_def
    
    # Отримуємо позицію для компонента
    x, y, z = calculate_component_position(category, comp_def, entities)

    trans = Geom::Transformation.new([x, y, z])
    instance = entities.add_instance(comp_def, trans)
    
    # Спеціальна логіка для fence_decor - додаємо декор на всі стовпчики огорожі
    if category == "fence_decor"
      ProGran3::Logger.info("Початок додавання декору огорожі", "Loader")
      
      # Спочатку видаляємо старі декоративні елементи
      ProGran3::Logger.info("Видаляємо старі декоративні елементи", "Loader")
      old_decor_components = entities.grep(Sketchup::ComponentInstance).find_all { |c| 
        c.definition.name.include?('ball') || c.definition.name.include?('pancake') || c.definition.name.include?('fence_decor')
      }
      
      ProGran3::Logger.info("Знайдено старих декоративних елементів: #{old_decor_components.length}", "Loader")
      old_decor_components.each do |old_decor|
        if old_decor && old_decor.valid?
          ProGran3::Logger.info("Видаляємо старий декор: #{old_decor.definition.name}", "Loader")
          old_decor.erase!
        else
          ProGran3::Logger.info("Старий декор вже видалено або не існує: #{old_decor.definition.name rescue 'unknown'}", "Loader")
        end
      end
      
      # Спочатку подивимося, які компоненти є в моделі
      all_components = entities.grep(Sketchup::ComponentInstance)
      ProGran3::Logger.info("Всього компонентів в моделі після видалення: #{all_components.length}", "Loader")
      
      all_components.each_with_index do |comp, index|
        ProGran3::Logger.info("Компонент #{index + 1}: #{comp.definition.name}", "Loader")
      end
      
      # Шукаємо стовпчики огорожі всередині компонентів огорожі
      fence_posts = []
      
      # Спочатку знаходимо всі компоненти огорожі
      fence_components = entities.grep(Sketchup::ComponentInstance).find_all { |c| 
        name = c.definition.name
        name.include?('CornerFence') || name.include?('PerimeterFence')
      }
      
      ProGran3::Logger.info("Знайдено компонентів огорожі: #{fence_components.length}", "Loader")
      
      # Тепер шукаємо стовпчики всередині кожного компонента огорожі
      fence_components.each_with_index do |fence_comp, fence_index|
        ProGran3::Logger.info("Перевіряємо компонент огорожі #{fence_index + 1}: #{fence_comp.definition.name}", "Loader")
        
        # Шукаємо стовпчики всередині цього компонента
        fence_comp.definition.entities.grep(Sketchup::ComponentInstance).each do |inner_comp|
          if inner_comp.definition.name.include?('Post')
            ProGran3::Logger.info("  Знайдено стовпчик: #{inner_comp.definition.name}", "Loader")
            # Зберігаємо стовпчик разом з батьківським компонентом
            fence_posts << { post: inner_comp, fence_comp: fence_comp }
          end
        end
      end
      
      ProGran3::Logger.info("Знайдено стовпчиків огорожі: #{fence_posts.length}", "Loader")
      
      # Діагностика знайдених стовпчиків
      fence_posts.each_with_index do |post_data, index|
        ProGran3::Logger.info("Стовпчик #{index + 1}: #{post_data[:post].definition.name} (в компоненті #{post_data[:fence_comp].definition.name})", "Loader")
      end
      
      if fence_posts.any?
        ProGran3::Logger.info("Додаємо декор на #{fence_posts.length} стовпчиків огорожі", "Loader")
        
        fence_posts.each_with_index do |post_data, index|
          post = post_data[:post]
          fence_comp = post_data[:fence_comp]
          
          # Обчислюємо позицію стовпчика в глобальних координатах
          post_local_bounds = post.bounds
          fence_transform = fence_comp.transformation
          
          # Трансформуємо локальні координати стовпчика в глобальні
          post_global_center = fence_transform * post_local_bounds.center
          post_global_max_z = fence_transform * Geom::Point3d.new(post_local_bounds.center.x, post_local_bounds.center.y, post_local_bounds.max.z)
          
          decor_x = post_global_center.x - comp_def.bounds.center.x
          decor_y = post_global_center.y - comp_def.bounds.center.y
          decor_z = post_global_max_z.z - comp_def.bounds.min.z
          
          ProGran3::Logger.info("Позиціонування декору на стовпчик #{index + 1}:", "Loader")
          ProGran3::Logger.info("  - post_local_bounds: #{post_local_bounds}", "Loader")
          ProGran3::Logger.info("  - fence_transform: #{fence_transform}", "Loader")
          ProGran3::Logger.info("  - post_global_center: #{post_global_center}", "Loader")
          ProGran3::Logger.info("  - decor_x: #{decor_x}, decor_y: #{decor_y}, decor_z: #{decor_z}", "Loader")
          
          decor_trans = Geom::Transformation.new([decor_x, decor_y, decor_z])
          decor_instance = entities.add_instance(comp_def, decor_trans)
          
          ProGran3::Logger.info("✅ Декор додано на стовпчик #{index + 1}: x=#{decor_x}, y=#{decor_y}, z=#{decor_z}", "Loader")
        end
        
        # Видаляємо основний екземпляр, оскільки ми створили окремі екземпляри на кожному стовпчику
        if instance && instance.valid?
          instance.erase!
          ProGran3::Logger.info("Основний екземпляр декору видалено, створено #{fence_posts.length} екземплярів на стовпчиках", "Loader")
        else
          ProGran3::Logger.info("Основний екземпляр декору вже видалено або не існує, створено #{fence_posts.length} екземплярів на стовпчиках", "Loader")
        end
      else
        ProGran3::Logger.warn("Не знайдено стовпчиків огорожі для додавання декору", "Loader")
      end
    end
    
    # Діагностика для надгробної плити
    if category == "gravestones"
             flowerbed = entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.downcase.include?('flowerbed') }
       if flowerbed
         puts "Надгробна плита розміщена на південній стороні квітника з вирівнюванням країв: x=#{x}, y=#{y}, z=#{z}"
      else
        stand = last_base_stand_instance
                 if stand
           puts "Надгробна плита розміщена прилягаючи до північної площини підставки (південна сторона плити до північної сторони підставки, на тому ж рівні): x=#{x}, y=#{y}, z=#{z}"
        else
          puts "Надгробна плита розміщена на фундаменті: x=#{x}, y=#{y}, z=#{z}"
        end
      end
      
             # Додаткова діагностика для розуміння позиціонування
       if comp_def && comp_def.bounds
         comp_bounds = comp_def.bounds
         puts "Надгробна плита: південний край (min.x)=#{comp_bounds.min.x}, північний край (max.x)=#{comp_bounds.max.x}, центр (center.x)=#{comp_bounds.center.x}"
         puts "Надгробна плита: західна сторона (min.y)=#{comp_bounds.min.y}, східна сторона (max.y)=#{comp_bounds.max.y}, центр (center.y)=#{comp_bounds.center.y}"
         puts "Надгробна плита: низ (min.z)=#{comp_bounds.min.z}, верх (max.z)=#{comp_bounds.max.z}, центр (center.z)=#{comp_bounds.center.z}"
       end
       
       flowerbed = entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.downcase.include?('flowerbed') }
       if flowerbed
         flowerbed_bounds = flowerbed.bounds
         puts "Квітник: південна сторона (min.x)=#{flowerbed_bounds.min.x}, північна сторона (max.x)=#{flowerbed_bounds.max.x}, центр (center.x)=#{flowerbed_bounds.center.x}"
         puts "Квітник: західна сторона (min.y)=#{flowerbed_bounds.min.y}, східна сторона (max.y)=#{flowerbed_bounds.max.y}, центр (center.y)=#{flowerbed_bounds.center.y}"
         puts "Квітник: низ (min.z)=#{flowerbed_bounds.min.z}, верх (max.z)=#{flowerbed_bounds.max.z}"
       end
      
             stand = last_base_stand_instance
       if stand
         stand_bounds = stand.bounds
         puts "Підставка: південна сторона (min.x)=#{stand_bounds.min.x}, північна сторона (max.x)=#{stand_bounds.max.x}, центр (center.x)=#{stand_bounds.center.x}"
         puts "Підставка: західна сторона (min.y)=#{stand_bounds.min.y}, східна сторона (max.y)=#{stand_bounds.max.y}, центр (center.y)=#{stand_bounds.center.y}"
         puts "Підставка: низ (min.z)=#{stand_bounds.min.z}, верх (max.z)=#{stand_bounds.max.z}, центр (center.z)=#{stand_bounds.center.z}"
       end
    end
    
    instance
  end

  # Додавання парних стел
  def insert_paired_steles(category, filename, distance = 200, central_detail = false, central_detail_width = 200, central_detail_depth = 50, central_detail_height = 1200)
    ProGran3::Logger.info("Додавання парних стел: #{filename}", "Loader")
    
    # Перевірка через ModelStateManager
    unless ModelStateManager.can_add_component?(category.to_sym)
      ProGran3::Logger.error("Неможливо додати компонент: #{category}", "Loader")
      return false
    end
    
    model = Sketchup.active_model
    entities = model.active_entities
    
    # Видаляємо старі стели
    all_instances_by_category(category).each(&:erase!)
    
    # Завантажуємо компонент
    comp_def = load_component(category, filename)
    return false unless comp_def
    
    # Знаходимо поверхню для позиціонування стел (проміжна або підставка)
    placement_surface = get_steles_placement_surface
    unless placement_surface
      ProGran3::Logger.error("Не знайдено поверхню для позиціонування стел", "Loader")
      return false
    end
    
    surface_bounds = placement_surface.bounds
    comp_bounds = comp_def.bounds
    
    # Центральна позиція (як для одинарної стели)
    center_x = surface_bounds.center.x - comp_bounds.center.x
    center_y = surface_bounds.center.y - comp_bounds.center.y
    center_z = surface_bounds.max.z - comp_bounds.min.z
    
    # Спочатку створюємо стели в початкових позиціях
    # Перша стела (по центру підставки)
    first_trans = Geom::Transformation.new([center_x, center_y, center_z])
    first_instance = entities.add_instance(comp_def, first_trans)
    
    # Друга стела (по центру підставки + дзеркальне відображення по Y)
    move_trans = Geom::Transformation.new([center_x, center_y, center_z])
    mirror_trans = Geom::Transformation.scaling([0, 0, 0], 1, -1, 1)
    combined_trans = move_trans * mirror_trans
    second_instance = entities.add_instance(comp_def, combined_trans)
    
    # Розраховуємо точку дотику стел
    first_bounds = first_instance.bounds
    second_bounds = second_instance.bounds
    
    # Знаходимо точку дотику (середню точку між найближчими краями)
    if first_bounds.max.y > second_bounds.min.y
      # Стели перекриваються - точка дотику в центрі перекриття
      touch_point_y = (first_bounds.max.y + second_bounds.min.y) / 2
    else
      # Стели не перекриваються - точка дотику в центрі проміжку
      touch_point_y = (first_bounds.max.y + second_bounds.min.y) / 2
    end
    
    # Розраховуємо зсув для центрування обох стел
    stele_half_width = comp_bounds.height / 2  # Половина ширини стели
    base_shift_y = stele_half_width  # Базовий зсув на половину ширини стели
    
    # Додатковий зсув для розведення стел на задану відстань в кожну сторону
    separation_distance = (distance / 2).mm  # Половина відстані для кожної сторони
    
    ProGran3::Logger.info("Ширина стели: #{comp_bounds.height}мм", "Loader")
    ProGran3::Logger.info("Половина ширини стели: #{stele_half_width}мм", "Loader")
    ProGran3::Logger.info("Загальна відстань між стелами: #{distance}мм", "Loader")
    ProGran3::Logger.info("Відстань розведення в кожну сторону: #{separation_distance}мм", "Loader")
    
    # Видаляємо старі стели
    first_instance.erase!
    second_instance.erase!
    
    # Створюємо стели з правильним зсувом
    # Перша стела (базовий зсув + 100мм для розведення в південь)
    first_y = center_y + base_shift_y + separation_distance
    first_trans_corrected = Geom::Transformation.new([center_x, first_y, center_z])
    first_instance = entities.add_instance(comp_def, first_trans_corrected)
    
    # Друга стела (базовий зсув - 100мм для розведення в північ + дзеркальне відображення)
    second_y = center_y + base_shift_y - separation_distance
    move_trans_corrected = Geom::Transformation.new([center_x, second_y, center_z])
    combined_trans_corrected = move_trans_corrected * mirror_trans
    second_instance = entities.add_instance(comp_def, combined_trans_corrected)
    
    ProGran3::Logger.info("Перша стела: y=#{first_y} (центр + 100мм, південь)", "Loader")
    ProGran3::Logger.info("Друга стела: y=#{second_y} (центр - 100мм, північ)", "Loader")
    ProGran3::Logger.info("Відстань між центрами стел: #{separation_distance * 2}мм", "Loader")
    
    ProGran3::Logger.info("Парні стели додано успішно", "Loader")
    ProGran3::Logger.info("Центр поверхні розміщення: x=#{center_x}, y=#{center_y}, z=#{center_z}", "Loader")
    ProGran3::Logger.info("Точка дотику стел зміщена в центр підставки", "Loader")
    ProGran3::Logger.info("Перша стела: оригінальна орієнтація", "Loader")
    ProGran3::Logger.info("Друга стела: дзеркальне відображення по Y", "Loader")
    
    # Розрахунок точок дотику стел
    ProGran3::Logger.info("=== РОЗРАХУНОК ТОЧОК ДОТИКУ ===", "Loader")
    ProGran3::Logger.info("Межі стели (comp_bounds):", "Loader")
    ProGran3::Logger.info("  min.x=#{comp_bounds.min.x}, max.x=#{comp_bounds.max.x}", "Loader")
    ProGran3::Logger.info("  min.y=#{comp_bounds.min.y}, max.y=#{comp_bounds.max.y}", "Loader")
    ProGran3::Logger.info("  min.z=#{comp_bounds.min.z}, max.z=#{comp_bounds.max.z}", "Loader")
    ProGran3::Logger.info("Ширина стели по Y: #{comp_bounds.height}мм", "Loader")
    ProGran3::Logger.info("Висота стели по Z: #{comp_bounds.depth}мм", "Loader")
    ProGran3::Logger.info("Довжина стели по X: #{comp_bounds.width}мм", "Loader")
    
    # Позиції стел після трансформації
    first_bounds = first_instance.bounds
    second_bounds = second_instance.bounds
    
    ProGran3::Logger.info("Перша стела (після трансформації):", "Loader")
    ProGran3::Logger.info("  min.y=#{first_bounds.min.y}, max.y=#{first_bounds.max.y}", "Loader")
    ProGran3::Logger.info("  центр.y=#{first_bounds.center.y}", "Loader")
    
    ProGran3::Logger.info("Друга стела (після трансформації):", "Loader")
    ProGran3::Logger.info("  min.y=#{second_bounds.min.y}, max.y=#{second_bounds.max.y}", "Loader")
    ProGran3::Logger.info("  центр.y=#{second_bounds.center.y}", "Loader")
    
    # Розрахунок відстані між стелами
    distance_between = (second_bounds.center.y - first_bounds.center.y).abs
    ProGran3::Logger.info("Відстань між центрами стел: #{distance_between}мм", "Loader")
    
    # Перевірка перекриття
    if first_bounds.max.y > second_bounds.min.y
      overlap = first_bounds.max.y - second_bounds.min.y
      ProGran3::Logger.info("ПЕРЕКРИТТЯ: #{overlap}мм", "Loader")
    else
      gap = second_bounds.min.y - first_bounds.max.y
      ProGran3::Logger.info("ПРОМІЖОК: #{gap}мм", "Loader")
    end
    
    # Центральна деталь створюється окремою кнопкою, не при додаванні стел
    
    true
  end

  # Створення центральної деталі
  def create_central_detail(center_x, center_y, center_z, width, depth, height)
    ProGran3::Logger.info("Створення центральної деталі: #{width}×#{depth}×#{height} мм", "Loader")
    
    begin
      model = Sketchup.active_model
      entities = model.active_entities
      
      # Видаляємо старі центральні деталі
      entities.grep(Sketchup::ComponentInstance).find_all { |c| 
        c.definition.name == "CentralDetail"
      }.each(&:erase!)
      
      # Створюємо групу для центральної деталі
      group = entities.add_group
      group.name = "CentralDetail"
      
      # Розраховуємо розміри в SketchUp одиницях
      width_su = width.mm
      depth_su = depth.mm
      height_su = height.mm
      
      # Створюємо прямокутник для основи
      points = [
        [0, 0, 0],
        [width_su, 0, 0],
        [width_su, depth_su, 0],
        [0, depth_su, 0]
      ]
      
      # Додаємо основу
      face = group.entities.add_face(points)
      
      # Видаляємо основу, щоб створити тільки ребра
      face.erase!
      
      # Додаємо ребра
      group.entities.add_line([0, 0, 0], [width_su, 0, 0])
      group.entities.add_line([width_su, 0, 0], [width_su, depth_su, 0])
      group.entities.add_line([width_su, depth_su, 0], [0, depth_su, 0])
      group.entities.add_line([0, depth_su, 0], [0, 0, 0])
      
      # Додаємо вертикальні ребра
      group.entities.add_line([0, 0, 0], [0, 0, height_su])
      group.entities.add_line([width_su, 0, 0], [width_su, 0, height_su])
      group.entities.add_line([width_su, depth_su, 0], [width_su, depth_su, height_su])
      group.entities.add_line([0, depth_su, 0], [0, depth_su, height_su])
      
      # Додаємо верхні ребра
      group.entities.add_line([0, 0, height_su], [width_su, 0, height_su])
      group.entities.add_line([width_su, 0, height_su], [width_su, depth_su, height_su])
      group.entities.add_line([width_su, depth_su, height_su], [0, depth_su, height_su])
      group.entities.add_line([0, depth_su, height_su], [0, 0, height_su])
      
      # Позиціонуємо центральну деталь
      # Центруємо відносно заданої позиції
      group_bounds = group.bounds
      offset_x = center_x - group_bounds.center.x
      offset_y = center_y - group_bounds.center.y
      offset_z = center_z - group_bounds.min.z
      
      transform = Geom::Transformation.new([offset_x, offset_y, offset_z])
      group.transform!(transform)
      
      ProGran3::Logger.info("Центральна деталь створена успішно", "Loader")
      ProGran3::Logger.info("Позиція: x=#{center_x}, y=#{center_y}, z=#{center_z}", "Loader")
      ProGran3::Logger.info("Розміри: #{width}×#{depth}×#{height} мм", "Loader")
      
      true
    rescue => e
      ProGran3::Logger.error("Помилка при створенні центральної деталі: #{e.message}", "Loader")
      false
    end
  end

  # Оновлення розміру підставки
  def update_stand_size(height, width, depth)
    begin
      ProGran3::Logger.info("Оновлення розміру підставки: #{height}×#{width}×#{depth} мм", "Loader")
      
      model = Sketchup.active_model
      entities = model.active_entities
      
      # Знаходимо всі підставки в моделі
      stand_instances = entities.grep(Sketchup::ComponentInstance).find_all { |c| 
        c.definition.name.downcase.include?('stand')
      }
      
      if stand_instances.empty?
        ProGran3::Logger.warn("Не знайдено підставок для оновлення розміру", "Loader")
        return false
      end
      
      ProGran3::Logger.info("Знайдено підставок: #{stand_instances.length}", "Loader")
      
      # Альтернативний підхід: видаляємо старі підставки та створюємо нові з правильними розмірами
      ProGran3::Logger.info("Використовуємо альтернативний підхід: видалення + створення нових", "Loader")
      
      # Зберігаємо позиції та типи підставок
      stand_data = []
      stand_instances.each do |stand_instance|
        if stand_instance && stand_instance.valid?
          stand_data << {
            position: stand_instance.transformation.origin,
            definition_name: stand_instance.definition.name,
            bounds: stand_instance.bounds
          }
          stand_instance.erase!
        end
      end
      
      ProGran3::Logger.info("Видалено старих підставок: #{stand_data.length}", "Loader")
      
      # Створюємо нові підставки з правильними розмірами
      stand_data.each_with_index do |data, index|
        ProGran3::Logger.info("Створюємо нову підставку #{index + 1} з розмірами #{height}×#{width}×#{depth} мм (В×Ш×Д)", "Loader")
        
        # Створюємо простий блок з правильними розмірами
        # Конвертуємо мм в дюйми для SketchUp
        height_inches = height / 25.4
        width_inches = width / 25.4
        depth_inches = depth / 25.4
        
        ProGran3::Logger.info("Розміри в дюймах: #{height_inches.round(3)}×#{width_inches.round(3)}×#{depth_inches.round(3)} (В×Ш×Д)", "Loader")
        
        # Створюємо новий компонент
        new_comp = model.definitions.add("Stand_#{index + 1}_#{height}x#{width}x#{depth}")
        
        # Додаємо геометрію (простий блок з правильною орієнтацією)
        # В×Ш×Д (Height×Width×Depth) -> Z×X×Y
        points = [
          [0, 0, 0],                    # 0: лівий-передній-нижній
          [width_inches, 0, 0],         # 1: правий-передній-нижній (X = ширина)
          [width_inches, depth_inches, 0], # 2: правий-задній-нижній (Y = довжина)
          [0, depth_inches, 0],         # 3: лівий-задній-нижній
          [0, 0, height_inches],        # 4: лівий-передній-верхній (Z = висота)
          [width_inches, 0, height_inches], # 5: правий-передній-верхній
          [width_inches, depth_inches, height_inches], # 6: правий-задній-верхній
          [0, depth_inches, height_inches]  # 7: лівий-задній-верхній
        ]
        
        # Створюємо грані з правильною орієнтацією (за годинниковою стрілкою для зовнішньої сторони)
        faces = [
          [0, 1, 2, 3], # низ (Z=0)
          [4, 7, 6, 5], # верх (Z=height)
          [0, 4, 5, 1], # перед (Y=0)
          [2, 6, 7, 3], # зад (Y=depth)
          [0, 3, 7, 4], # лівий (X=0)
          [1, 5, 6, 2]  # правий (X=width)
        ]
        
        # Створюємо грані
        faces.each do |face_points|
          face = new_comp.entities.add_face(
            face_points.map { |i| points[i] }
          )
          # Перевіряємо орієнтацію грані
          if face && face.normal.z < 0
            face.reverse!
          end
        end
        
        # Розміщуємо нову підставку в тій же позиції
        transformation = Geom::Transformation.new(data[:position])
        entities.add_instance(new_comp, transformation)
        
        ProGran3::Logger.info("Підставка #{index + 1} створена успішно", "Loader")
      end
      
      ProGran3::Logger.info("Всі підставки оновлені успішно", "Loader")
      true
      
    rescue => e
      ProGran3::Logger.error("Помилка при оновленні розміру підставки: #{e.message}", "Loader")
      ProGran3::Logger.error("Stack trace: #{e.backtrace.join('\n')}", "Loader")
      false
    end
  end

  # Створення підставки з кастомними розмірами
  def create_stand_with_dimensions(height, width, depth, gaps = false, gaps_height = 0, gaps_width = 0, gaps_depth = 0)
    begin
      ProGran3::Logger.info("Створення підставки з розмірами: #{height}×#{width}×#{depth} мм, проміжна: #{gaps ? 'увімкнено' : 'вимкнено'}", "Loader")
      if gaps
        ProGran3::Logger.info("Розміри проміжної: #{gaps_height}×#{gaps_width}×#{gaps_depth} мм", "Loader")
      end
      
      model = Sketchup.active_model
      entities = model.active_entities
      defs = model.definitions
      
      # Видаляємо старі компоненти підставки
      entities.grep(Sketchup::ComponentInstance).select { |c| c.definition.name == "Stand" }.each(&:erase!)
      
      # Видаляємо старі проміжні (завжди, незалежно від того, чи створюємо нову)
      old_gaps = entities.grep(Sketchup::ComponentInstance).select { |c| c.definition.name == "StandGaps" }
      if old_gaps.any?
        ProGran3::Logger.info("Видаляємо #{old_gaps.length} старих проміжних", "Loader")
        old_gaps.each(&:erase!)
      end
      
      # Очищаємо невикористані визначення
      defs.purge_unused
      
      # Створюємо новий компонент підставки
      comp_def = defs.add("Stand")
      
      # Створюємо геометрію підставки
      # Довжина (depth) по осі Y, ширина (width) по осі X
      points = [
        Geom::Point3d.new(0, 0, 0),
        Geom::Point3d.new(width.mm, 0, 0),
        Geom::Point3d.new(width.mm, depth.mm, 0),
        Geom::Point3d.new(0, depth.mm, 0)
      ]
      
      face = comp_def.entities.add_face(points)
      face.reverse! if face.normal.z < 0
      face.pushpull(height.mm)
      
      # Позиціонування підставки (як в insert_component)
      foundation = entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name == "Foundation" }
      x, y, z = 0, 0, 0
      foundation_z = 0
      foundation_bounds = nil
      
      if foundation
        foundation_bounds = foundation.bounds
        foundation_z = foundation_bounds.max.z
        
        # Позиціонування підставки відносно фундаменту та плитки
        placement_z = foundation_z
        tile_instance = entities.grep(Sketchup::ComponentInstance).find { |inst| 
          inst.definition.name.start_with?("Perimeter_Tile_") || inst.definition.name.start_with?("Modular_Tile") 
        }
        if tile_instance
          placement_z = tile_instance.bounds.max.z
        end
        
        x = (foundation_bounds.min.x + 300.mm) - comp_def.bounds.min.x
        y = foundation_bounds.center.y - comp_def.bounds.center.y
        z = placement_z - comp_def.bounds.min.z
      else
        # Якщо немає фундаменту, розміщуємо в центрі
        x = 0 - comp_def.bounds.center.x
        y = 0 - comp_def.bounds.center.y
        z = 0 - comp_def.bounds.min.z
      end
      
      # Додаємо екземпляр компонента до моделі з правильним позиціонуванням
      transform = Geom::Transformation.new([x, y, z])
      stand_instance = entities.add_instance(comp_def, transform)
      
      # Створюємо проміжну якщо увімкнено
      if gaps
        create_stand_gaps(stand_instance, gaps_height, gaps_width, gaps_depth)
      end
      
      ProGran3::Logger.success("Підставка створена з розмірами #{height}×#{width}×#{depth} мм", "Loader")
      true
      
    rescue => e
      ProGran3::Logger.error("Помилка при створенні підставки: #{e.message}", "Loader")
      ProGran3::Logger.error("Stack trace: #{e.backtrace.join('\n')}", "Loader")
      false
    end
  end

  # Створення проміжної для підставки
  def create_stand_gaps(stand_instance, gaps_height, gaps_width, gaps_depth)
    begin
      ProGran3::Logger.info("Створення проміжної з розмірами: #{gaps_height}×#{gaps_width}×#{gaps_depth} мм", "Loader")
      
      model = Sketchup.active_model
      entities = model.active_entities
      defs = model.definitions
      
      # Старі проміжні вже видалені в create_stand_with_dimensions
      ProGran3::Logger.info("Створюємо нову проміжну", "Loader")
      
      # Створюємо новий компонент проміжної
      gaps_def = defs.add("StandGaps")
      
      # Створюємо геометрію проміжної з окремими розмірами
      points = [
        Geom::Point3d.new(0, 0, 0),
        Geom::Point3d.new(gaps_width.mm, 0, 0),
        Geom::Point3d.new(gaps_width.mm, gaps_depth.mm, 0),
        Geom::Point3d.new(0, gaps_depth.mm, 0)
      ]
      
      face = gaps_def.entities.add_face(points)
      face.reverse! if face.normal.z < 0
      face.pushpull(gaps_height.mm)  # Товщина проміжної
      
      # Позиціонування проміжної зверху на підставці
      # Використовуємо базову підставку для позиціонування
      base_stand = last_base_stand_instance
      if base_stand
        stand_bounds = base_stand.bounds
      else
        stand_bounds = stand_instance.bounds
      end
      
      gaps_x = stand_bounds.center.x - gaps_def.bounds.center.x
      gaps_y = stand_bounds.center.y - gaps_def.bounds.center.y
      gaps_z = stand_bounds.max.z - gaps_def.bounds.min.z  # Зверху на підставці
      
      gaps_transform = Geom::Transformation.new([gaps_x, gaps_y, gaps_z])
      entities.add_instance(gaps_def, gaps_transform)
      
      ProGran3::Logger.success("Проміжна створена з розмірами #{gaps_height}×#{gaps_width}×#{gaps_depth} мм", "Loader")
      
    rescue => e
      ProGran3::Logger.error("Помилка при створенні проміжної: #{e.message}", "Loader")
      ProGran3::Logger.error("Stack trace: #{e.backtrace.join('\n')}", "Loader")
    end
  end

  # Перевірка, чи потрібно перебудовувати залежні компоненти
  def needs_rebuild_dependents?(category)
    # Компоненти, які потребують перебудови залежних елементів
    rebuild_required_categories = [:foundation, :stands, :steles, :gravestones]
    
    return false unless rebuild_required_categories.include?(category.to_sym)
    
    # Перевіряємо, чи є залежні компоненти
    dependent_components = ModelStateManager.find_dependent_components(category.to_sym)
    has_dependents = dependent_components.any? { |comp| ModelStateManager.model_state[comp][:exists] }
    
    ProGran3::Logger.info("Перевірка перебудови для #{category}: залежні компоненти = #{dependent_components}, існують = #{has_dependents}", "Loader")
    has_dependents
  end
  
  # Перебудова залежних компонентів після зміни базового
  def rebuild_dependents_after_change(category, filename)
    ProGran3::Logger.info("Початок перебудови залежних компонентів для #{category}", "Loader")
    
    begin
      # Зберігаємо параметри користувача для залежних компонентів
      user_params = ModelStateManager.save_user_parameters_for_dependents(category.to_sym)
      
      if user_params.empty?
        ProGran3::Logger.info("Немає залежних компонентів для перебудови", "Loader")
        return true
      end
      
      ProGran3::Logger.info("Збережено параметри для компонентів: #{user_params.keys.join(', ')}", "Loader")
      
      # Оновлюємо базовий компонент
      update_base_component(category, filename)
      
      # Перебудовуємо залежні компоненти з збереженими параметрами
      rebuild_dependent_components_with_params(user_params)
      
      ProGran3::Logger.info("Перебудова залежних компонентів завершена успішно", "Loader")
      true
      
    rescue => e
      ProGran3::Logger.error("Помилка перебудови залежних компонентів: #{e.message}", "Loader")
      ProGran3::Logger.error("Stack trace: #{e.backtrace.join('\n')}", "Loader")
      false
    end
  end
  
  # Оновлення базового компонента
  def update_base_component(category, filename)
    ProGran3::Logger.info("Оновлення базового компонента: #{category}", "Loader")
    
    model = Sketchup.active_model
    entities = model.active_entities
    
    # Видаляємо старі екземпляри
    all_instances_by_category(category).each(&:erase!)
    
    # Завантажуємо новий компонент
    comp_def = load_component(category, filename)
    return false unless comp_def
    
    # Розраховуємо нову позицію
    x, y, z = calculate_component_position(category, comp_def, entities)
    
    # Додаємо новий екземпляр
    trans = Geom::Transformation.new([x, y, z])
    instance = entities.add_instance(comp_def, trans)
    
    # Оновлюємо стан в ModelStateManager
    ModelStateManager.component_added(category.to_sym, { filename: filename })
    
    ProGran3::Logger.info("Базовий компонент #{category} оновлено", "Loader")
    true
  end
  
  # Перебудова залежних компонентів з параметрами
  def rebuild_dependent_components_with_params(user_params)
    ProGran3::Logger.info("Перебудова залежних компонентів з параметрами", "Loader")
    
    user_params.each do |component, params|
      ProGran3::Logger.info("Перебудова компонента #{component} з параметрами: #{params.keys.join(', ')}", "Loader")
      
      begin
        # Видаляємо старий компонент
        all_instances_by_category(component.to_s).each(&:erase!)
        
        # Завантажуємо компонент з збереженим ім'ям файлу
        if params[:filename]
          comp_def = load_component(component.to_s, params[:filename])
          if comp_def
            # Розраховуємо позицію
            x, y, z = calculate_component_position(component.to_s, comp_def, Sketchup.active_model.active_entities)
            
            # Додаємо новий екземпляр
            trans = Geom::Transformation.new([x, y, z])
            instance = Sketchup.active_model.active_entities.add_instance(comp_def, trans)
            
            # Оновлюємо стан
            ModelStateManager.component_added(component, params[:params] || {})
            
            # Застосовуємо спеціальні налаштування
            apply_component_specific_settings(component, params)
            
            ProGran3::Logger.info("Компонент #{component} перебудовано успішно", "Loader")
          else
            ProGran3::Logger.warn("Не вдалося завантажити компонент #{component} з файлу #{params[:filename]}", "Loader")
          end
        end
        
      rescue => e
        ProGran3::Logger.error("Помилка перебудови компонента #{component}: #{e.message}", "Loader")
      end
    end
    
    true
  end
  
  # Застосування спеціальних налаштувань компонента
  def apply_component_specific_settings(component, params)
    case component
    when :stands
      if params[:gaps]
        # Застосовуємо налаштування проміжків
        apply_stands_gaps_settings(params[:gaps])
      end
    when :steles
      if params[:type] || params[:distance] || params[:central_detail]
        # Застосовуємо налаштування стел
        apply_steles_specific_settings(params)
      end
    when :lamps
      if params[:position_type]
        # Застосовуємо позицію лампадки
        apply_lamp_position_settings(params[:position_type])
      end
    end
  end
  
  # Застосування налаштувань проміжків підставки
  def apply_stands_gaps_settings(gaps)
    # Логіка застосування проміжків
    ProGran3::Logger.info("Застосування налаштувань проміжків підставки: #{gaps}", "Loader")
    # Тут можна додати специфічну логіку для проміжків
  end
  
  # Застосування специфічних налаштувань стел
  def apply_steles_specific_settings(params)
    ProGran3::Logger.info("Застосування налаштувань стел: #{params.keys.join(', ')}", "Loader")
    # Тут можна додати специфічну логіку для стел
  end
  
  # Застосування налаштувань позиції лампадки
  def apply_lamp_position_settings(position_type)
    ProGran3::Logger.info("Застосування позиції лампадки: #{position_type}", "Loader")
    # Тут можна додати специфічну логіку для позиції лампадки
  end

  private

  # Розрахунок позиції компонента (усуває дублювання логіки)
  def calculate_component_position(category, comp_def, entities)
    foundation = entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name == "Foundation" }
    
    if !foundation
      # Якщо немає фундаменту, розміщуємо в центрі
      return [
        0 - comp_def.bounds.center.x,
        0 - comp_def.bounds.center.y,
        0 - comp_def.bounds.min.z
      ]
    end
    
    foundation_bounds = foundation.bounds
    foundation_z = foundation_bounds.max.z
    
    case category
    when "stands"
      calculate_stand_position(comp_def, foundation_bounds, foundation_z, entities)
    when "steles"
      calculate_stele_position(comp_def, entities)
    when "flowerbeds"
      calculate_flowerbed_position(comp_def, foundation_z, entities)
    when "gravestones"
      calculate_gravestone_position(comp_def, entities)
    when "fence_decor"
      calculate_fence_decor_position(comp_def, foundation_bounds, foundation_z, entities)
    else
      [0, 0, 0]
    end
  end

  # Розрахунок позиції підставки
  def calculate_stand_position(comp_def, foundation_bounds, foundation_z, entities)
    placement_z = get_placement_z(foundation_z, entities)
    [
      (foundation_bounds.min.x + 300.mm) - comp_def.bounds.min.x,
      foundation_bounds.center.y - comp_def.bounds.center.y,
      placement_z - comp_def.bounds.min.z
    ]
  end

  # Розрахунок позиції стели
  def calculate_stele_position(comp_def, entities)
    ProGran3::Logger.info("🔍 Розрахунок позиції стели: #{comp_def.name}", "Loader")
    
    # Діагностика bounds компонента
    bounds = comp_def.bounds
    ProGran3::Logger.info("📐 Bounds стели: width=#{bounds.width.to_mm.round}mm, height=#{bounds.height.to_mm.round}mm, depth=#{bounds.depth.to_mm.round}mm", "Loader")
    ProGran3::Logger.info("📐 Bounds min: #{bounds.min}", "Loader")
    ProGran3::Logger.info("📐 Bounds max: #{bounds.max}", "Loader")
    
    # Перевіряємо, чи bounds не занадто великий
    if bounds.width > 2000.mm || bounds.height > 2000.mm || bounds.depth > 2000.mm
      ProGran3::Logger.warn("⚠️ Bounds стели занадто великий! Можливо, потрібна нормалізація", "Loader")
    end
    
    placement_surface = get_steles_placement_surface
    if placement_surface
      surface_bounds = placement_surface.bounds
      position = [
        surface_bounds.center.x - comp_def.bounds.center.x,
        surface_bounds.center.y - comp_def.bounds.center.y,
        surface_bounds.max.z - comp_def.bounds.min.z
      ]
      ProGran3::Logger.info("✅ Позиція на поверхні: #{position}", "Loader")
      ProGran3::Logger.info("📐 Поверхня: center(#{surface_bounds.center.x}, #{surface_bounds.center.y}, #{surface_bounds.center.z})", "Loader")
      ProGran3::Logger.info("📐 Компонент: center(#{comp_def.bounds.center.x}, #{comp_def.bounds.center.y}, #{comp_def.bounds.center.z})", "Loader")
      position
    else
      stand = last_base_stand_instance
      if stand
        stand_bounds = stand.bounds
        position = [
          stand_bounds.center.x - comp_def.bounds.center.x,
          stand_bounds.center.y - comp_def.bounds.center.y,
          stand_bounds.max.z - comp_def.bounds.min.z
        ]
        ProGran3::Logger.info("✅ Позиція на підставці: #{position}", "Loader")
        ProGran3::Logger.info("📐 Підставка: center(#{stand_bounds.center.x}, #{stand_bounds.center.y}, #{stand_bounds.center.z})", "Loader")
        position
      else
        ProGran3::Logger.error("❌ Немає поверхні для позиціонування стели! Розміщуємо в [0,0,0]", "Loader")
        [0, 0, 0]
      end
    end
  end

  # Розрахунок позиції квітника
  def calculate_flowerbed_position(comp_def, foundation_z, entities)
    placement_z = get_placement_z(foundation_z, entities)
    stand = last_base_stand_instance
    if stand
      stand_bounds = stand.bounds
      comp_bounds = comp_def.bounds
      insert_x = stand_bounds.min.x + stand_bounds.width
      center_y_stand = stand_bounds.center.y
      center_y_comp = comp_bounds.center.y
      [
        insert_x - comp_bounds.min.x,
        center_y_stand - center_y_comp,
        placement_z - comp_bounds.min.z
      ]
    else
      [0, 0, 0]
    end
  end

  # Розрахунок позиції надгробної плити
  def calculate_gravestone_position(comp_def, entities)
    stand = last_base_stand_instance
    if stand
      stand_bounds = stand.bounds
      comp_bounds = comp_def.bounds
      
      # Шукаємо квітник
      flowerbed = entities.grep(Sketchup::ComponentInstance).find { |c| c.definition.name.downcase.include?('flowerbed') }
      if flowerbed
        flowerbed_bounds = flowerbed.bounds
        [
          flowerbed_bounds.min.x - comp_bounds.min.x,
          flowerbed_bounds.center.y - comp_bounds.center.y,
          flowerbed_bounds.max.z - comp_bounds.min.z
        ]
      else
        [
          stand_bounds.max.x - comp_bounds.min.x,
          stand_bounds.center.y - comp_bounds.center.y,
          stand_bounds.min.z - comp_bounds.min.z
        ]
      end
    else
      [0, 0, 0]
    end
  end

  # Розрахунок позиції декору огорожі
  def calculate_fence_decor_position(comp_def, foundation_bounds, foundation_z, entities)
    fence_posts = entities.grep(Sketchup::ComponentInstance).find_all { |c| 
      c.definition.name.include?('Fence') && c.definition.name.include?('Post')
    }
    
    if fence_posts.any?
      post = fence_posts.first
      post_bounds = post.bounds
      [
        post_bounds.center.x - comp_def.bounds.center.x,
        post_bounds.center.y - comp_def.bounds.center.y,
        post_bounds.max.z - comp_def.bounds.min.z
      ]
    else
      [
        foundation_bounds.center.x - comp_def.bounds.center.x,
        foundation_bounds.center.y - comp_def.bounds.center.y,
        foundation_bounds.max.z - comp_def.bounds.min.z
      ]
    end
  end

  # Нормалізація bounds компонента (виправляє занадто великі bounds)
  def normalize_component_bounds(comp_def)
    ProGran3::Logger.info("🔧 Нормалізація bounds компонента: #{comp_def.name}", "Loader")
    
    bounds = comp_def.bounds
    original_bounds = {
      width: bounds.width,
      height: bounds.height,
      depth: bounds.depth
    }
    
    ProGran3::Logger.info("📐 Оригінальні bounds: width=#{bounds.width.to_mm.round}mm, height=#{bounds.height.to_mm.round}mm, depth=#{bounds.depth.to_mm.round}mm", "Loader")
    
    # Якщо bounds занадто великий, намагаємося його виправити
    if bounds.width > 2000.mm || bounds.height > 2000.mm || bounds.depth > 2000.mm
      ProGran3::Logger.warn("⚠️ Bounds занадто великий, намагаємося виправити", "Loader")
      
      # Очищаємо bounds компонента
      clean_component_bounds(comp_def)
    end
    
    ProGran3::Logger.info("✅ Bounds нормалізовано", "Loader")
    comp_def
  end

  # Очищення bounds компонента (видаляє зайві елементи)
  def clean_component_bounds(comp_def)
    ProGran3::Logger.info("🧹 Очищення bounds компонента: #{comp_def.name}", "Loader")
    
    # Спочатку видаляємо Section planes
    remove_section_planes_from_component(comp_def)
    
    entities = comp_def.entities
    all_entities = entities.to_a
    
    ProGran3::Logger.info("📊 Всього елементів в компоненті: #{all_entities.length}", "Loader")
    
    # Знаходимо тільки видимі геометрії (без прихованих, допоміжних ліній, тощо)
    visible_entities = all_entities.select do |entity|
      # Пропускаємо приховані елементи
      next false if entity.hidden?
      
      # Пропускаємо допоміжні лінії та точки
      next false if entity.is_a?(Sketchup::ConstructionLine) || entity.is_a?(Sketchup::ConstructionPoint)
      
      # Пропускаємо тексти та анотації
      next false if entity.is_a?(Sketchup::Text) || entity.is_a?(Sketchup::Dimension)
      
      # Пропускаємо групи без геометрії
      if entity.is_a?(Sketchup::Group)
        next false if entity.entities.length == 0
      end
      
      # Пропускаємо компоненти без геометрії
      if entity.is_a?(Sketchup::ComponentInstance)
        next false if entity.definition.entities.length == 0
      end
      
      true
    end
    
    ProGran3::Logger.info("📊 Видимих елементів: #{visible_entities.length}", "Loader")
    
    if visible_entities.any?
      # Розраховуємо нові bounds на основі тільки видимої геометрії
      min_point = Geom::Point3d.new(Float::INFINITY, Float::INFINITY, Float::INFINITY)
      max_point = Geom::Point3d.new(-Float::INFINITY, -Float::INFINITY, -Float::INFINITY)
      
      visible_entities.each do |entity|
        if entity.respond_to?(:bounds)
          entity_bounds = entity.bounds
          min_point.x = [min_point.x, entity_bounds.min.x].min
          min_point.y = [min_point.y, entity_bounds.min.y].min
          min_point.z = [min_point.z, entity_bounds.min.z].min
          max_point.x = [max_point.x, entity_bounds.max.x].max
          max_point.y = [max_point.y, entity_bounds.max.y].max
          max_point.z = [max_point.z, entity_bounds.max.z].max
        end
      end
      
      # Якщо знайшли реальні bounds
      if min_point.x != Float::INFINITY
        new_bounds = Geom::BoundingBox.new
        new_bounds.add(min_point)
        new_bounds.add(max_point)
        
        ProGran3::Logger.info("✅ Очищені bounds: width=#{new_bounds.width.to_mm.round}mm, height=#{new_bounds.height.to_mm.round}mm, depth=#{new_bounds.depth.to_mm.round}mm", "Loader")
        
        # Порівняння з оригінальними bounds
        original_bounds = comp_def.bounds
        ProGran3::Logger.info("📊 Порівняння bounds:", "Loader")
        ProGran3::Logger.info("  Оригінал: width=#{original_bounds.width.to_mm.round}mm, height=#{original_bounds.height.to_mm.round}mm, depth=#{original_bounds.depth.to_mm.round}mm", "Loader")
        ProGran3::Logger.info("  Очищено: width=#{new_bounds.width.to_mm.round}mm, height=#{new_bounds.height.to_mm.round}mm, depth=#{new_bounds.depth.to_mm.round}mm", "Loader")
        
        # Розрахунок економії простору
        width_saved = original_bounds.width - new_bounds.width
        height_saved = original_bounds.height - new_bounds.height
        depth_saved = original_bounds.depth - new_bounds.depth
        
        ProGran3::Logger.info("💰 Економія простору: width=#{width_saved.to_mm.round}mm, height=#{height_saved.to_mm.round}mm, depth=#{depth_saved.to_mm.round}mm", "Loader")
      else
        ProGran3::Logger.warn("⚠️ Не вдалося розрахувати нові bounds", "Loader")
      end
    else
      ProGran3::Logger.warn("⚠️ Не знайдено видимих елементів для розрахунку bounds", "Loader")
    end
  end

  # Видалення Section planes з компонента
  def remove_section_planes_from_component(comp_def)
    ProGran3::Logger.info("✂️ Видалення Section planes з компонента: #{comp_def.name}", "Loader")
    
    begin
      entities = comp_def.entities
      all_entities = entities.to_a
      
      # Знаходимо всі Section planes
      section_planes = all_entities.select { |entity| entity.is_a?(Sketchup::SectionPlane) }
      
      if section_planes.any?
        ProGran3::Logger.info("📊 Знайдено Section planes: #{section_planes.length}", "Loader")
        
        # Видаляємо всі Section planes
        section_planes.each do |section_plane|
          if section_plane && section_plane.valid?
            section_plane.erase!
            ProGran3::Logger.info("✅ Section plane видалено", "Loader")
          end
        end
        
        ProGran3::Logger.success("✅ Видалено #{section_planes.length} Section planes", "Loader")
      else
        ProGran3::Logger.info("ℹ️ Section planes не знайдено", "Loader")
      end
      
      # Також перевіряємо в підкомпонентах
      component_instances = all_entities.select { |entity| entity.is_a?(Sketchup::ComponentInstance) }
      component_instances.each do |instance|
        if instance.definition && instance.definition.valid?
          remove_section_planes_from_component(instance.definition)
        end
      end
      
    rescue => e
      ProGran3::Logger.error("❌ Помилка при видаленні Section planes: #{e.message}", "Loader")
    end
  end

  # Примусове оновлення bounds компонента (створює новий компонент з правильними bounds)
  def force_update_component_bounds(comp_def)
    ProGran3::Logger.info("🔄 Примусове оновлення bounds компонента: #{comp_def.name}", "Loader")
    
    begin
      # Спочатку видаляємо Section planes з оригінального компонента
      remove_section_planes_from_component(comp_def)
      
      # Створюємо новий компонент з тим же ім'ям
      model = Sketchup.active_model
      defs = model.definitions
      
      # Зберігаємо оригінальне ім'я
      original_name = comp_def.name
      
      # Створюємо тимчасове ім'я
      temp_name = "#{original_name}_temp_#{Time.now.to_i}"
      
      # Копіюємо компонент з новим ім'ям
      new_comp_def = defs.add(temp_name)
      
      # Копіюємо всі елементи (крім Section planes)
      comp_def.entities.each do |entity|
        # Пропускаємо Section planes
        next if entity.is_a?(Sketchup::SectionPlane)
        
        if entity.is_a?(Sketchup::ComponentInstance)
          new_comp_def.entities.add_instance(entity.definition, entity.transformation)
        elsif entity.is_a?(Sketchup::Group)
          new_group = new_comp_def.entities.add_group
          new_group.entities.add_face(entity.entities.grep(Sketchup::Face))
        else
          # Копіюємо інші елементи
          new_comp_def.entities.add_face(entity.entities.grep(Sketchup::Face)) if entity.respond_to?(:entities)
        end
      end
      
      # Видаляємо старий компонент
      defs.purge(comp_def)
      
      # Перейменовуємо новий компонент
      new_comp_def.name = original_name
      
      ProGran3::Logger.success("✅ Bounds компонента оновлено примусово", "Loader")
      new_comp_def
      
    rescue => e
      ProGran3::Logger.error("❌ Помилка примусового оновлення bounds: #{e.message}", "Loader")
      comp_def
    end
  end

  # Отримання Z координати для розміщення (усуває дублювання)
  def get_placement_z(foundation_z, entities)
    placement_z = foundation_z
    tile_instance = entities.grep(Sketchup::ComponentInstance).find { |inst| 
      inst.definition.name.start_with?("Perimeter_Tile_") || inst.definition.name.start_with?("Modular_Tile") 
    }
    if tile_instance
      placement_z = tile_instance.bounds.max.z
    end
    placement_z
  end
end