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

  # Спеціальна функція для додавання декору на всі стовпчики огорожі
  def add_fence_decor_to_all_posts(filename)
    ProGran3::Logger.info("Додавання декору на всі стовпчики огорожі: #{filename}", "Loader")
    
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
    
    ProGran3::Logger.info("Знайдено #{fence_posts.length} стовпчиків огорожі", "Loader")
    
    # Додаємо декор на кожен стовпчик
    fence_posts.each_with_index do |post, index|
      post_bounds = post.bounds
      decor_x = post_bounds.center.x - comp_def.bounds.center.x
      decor_y = post_bounds.center.y - comp_def.bounds.center.y
      decor_z = post_bounds.max.z - comp_def.bounds.min.z
      
      decor_trans = Geom::Transformation.new([decor_x, decor_y, decor_z])
      decor_instance = entities.add_instance(comp_def, decor_trans)
      
      ProGran3::Logger.info("Декор додано на стовпчик #{index + 1}: x=#{decor_x}, y=#{decor_y}, z=#{decor_z}", "Loader")
    end
    
    ProGran3::Logger.info("Декор успішно додано на #{fence_posts.length} стовпчиків", "Loader")
    true
  end

  def insert_component(category, filename)
    # Перевірка через ModelStateManager
    unless ModelStateManager.can_add_component?(category.to_sym)
      ProGran3::Logger.error("Неможливо додати компонент: #{category}", "Loader")
      return false
    end
    
    model = Sketchup.active_model
    entities = model.active_entities
    all_instances_by_category(category).each(&:erase!)
    comp_def = load_component(category, filename)
    return false unless comp_def
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
        elsif category == "fence_decor"
          # Для декору огорожі позиціонуємо на всіх стовпчиках огорожі
          # Шукаємо стовпчики огорожі
          fence_posts = entities.grep(Sketchup::ComponentInstance).find_all { |c| 
            c.definition.name.include?('Fence') && c.definition.name.include?('Post')
          }
          if fence_posts.any?
            # Позиціонуємо на першому знайденому стовпчику (основний екземпляр)
            post = fence_posts.first
            post_bounds = post.bounds
            x = post_bounds.center.x - comp_bounds.center.x
            y = post_bounds.center.y - comp_bounds.center.y
            z = post_bounds.max.z - comp_bounds.min.z  # На верхній частині стовпчика
          else
            # Якщо немає стовпчиків, розміщуємо в центрі фундаменту
            if foundation
              x = foundation_bounds.center.x - comp_bounds.center.x
              y = foundation_bounds.center.y - comp_bounds.center.y
              z = foundation_bounds.max.z - comp_bounds.min.z
            end
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
      elsif category == "fence_decor"
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
        stand = last_stand_instance
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
end