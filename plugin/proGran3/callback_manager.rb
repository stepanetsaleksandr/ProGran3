# progran3/callback_manager.rb
module ProGran3
  module CallbackManager
    extend self
    
    # Підключення ModelStateManager
    require_relative 'model_state_manager'
    # Підключення FenceBuilder
    require_relative 'builders/fence_builder'

    # Уніфікована валідація розмірів
    def validate_dimensions_callback(depth, width, height, context)
      validation_result = Validation.validate_dimensions(depth.to_i, width.to_i, height.to_i, context)
      unless validation_result.valid
        ErrorHandler.handle_error(
          Validation::ValidationError.new("Помилка валідації #{context}: #{validation_result.error_messages.join(', ')}"),
          "UI",
          context
        )
        return false
      end
      true
    end

    # Callback для фундаменту
    def add_foundation_callback(dialog, depth, width, height)
      return false unless validate_dimensions_callback(depth, width, height, "фундаменту")
      
      # Зберігаємо параметри фундаменту
      @foundation_params = {
        depth: depth.to_i,
        width: width.to_i,
        height: height.to_i
      }
      
      # Створюємо фундамент з координацією всіх елементів
      success = CoordinationManager.update_all_elements(@foundation_params)
      
      if success
        # Оновлення стану через ModelStateManager
        ModelStateManager.component_added(:foundation, @foundation_params)
      end
      
      success
    end

    # Callback для підставки
    def add_stand_callback(dialog, height, width, depth, gaps = false, gaps_height = 0, gaps_width = 0, gaps_depth = 0)
      return false unless validate_dimensions_callback(depth, width, height, "підставки")
      
      # Зберігаємо параметри підставки
      @stand_params = {
        height: height.to_i,
        width: width.to_i,
        depth: depth.to_i,
        gaps: gaps,
        gaps_height: gaps_height.to_i,
        gaps_width: gaps_width.to_i,
        gaps_depth: gaps_depth.to_i
      }
      
      # Створюємо підставку з координацією залежних елементів
      success = CoordinationManager.update_stand_dependents(@stand_params)
      
      if success
        # Оновлення стану через ModelStateManager
        ModelStateManager.component_added(:stands, @stand_params)
      end
      
      success
    end

    # Callback для плитки
    def add_tiles_callback(dialog, type, *params)
      case type
      when "frame"
        add_tiles_frame_callback(dialog, *params)
      when "modular"
        add_tiles_modular_callback(dialog, *params)
      else
        ErrorHandler.handle_error(
          StandardError.new("Невідомий тип плитки: #{type}"),
          "UI",
          "add_tiles"
        )
        false
      end
    end

    # Callback для рамкової плитки
    def add_tiles_frame_callback(dialog, thickness, borderWidth, overhang, seam = 2)
      thickness, borderWidth, overhang, seam = [thickness, borderWidth, overhang, seam].map(&:to_i)
      
      return false unless validate_dimensions_callback(borderWidth, overhang, thickness, "периметральної плитки")
      
      # Зберігаємо параметри для автоматичного оновлення
      @tiles_params = {
        mode: 'frame',
        thickness: thickness,
        border_width: borderWidth,
        overhang: overhang,
        seam: seam
      }
      
      success = ProGran3::TilingBuilder.insert_perimeter_tiles(thickness, borderWidth, overhang, seam)
      
      if success
        # Оновлення стану через ModelStateManager
        ModelStateManager.component_added(:tiles, @tiles_params)
      end
      
      success
    end

    # Callback для модульної плитки
    def add_tiles_modular_callback(dialog, tileSize, thickness, seam, overhang)
      thickness, seam, overhang = [thickness, seam, overhang].map(&:to_i)
      
      return false unless validate_dimensions_callback(100, 100, thickness, "модульної плитки")
      
      # Зберігаємо параметри для автоматичного оновлення
      @tiles_params = {
        mode: 'modular',
        tile_size: tileSize,
        thickness: thickness,
        seam: seam,
        overhang: overhang
      }
      
      success = ProGran3::TilingBuilder.insert_modular_tiles(tileSize, thickness, seam, overhang)
      
      if success
        # Оновлення стану через ModelStateManager
        ModelStateManager.component_added(:tiles, @tiles_params)
      end
      
      success
    end

    # Callback для облицювання
    def add_cladding_callback(dialog, thickness)
      thickness = thickness.to_i
      
      return false unless validate_dimensions_callback(100, 100, thickness, "облицювання")
      
      # Зберігаємо параметри для автоматичного оновлення
      @cladding_params = { thickness: thickness }
      
      success = ProGran3::CladdingBuilder.create(thickness)
      
      if success
        # Оновлення стану через ModelStateManager
        ModelStateManager.component_added(:cladding, @cladding_params)
      end
      
      success
    end

    # Callback для відмостки
    def add_blind_area_callback(dialog, thickness, mode, *width_params)
      thickness = thickness.to_i
      
      return false unless validate_dimensions_callback(100, 100, thickness, "відмостки")
      
      # Зберігаємо параметри для автоматичного оновлення
      @blind_area_params = {
        thickness: thickness,
        mode: mode,
        widths: width_params.map(&:to_i)
      }
      
      success = case mode
      when "uniform"
        ProGran3::BlindAreaBuilder.create_uniform(width_params[0].to_i, thickness)
      when "custom"
        ProGran3::BlindAreaBuilder.create(*width_params.map(&:to_i), thickness)
      end
      
      if success
        # Оновлення стану через ModelStateManager
        ModelStateManager.component_added(:blind_area, @blind_area_params)
      end
      
      success
    end

    # Callback для додавання декору огорожі на всі стовпчики
    def add_fence_decor_callback(dialog, model_name)
      begin
        ProGran3::Logger.info("Додавання декору огорожі на всі стовпчики: #{model_name}", "UI")
        
        # Додаємо декор на всі стовпчики огорожі
        success = ProGran3.add_fence_decor_to_all_posts(model_name)
        
        if success
          # Оновлення стану через ModelStateManager
          ModelStateManager.component_added(:fence_decor, { filename: model_name })
        end
        
        success
      rescue => e
        ErrorHandler.handle_error(e, "UI", "add_fence_decor")
        false
      end
    end

    # Callback для додавання моделей
    def add_model_callback(dialog, category, model_name, stele_type = nil, stele_distance = nil, central_detail = false, central_detail_width = 200, central_detail_depth = 50, central_detail_height = 1200)
      begin
        # Валідація категорії
        validation_result = Validation.validate_category(category.to_sym, "UI")
        unless validation_result.valid
          ErrorHandler.handle_error(
            Validation::ValidationError.new("Помилка валідації категорії: #{validation_result.error_messages.join(', ')}"),
            "UI",
            "add_model"
          )
          return false
        end
        
        # Перевірка через ModelStateManager
        unless ModelStateManager.can_add_component?(category.to_sym)
          ErrorHandler.handle_error(
            StandardError.new("Неможливо додати компонент: #{category}"),
            "UI",
            "add_model"
          )
          return false
        end
        
        # Зберігаємо параметри для автоматичного оновлення
        case category.to_sym
        when :stands
          @stand_params = { category: category, filename: model_name }
        when :steles
          @stele_params = { category: category, filename: model_name, type: stele_type, distance: stele_distance, central_detail: central_detail, central_detail_width: central_detail_width, central_detail_depth: central_detail_depth, central_detail_height: central_detail_height }
        when :flowerbeds
          @flowerbed_params = { category: category, filename: model_name }
        when :gravestones
          @gravestone_params = { category: category, filename: model_name }
        when :fence_decor
          @fence_decor_params = { category: category, filename: model_name }
        when :pavement_tiles
          @pavement_tiles_params = { category: category, filename: model_name }
        end
        
        # Додаємо модель з координацією
        if category.to_sym == :steles
          # Використовуємо CoordinationManager для стел
          ProGran3::Logger.info("CallbackManager: тип стели: #{stele_type} (#{stele_type.class})", "CallbackManager")
          stele_params = { category: category, filename: model_name, type: stele_type, distance: stele_distance, central_detail: central_detail, central_detail_width: central_detail_width, central_detail_depth: central_detail_depth, central_detail_height: central_detail_height }
          success = CoordinationManager.update_stele_dependents(stele_params)
        else
          success = ProGran3.insert_component(category, model_name)
        end
        
        if success
          # Оновлення стану через ModelStateManager
          state_params = { filename: model_name }
          if category.to_sym == :steles
            state_params[:type] = stele_type if stele_type
            state_params[:distance] = stele_distance if stele_distance
            state_params[:central_detail] = central_detail if central_detail
            state_params[:central_detail_width] = central_detail_width if central_detail_width
            state_params[:central_detail_depth] = central_detail_depth if central_detail_depth
            state_params[:central_detail_height] = central_detail_height if central_detail_height
          end
          ModelStateManager.component_added(category.to_sym, state_params)
        end
        
        success
      rescue => e
        ErrorHandler.handle_error(e, "UI", "add_model")
        false
      end
    end

    # Callback для отримання розмірів стели
    def get_stele_dimensions_callback(dialog)
      begin
        ProGran3::Logger.info("Отримання розмірів стели", "CallbackManager")
        
        # Знаходимо всі стели
        stele_instances = ProGran3.all_instances_by_category("steles")
        if stele_instances.empty?
          ProGran3::Logger.warn("Стела не знайдена", "CallbackManager")
          return { width: 100, height: 200, depth: 50 } # Значення за замовчуванням
        end
        
        ProGran3::Logger.info("Знайдено #{stele_instances.length} стел", "CallbackManager")
        
        # Очищаємо стели з невалідними розмірами
        valid_steles = stele_instances.select do |stele|
          bounds = stele.bounds
          width_mm = bounds.width.to_mm
          height_mm = bounds.height.to_mm
          depth_mm = bounds.depth.to_mm
          
          is_valid = width_mm > 0 && height_mm > 0 && depth_mm > 0
          unless is_valid
            ProGran3::Logger.warn("Видаляємо стелу з невалідними розмірами: #{stele.definition.name}, розміри: #{width_mm}×#{height_mm}×#{depth_mm} мм", "CallbackManager")
            stele.erase!
          end
          is_valid
        end
        
        if valid_steles.empty?
          ProGran3::Logger.warn("Немає валідних стел", "CallbackManager")
          return { width: 100, height: 200, depth: 50 } # Значення за замовчуванням
        end
        
        # Беремо останню валідну стелу (найновішу)
        stele = valid_steles.last
        ProGran3::Logger.info("Вибрано стелу: #{stele.definition.name}", "CallbackManager")
        bounds = stele.bounds
        
        ProGran3::Logger.info("Bounds стели: width=#{bounds.width.to_mm}, height=#{bounds.height.to_mm}, depth=#{bounds.depth.to_mm} мм", "CallbackManager")
        ProGran3::Logger.info("Bounds min/max: min=#{bounds.min}, max=#{bounds.max}", "CallbackManager")
        ProGran3::Logger.info("Розрахунок розмірів:", "CallbackManager")
        ProGran3::Logger.info("  X-розмір (глибина): #{bounds.max.x - bounds.min.x} = #{bounds.depth.to_mm} мм", "CallbackManager")
        ProGran3::Logger.info("  Y-розмір (ширина): #{bounds.max.y - bounds.min.y} = #{bounds.width.to_mm} мм", "CallbackManager")
        ProGran3::Logger.info("  Z-розмір (висота): #{bounds.max.z - bounds.min.z} = #{bounds.height.to_mm} мм", "CallbackManager")
        
        # ДЕТАЛЬНА ДІАГНОСТИКА: що означають bounds.width, bounds.height, bounds.depth
        ProGran3::Logger.info("Детальна діагностика bounds:", "CallbackManager")
        ProGran3::Logger.info("  bounds.width = #{bounds.width.to_mm} мм", "CallbackManager")
        ProGran3::Logger.info("  bounds.height = #{bounds.height.to_mm} мм", "CallbackManager")
        ProGran3::Logger.info("  bounds.depth = #{bounds.depth.to_mm} мм", "CallbackManager")
        ProGran3::Logger.info("  Розрахунок вручну:", "CallbackManager")
        ProGran3::Logger.info("    X-розмір (max.x - min.x) = #{bounds.max.x - bounds.min.x} мм", "CallbackManager")
        ProGran3::Logger.info("    Y-розмір (max.y - min.y) = #{bounds.max.y - bounds.min.y} мм", "CallbackManager")
        ProGran3::Logger.info("    Z-розмір (max.z - min.z) = #{bounds.max.z - bounds.min.z} мм", "CallbackManager")
        ProGran3::Logger.info("  Порівняння:", "CallbackManager")
        ProGran3::Logger.info("    bounds.width == Y-розмір? #{bounds.width == (bounds.max.y - bounds.min.y)}", "CallbackManager")
        ProGran3::Logger.info("    bounds.height == Z-розмір? #{bounds.height == (bounds.max.z - bounds.min.z)}", "CallbackManager")
        ProGran3::Logger.info("    bounds.depth == X-розмір? #{bounds.depth == (bounds.max.x - bounds.min.x)}", "CallbackManager")
        
        # ПРАВИЛЬНИЙ МАПІНГ SketchUp bounds → UI поля:
        # Фактично: стела 1000(висота) × 500(ширина) × 80(глибина)
        # bounds показує: width=80, height=500, depth=1000
        # Тому правильний мапінг:
        # - bounds.width = 80 → це глибина (X-розмір) → UI "глибина"
        # - bounds.height = 500 → це ширина (Y-розмір) → UI "ширина"  
        # - bounds.depth = 1000 → це висота (Z-розмір) → UI "висота"
        dimensions = {
          width: bounds.height.to_mm.round,  # bounds.height → UI "ширина"
          height: bounds.depth.to_mm.round,  # bounds.depth → UI "висота"
          depth: bounds.width.to_mm.round    # bounds.width → UI "глибина"
        }
        
        ProGran3::Logger.info("ПРАВИЛЬНИЙ МАПІНГ до UI полів:", "CallbackManager")
        ProGran3::Logger.info("  bounds.height (#{bounds.height.to_mm.round}) → UI 'ширина' (#{dimensions[:width]})", "CallbackManager")
        ProGran3::Logger.info("  bounds.depth (#{bounds.depth.to_mm.round}) → UI 'висота' (#{dimensions[:height]})", "CallbackManager")
        ProGran3::Logger.info("  bounds.width (#{bounds.width.to_mm.round}) → UI 'глибина' (#{dimensions[:depth]})", "CallbackManager")
        ProGran3::Logger.info("Розміри стели: #{dimensions[:width]}(ширина)×#{dimensions[:height]}(висота)×#{dimensions[:depth]}(глибина) мм", "CallbackManager")
        
        # Передаємо розміри назад в JavaScript через dialog
        dialog.execute_script("window.sketchup.steleDimensions = #{dimensions.to_json};")
        ProGran3::Logger.info("Розміри передано в JavaScript: #{dimensions.to_json}", "CallbackManager")
        
        dimensions
        
      rescue => e
        ProGran3::Logger.error("Помилка отримання розмірів стели: #{e.message}", "CallbackManager")
        { width: 100, height: 200, depth: 50 } # Значення за замовчуванням
      end
    end
    
    # Callback для масштабування стели
    def scale_stele_callback(dialog, scale_x, scale_y, scale_z)
      begin
        ProGran3::Logger.info("Масштабування стели: X(глибина)=#{scale_x}, Y(ширина)=#{scale_y}, Z(висота)=#{scale_z}", "CallbackManager")
        
        # Перевіряємо коефіцієнти масштабування
        if scale_x.nil? || scale_y.nil? || scale_z.nil? || 
           scale_x == 0 || scale_y == 0 || scale_z == 0
          ProGran3::Logger.error("Неправильні коефіцієнти масштабування: X=#{scale_x}, Y=#{scale_y}, Z=#{scale_z}", "CallbackManager")
          return false
        end
        
        # Перевіряємо на NaN та Infinity (тільки для Float)
        if scale_x.is_a?(Float) && (scale_x.nan? || scale_x.infinite?)
          ProGran3::Logger.error("Неправильний коефіцієнт масштабування X: #{scale_x}", "CallbackManager")
          return false
        end
        
        if scale_y.is_a?(Float) && (scale_y.nan? || scale_y.infinite?)
          ProGran3::Logger.error("Неправильний коефіцієнт масштабування Y: #{scale_y}", "CallbackManager")
          return false
        end
        
        if scale_z.is_a?(Float) && (scale_z.nan? || scale_z.infinite?)
          ProGran3::Logger.error("Неправильний коефіцієнт масштабування Z: #{scale_z}", "CallbackManager")
          return false
        end
        
        # Знаходимо всі стели
        stele_instances = ProGran3.all_instances_by_category("steles")
        if stele_instances.empty?
          ProGran3::Logger.error("Стела не знайдена для масштабування", "CallbackManager")
          return false
        end
        
        ProGran3::Logger.info("Знайдено #{stele_instances.length} стел для масштабування", "CallbackManager")
        
        # Застосовуємо масштабування до всіх стел з валідними розмірами
        stele_instances.each_with_index do |stele, index|
          bounds = stele.bounds
          center = bounds.center
          definition_name = stele.definition.name
          
          # Перевіряємо, чи стела має валідні розміри
          width_mm = bounds.width.to_mm
          height_mm = bounds.height.to_mm
          depth_mm = bounds.depth.to_mm
          
          if width_mm <= 0 || height_mm <= 0 || depth_mm <= 0
            ProGran3::Logger.warn("Стела #{index + 1} пропущена (невалідні розміри): #{definition_name}, розміри: #{width_mm}(ширина)×#{height_mm}(висота)×#{depth_mm}(глибина) мм", "CallbackManager")
            next
          end
          
          ProGran3::Logger.info("Стела #{index + 1} до масштабування: #{definition_name}, центр: #{center}, розміри: #{width_mm}(ширина)×#{height_mm}(висота)×#{depth_mm}(глибина) мм", "CallbackManager")
          
          # Масштабування з правильними точками відліку:
          # - Висота (Z): відносно основи (нижньої грані) - щоб стела росте тільки вгору
          # - Ширина та глибина (X, Y): відносно центру
          base_point = Geom::Point3d.new(center.x, center.y, bounds.min.z)
          ProGran3::Logger.info("Стела #{index + 1} точка основи для масштабування: #{base_point}", "CallbackManager")
          
          # Детальна діагностика масштабування
          ProGran3::Logger.info("Стела #{index + 1} коефіцієнти масштабування:", "CallbackManager")
          ProGran3::Logger.info("  scale_x (глибина по X) = #{scale_x}", "CallbackManager")
          ProGran3::Logger.info("  scale_y (ширина по Y) = #{scale_y}", "CallbackManager")
          ProGran3::Logger.info("  scale_z (висота по Z) = #{scale_z}", "CallbackManager")
          
          # МАСШТАБУВАННЯ ВСІХ РОЗМІРІВ:
          # - Висота (Z-вісь): тільки вгору (від основи)
          # - Ширина (Y-вісь) та глибина (X-вісь): від центру (в обидві сторони)
          
          base_point = Geom::Point3d.new(center.x, center.y, bounds.min.z)
          ProGran3::Logger.info("Стела #{index + 1} масштабування ВСІХ РОЗМІРІВ:", "CallbackManager")
          ProGran3::Logger.info("  center: #{center}", "CallbackManager")
          ProGran3::Logger.info("  base_point (основа): #{base_point}", "CallbackManager")
          ProGran3::Logger.info("  scale_x (глибина): #{scale_x} (ВІД ЦЕНТРУ)", "CallbackManager")
          ProGran3::Logger.info("  scale_y (ширина): #{scale_y} (ВІД ЦЕНТРУ)", "CallbackManager")
          ProGran3::Logger.info("  scale_z (висота): #{scale_z} (ТІЛЬКИ ВГОРУ)", "CallbackManager")
          
          # Створюємо комбіновану трансформацію:
          # 1. Спочатку масштабуємо ширину та глибину відносно центру
          center_scale = Geom::Transformation.scaling(center, scale_x, scale_y, 1.0)
          # 2. Потім масштабуємо висоту відносно основи
          base_scale = Geom::Transformation.scaling(base_point, 1.0, 1.0, scale_z)
          
          # Комбінуємо трансформації
          combined_transformation = center_scale * base_scale
          stele.transform!(combined_transformation)
          
          # Перевіряємо нові розміри
          new_bounds = stele.bounds
          new_center = new_bounds.center
          ProGran3::Logger.info("Стела #{index + 1} після масштабування: #{definition_name}, новий центр: #{new_center}, нові розміри: #{new_bounds.width.to_mm}(ширина)×#{new_bounds.height.to_mm}(висота)×#{new_bounds.depth.to_mm}(глибина) мм", "CallbackManager")
        end
        
        ProGran3::Logger.success("Масштабування стели завершено успішно", "CallbackManager")
        true
        
      rescue => e
        ProGran3::Logger.error("Помилка масштабування стели: #{e.message}", "CallbackManager")
        ProGran3::Logger.error("Stack trace: #{e.backtrace.join("\n")}", "CallbackManager")
        false
      end
    end
    
    # Альтернативний callback для масштабування стели через створення нової
    def scale_stele_alternative_callback(dialog, new_width, new_height, new_depth)
      begin
        ProGran3::Logger.info("Альтернативне масштабування стели: #{new_width}×#{new_height}×#{new_depth} мм", "CallbackManager")
        
        # Знаходимо всі стели
        stele_instances = ProGran3.all_instances_by_category("steles")
        if stele_instances.empty?
          ProGran3::Logger.error("Стела не знайдена для масштабування", "CallbackManager")
          return false
        end
        
        # Зберігаємо інформацію про першу стелу
        first_stele = stele_instances.first
        original_bounds = first_stele.bounds
        definition_name = first_stele.definition.name
        
        # Розраховуємо коефіцієнти масштабування
        # X = глибина, Y = ширина, Z = висота
        scale_x = new_depth / original_bounds.depth.to_mm   # Глибина по X
        scale_y = new_width / original_bounds.width.to_mm   # Ширина по Y
        scale_z = new_height / original_bounds.height.to_mm # Висота по Z
        
        ProGran3::Logger.info("Коефіцієнти масштабування: X(глибина)=#{scale_x}, Y(ширина)=#{scale_y}, Z(висота)=#{scale_z}", "CallbackManager")
        
        # Видаляємо старі стели
        stele_instances.each(&:erase!)
        
        # Завантажуємо компонент заново
        comp_def = ProGran3.load_component("steles", definition_name)
        return false unless comp_def
        
        # Знаходимо поверхню для позиціонування
        placement_surface = ProGran3.get_steles_placement_surface
        unless placement_surface
          ProGran3::Logger.error("Не знайдено поверхню для позиціонування стели", "CallbackManager")
          return false
        end
        
        surface_bounds = placement_surface.bounds
        comp_bounds = comp_def.bounds
        
        # Центральна позиція
        center_x = surface_bounds.center.x - comp_bounds.center.x
        center_y = surface_bounds.center.y - comp_bounds.center.y
        center_z = surface_bounds.max.z - comp_bounds.min.z
        
        # Створюємо трансформацію з масштабуванням
        position_transformation = Geom::Transformation.new([center_x, center_y, center_z])
        scale_transformation = Geom::Transformation.scaling([0, 0, 0], scale_x, scale_y, scale_z)
        combined_transformation = position_transformation * scale_transformation
        
        # Додаємо нову стелу
        model = Sketchup.active_model
        entities = model.active_entities
        new_stele = entities.add_instance(comp_def, combined_transformation)
        
        ProGran3::Logger.success("Альтернативне масштабування стели завершено успішно", "CallbackManager")
        true
        
      rescue => e
        ProGran3::Logger.error("Помилка альтернативного масштабування стели: #{e.message}", "CallbackManager")
        ProGran3::Logger.error("Stack trace: #{e.backtrace.join("\n")}", "CallbackManager")
        false
      end
    end

    # Callback для створення центральної деталі
    def create_central_detail_callback(dialog, width, depth, height)
      begin
        ProGran3::Logger.info("Створення центральної деталі: #{width}×#{depth}×#{height} мм", "CallbackManager")
        
        # Знаходимо поверхню для позиціонування (проміжна або підставка)
        placement_surface = get_steles_placement_surface
        unless placement_surface
          ProGran3::Logger.error("Не знайдено поверхню для позиціонування центральної деталі", "CallbackManager")
          return false
        end
        
        surface_bounds = placement_surface.bounds
        center_x = surface_bounds.center.x
        center_y = surface_bounds.center.y
        center_z = surface_bounds.max.z
        
        # Створюємо центральну деталь
        success = create_central_detail(center_x, center_y, center_z, width, depth, height)
        
        if success
          ProGran3::Logger.info("Центральна деталь створена успішно", "CallbackManager")
        else
          ProGran3::Logger.error("Помилка при створенні центральної деталі", "CallbackManager")
        end
        
        success
      rescue => e
        ProGran3::Logger.error("Помилка в create_central_detail_callback: #{e.message}", "CallbackManager")
        false
      end
    end

    # Callback для видалення центральної деталі
    def delete_central_detail_callback(dialog)
      begin
        ProGran3::Logger.info("Видалення центральної деталі", "CallbackManager")
        
        # Видаляємо центральну деталь
        success = delete_central_detail
        
        if success
          ProGran3::Logger.info("Центральна деталь видалена успішно", "CallbackManager")
        else
          ProGran3::Logger.error("Помилка при видаленні центральної деталі", "CallbackManager")
        end
        
        success
      rescue => e
        ProGran3::Logger.error("Помилка в delete_central_detail_callback: #{e.message}", "CallbackManager")
        false
      end
    end

    # Знаходження поверхні для позиціонування стел (проміжна або підставка)
    def get_steles_placement_surface
      model = Sketchup.active_model
      entities = model.active_entities
      
      # Спочатку шукаємо проміжну деталь
      gaps_instance = entities.grep(Sketchup::ComponentInstance).find { |c| 
        c.definition.name == "StandGaps"
      }
      
      if gaps_instance
        ProGran3::Logger.info("Знайдено проміжну деталь для позиціонування стел", "CallbackManager")
        return gaps_instance
      end
      
      # Якщо проміжної немає, шукаємо підставку
      stand_instance = entities.grep(Sketchup::ComponentInstance).find { |c| 
        c.definition.name.downcase.include?('stand') && c.definition.name != "StandGaps"
      }
      
      if stand_instance
        ProGran3::Logger.info("Знайдено підставку для позиціонування стел", "CallbackManager")
        return stand_instance
      end
      
      ProGran3::Logger.warn("Не знайдено поверхню для позиціонування стел", "CallbackManager")
      nil
    end

    # Створення центральної деталі
    def create_central_detail(center_x, center_y, center_z, width, depth, height)
      ProGran3::Logger.info("Створення центральної деталі: #{width}×#{depth}×#{height} мм", "CallbackManager")
      
      begin
        model = Sketchup.active_model
        entities = model.active_entities
        
        # Видаляємо старі центральні деталі (групи)
        entities.grep(Sketchup::Group).find_all { |g| 
          g.name == "CentralDetail"
        }.each(&:erase!)
        
        # Створюємо групу для центральної деталі
        group = entities.add_group
        group.name = "CentralDetail"
        
        # Розраховуємо розміри в SketchUp одиницях
        # width = ширина по Y, depth = товщина по X, height = висота по Z
        width_su = width.mm    # по осі Y
        depth_su = depth.mm    # по осі X (товщина)
        height_su = height.mm  # по осі Z
        
        # Створюємо прямокутник для основи (по осі XY)
        points = [
          [0, 0, 0],           # лівий нижній
          [depth_su, 0, 0],    # правий нижній (по X)
          [depth_su, width_su, 0], # правий верхній (по Y)
          [0, width_su, 0]     # лівий верхній
        ]
        
        # Додаємо основу (нижню грань)
        bottom_face = group.entities.add_face(points)
        
        # Піднімаємо основу на висоту
        bottom_face.pushpull(height_su)
        
        # Тепер у нас є повний блок з гранями
        
        # Позиціонуємо центральну деталь
        # Центруємо відносно заданої позиції
        group_bounds = group.bounds
        offset_x = center_x - group_bounds.center.x
        offset_y = center_y - group_bounds.center.y
        offset_z = center_z - group_bounds.min.z
        
        transform = Geom::Transformation.new([offset_x, offset_y, offset_z])
        group.transform!(transform)
        
        ProGran3::Logger.info("Центральна деталь створена успішно", "CallbackManager")
        ProGran3::Logger.info("Позиція: x=#{center_x}, y=#{center_y}, z=#{center_z}", "CallbackManager")
        ProGran3::Logger.info("Розміри: #{width}×#{depth}×#{height} мм", "CallbackManager")
        
        true
      rescue => e
        ProGran3::Logger.error("Помилка при створенні центральної деталі: #{e.message}", "CallbackManager")
        false
      end
    end

    # Видалення центральної деталі
    def delete_central_detail
      ProGran3::Logger.info("Видалення центральної деталі", "CallbackManager")
      
      begin
        model = Sketchup.active_model
        entities = model.active_entities
        
        # Знаходимо та видаляємо всі центральні деталі (групи)
        central_details = entities.grep(Sketchup::Group).find_all { |g| 
          g.name == "CentralDetail"
        }
        
        if central_details.empty?
          ProGran3::Logger.info("Центральні деталі не знайдено для видалення", "CallbackManager")
          return true
        end
        
        # Видаляємо всі знайдені центральні деталі
        central_details.each(&:erase!)
        
        ProGran3::Logger.info("Видалено #{central_details.length} центральних деталей", "CallbackManager")
        true
      rescue => e
        ProGran3::Logger.error("Помилка при видаленні центральної деталі: #{e.message}", "CallbackManager")
        false
      end
    end

    # Отримання збережених параметрів
    def get_foundation_params
      @foundation_params || {}
    end

    def get_tiles_params
      @tiles_params || {}
    end

    def get_cladding_params
      @cladding_params || {}
    end

    def get_blind_area_params
      @blind_area_params || {}
    end

    # Отримання параметрів підставки
    def get_stand_params
      @stand_params || {}
    end

    # Отримання параметрів стели
    def get_stele_params
      @stele_params || {}
    end

    # Отримання параметрів квітника
    def get_flowerbed_params
      @flowerbed_params || {}
    end

    # Отримання параметрів надгробної плити
    def get_gravestone_params
      @gravestone_params || {}
    end
    
    # Callback для додавання лампадок
    def add_lamp_callback(dialog, category, model_name, position)
      begin
        # Валідація категорії
        validation_result = Validation.validate_category(category.to_sym, "UI")
        unless validation_result.valid
          ErrorHandler.handle_error(
            Validation::ValidationError.new("Помилка валідації категорії: #{validation_result.error_messages.join(', ')}"),
            "UI",
            "add_lamp"
          )
          return false
        end
        
        # Перевірка через ModelStateManager
        unless ModelStateManager.can_add_component?(category.to_sym)
          ErrorHandler.handle_error(
            StandardError.new("Неможливо додати лампадку: #{category}"),
            "UI",
            "add_lamp"
          )
          return false
        end
        
        # Зберігаємо параметри
        @lamp_params = { category: category, filename: model_name, position: position }
        
        # Додаємо лампадку
        success = ProGran3.insert_lamp_component(category, model_name, position, true)
        
        if success
          # Оновлення стану через ModelStateManager
          ModelStateManager.component_added(category.to_sym, { filename: model_name, position: position })
        end
        
        success
      rescue => e
        ErrorHandler.handle_error(e, "UI", "add_lamp")
        false
      end
    end

    # Отримання параметрів лампадки
    def get_lamp_params
      @lamp_params || {}
    end
    
    # Callback для кутової огорожі
    def add_fence_corner_callback(dialog, post_height, post_width, post_depth, side_height, side_length, side_thickness, decorative_size)
      begin
        # Валідація розмірів
        validation_result = Validation.validate_dimensions(post_height.to_i, post_width.to_i, post_depth.to_i, "кутової огорожі")
        unless validation_result.valid
          ErrorHandler.handle_error(
            Validation::ValidationError.new("Помилка валідації кутової огорожі: #{validation_result.error_messages.join(', ')}"),
            "UI",
            "add_fence_corner"
          )
          return false
        end
        
        # Перевірка через ModelStateManager
        unless ModelStateManager.can_add_component?(:fence_corner)
          ErrorHandler.handle_error(
            StandardError.new("Неможливо додати кутову огорожу"),
            "UI",
            "add_fence_corner"
          )
          return false
        end
        
        # Зберігаємо параметри
        @fence_corner_params = {
          post_height: post_height.to_i,
          post_width: post_width.to_i,
          post_depth: post_depth.to_i,
          side_height: side_height.to_i,
          side_length: side_length.to_i,
          side_thickness: side_thickness.to_i,
          decorative_size: decorative_size.to_i
        }
        
        # Створюємо кутову огорожу
        success = ProGran3::FenceBuilder.create_corner_fence(
          post_height.to_i, post_width.to_i, post_depth.to_i,
          side_height.to_i, side_length.to_i, side_thickness.to_i, decorative_size.to_i
        )
        
        if success
          # Видаляємо периметральну огорожу зі стану (взаємне виключення)
          if ModelStateManager.model_state[:fence_perimeter][:exists]
            ModelStateManager.component_removed(:fence_perimeter)
          end
          
          # Оновлення стану через ModelStateManager
          ModelStateManager.component_added(:fence_corner, @fence_corner_params)
        end
        
        success
      rescue => e
        ErrorHandler.handle_error(e, "UI", "add_fence_corner")
        false
      end
    end
    
    # Callback для периметральної огорожі
    def add_fence_perimeter_callback(dialog, post_height, post_width, post_depth, north_count, south_count, east_west_count, decorative_height, decorative_thickness)
      begin
        # Валідація периметральної огорожі (дозволяє 0 для кількості стовпів)
        validation_result = Validation.validate_fence_perimeter(
          post_height.to_i, post_width.to_i, post_depth.to_i, 
          north_count.to_i, south_count.to_i, east_west_count.to_i,
          decorative_height.to_i, decorative_thickness.to_i, 
          "периметральної огорожі"
        )
        unless validation_result.valid
          ErrorHandler.handle_error(
            Validation::ValidationError.new("Помилка валідації периметральної огорожі: #{validation_result.error_messages.join(', ')}"),
            "UI",
            "add_fence_perimeter"
          )
          return false
        end
        
        # Перевірка через ModelStateManager
        can_add = ModelStateManager.can_add_component?(:fence_perimeter)
        ProGran3::Logger.info("Перевірка ModelStateManager.can_add_component?(:fence_perimeter): #{can_add}", "CallbackManager")
        
        unless can_add
          ProGran3::Logger.warn("ModelStateManager заблокував створення периметральної огорожі", "CallbackManager")
          ProGran3::Logger.info("Поточний стан fence_perimeter: #{ModelStateManager.model_state[:fence_perimeter].inspect}", "CallbackManager")
          ProGran3::Logger.info("Поточний стан foundation: #{ModelStateManager.model_state[:foundation].inspect}", "CallbackManager")
          
          ErrorHandler.handle_error(
            StandardError.new("Неможливо додати периметральну огорожу - ModelStateManager заблокував"),
            "UI",
            "add_fence_perimeter"
          )
          return false
        end
        
        # Зберігаємо параметри
        @fence_perimeter_params = {
          post_height: post_height.to_i,
          post_width: post_width.to_i,
          post_depth: post_depth.to_i,
          north_count: north_count.to_i,
          south_count: south_count.to_i,
          east_west_count: east_west_count.to_i,
          decorative_height: decorative_height.to_i,
          decorative_thickness: decorative_thickness.to_i
        }
        
        # Створюємо периметральну огорожу
        success = ProGran3::FenceBuilder.create_perimeter_fence(
          post_height.to_i, post_width.to_i, post_depth.to_i,
          north_count.to_i, south_count.to_i, east_west_count.to_i,
          decorative_height.to_i, decorative_thickness.to_i
        )
        
        if success
          ProGran3::Logger.info("Периметральна огорожа створена успішно, оновлюємо стан", "CallbackManager")
          
          # Видаляємо кутову огорожу зі стану (взаємне виключення)
          if ModelStateManager.model_state[:fence_corner][:exists]
            ProGran3::Logger.info("Видаляємо кутову огорожу зі стану", "CallbackManager")
            ModelStateManager.component_removed(:fence_corner)
          end
          
          # Оновлення стану через ModelStateManager
          ProGran3::Logger.info("Додаємо периметральну огорожу до стану", "CallbackManager")
          ModelStateManager.component_added(:fence_perimeter, @fence_perimeter_params)
          
          ProGran3::Logger.info("Стан після створення: fence_perimeter.exists = #{ModelStateManager.model_state[:fence_perimeter][:exists]}", "CallbackManager")
        else
          ProGran3::Logger.error("Не вдалося створити периметральну огорожу", "CallbackManager")
        end
        
        success
      rescue => e
        ErrorHandler.handle_error(e, "UI", "add_fence_perimeter")
        false
      end
    end
    
    # Отримання параметрів огорожі
    def get_fence_corner_params
      @fence_corner_params || {}
    end
    
    def get_fence_perimeter_params
      @fence_perimeter_params || {}
    end
    
    # Callback для оновлення розміру підставки
    def update_stand_size_callback(dialog, height, width, depth)
      begin
        ProGran3::Logger.info("Оновлення розміру підставки: #{height}×#{width}×#{depth} мм", "UI")
        
        # Валідація розмірів
        unless validate_dimensions_callback(depth, width, height, "підставки")
          return false
        end
        
        # Оновлюємо розмір підставки в моделі
        success = ProGran3.update_stand_size(height.to_i, width.to_i, depth.to_i)
        
        if success
          ProGran3::Logger.info("Розмір підставки успішно оновлено", "UI")
          # Оновлюємо параметри в стані
          if @stand_params
            @stand_params[:height] = height.to_i
            @stand_params[:width] = width.to_i
            @stand_params[:depth] = depth.to_i
            # Використовуємо component_added для оновлення стану
            ModelStateManager.component_added(:stands, @stand_params)
          end
        else
          ProGran3::Logger.error("Не вдалося оновити розмір підставки", "UI")
        end
        
        success
      rescue => e
        ErrorHandler.handle_error(e, "UI", "update_stand_size")
        false
      end
    end

    # Очищення параметрів
    def clear_params
      @foundation_params = nil
      @tiles_params = nil
      @cladding_params = nil
      @blind_area_params = nil
      @stand_params = nil
      @stele_params = nil
      @flowerbed_params = nil
      @gravestone_params = nil
      @lamp_params = nil
      @fence_corner_params = nil
      @fence_perimeter_params = nil
    end

    # Callback для генерації звіту (використовує кешовані дані або генерує нові)
    def self.generate_report_callback(dialog)
      begin
        ProGran3::Logger.info("📄 Генерація звіту...", "Report")
        
        # Перевіряємо кеш
        cached = ProGran3::SummaryCache.get_cached_summary
        if cached
          ProGran3::Logger.info("⚡ Використовую кешовані дані для звіту", "Report")
          # v3.2: showReportModal тепер async
          dialog.execute_script("if (window.ProGran3 && window.ProGran3.UI && window.ProGran3.UI.SummaryTable) { (async () => { await window.ProGran3.UI.SummaryTable.showReportModal(#{cached.to_json}); })(); } else { console.error('SummaryTable не знайдено'); }")
          return true
        end
        
        # Якщо немає кешу - генеруємо нові дані
        ProGran3::Logger.info("🔄 Немає кешованих даних, генерую нові...", "Report")
        get_detailed_summary_callback(dialog, for_report: true)
        
      rescue => e
        ProGran3::Logger.error("❌ Помилка генерації звіту: #{e.message}", "Report")
        ProGran3::Logger.error("   Backtrace: #{e.backtrace.first(3).join("\n   ")}", "Report")
        dialog.execute_script("alert('Помилка генерації звіту. Перевірте Ruby Console.');")
        false
      end
    end
    
    # Callback для отримання детальної специфікації всіх компонентів в моделі
    def self.get_detailed_summary_callback(dialog, for_report: false)
      begin
        ProGran3::Logger.info("🔍 Початок збору детальної специфікації [VERSION 3.0 - CACHED]", "Summary")
        
        # Перевірка кешу
        cached = ProGran3::SummaryCache.get_cached_summary
        if cached
          ProGran3::Logger.info("⚡ Використовую кешовані дані", "Summary")
          dialog.execute_script("updateDetailedSummary(#{cached.to_json});")
          return true
        end
        
        model = Sketchup.active_model
        entities = model.entities
        
        total_components = entities.grep(Sketchup::ComponentInstance).count
        ProGran3::Logger.info("📦 Всього компонентів в моделі: #{total_components}", "Summary")
        
        summary = {
          foundation: [],
          tiles: [],
          cladding: [],
          blind_area: [],
          stands: [],
          steles: [],
          flowerbeds: [],
          gravestones: [],
          lamps: [],
          fence_corner: [],
          fence_perimeter: [],
          fence_decor: []
        }
        
        # Збираємо всі компоненти
        entities.grep(Sketchup::ComponentInstance).each do |component|
          name = component.definition.name
          ProGran3::Logger.info("🔎 Знайдено компонент: [#{name}] (клас: #{name.class})", "Summary")
          ProGran3::Logger.info("🔍 Component bounds: #{component.bounds.width.to_mm}×#{component.bounds.depth.to_mm}×#{component.bounds.height.to_mm} мм", "Summary")
          
          # Класифікуємо за типом
          case name
          when "Foundation"
            ProGran3::Logger.info("💡 CASE: Foundation matched!", "Summary")
            bounds = component.bounds
            trans = component.transformation
            
            ProGran3::Logger.info("🔍 Foundation bounds:", "Summary")
            ProGran3::Logger.info("  width: #{bounds.width} inches = #{bounds.width.to_mm} mm", "Summary")
            ProGran3::Logger.info("  depth: #{bounds.depth} inches = #{bounds.depth.to_mm} mm", "Summary")
            ProGran3::Logger.info("  height: #{bounds.height} inches = #{bounds.height.to_mm} mm", "Summary")
            
            # Розміри в см
            width_cm = (bounds.width.to_mm / 10.0).round(1)
            depth_cm = (bounds.depth.to_mm / 10.0).round(1)
            height_cm = (bounds.height.to_mm / 10.0).round(1)
            
            ProGran3::Logger.info("📏 Розміри в см: #{depth_cm} × #{width_cm} × #{height_cm}", "Summary")
            
            # Площа верхньої грані (з урахуванням трансформації)
            scale_x = trans.xscale
            scale_y = trans.yscale
            
            ProGran3::Logger.info("🔄 Трансформація: scale_x=#{scale_x}, scale_y=#{scale_y}", "Summary")
            
            top_area = 0
            face_count = 0
            component.definition.entities.grep(Sketchup::Face).each do |face|
              if face.normal.z > 0.9  # Верхня грань
                face_count += 1
                face_area = face.area * scale_x * scale_y
                top_area += face_area
                ProGran3::Logger.info("  Грань #{face_count}: #{face.area} sq_in → #{face_area} sq_in (scaled)", "Summary")
              end
            end
            area_m2 = (top_area / 1550.0031).round(2)
            
            ProGran3::Logger.info("📊 Площа: #{top_area} sq_in = #{area_m2} м²", "Summary")
            
            # Об'єм в м³
            volume_cu_inches = bounds.width * bounds.depth * bounds.height
            volume_m3 = (volume_cu_inches * 0.000016387064).round(3)
            
            ProGran3::Logger.info("📦 Об'єм: #{volume_cu_inches} cu_in = #{volume_m3} м³", "Summary")
            
            item = {
              name: name,
              width: width_cm,
              depth: depth_cm,
              height: height_cm,
              area_m2: area_m2,
              volume_m3: volume_m3,
              material: get_component_material(component)
            }
            
            ProGran3::Logger.info("✅ Foundation item: #{item.inspect}", "Summary")
            summary[:foundation] << item
            
          when /Perimeter_Tile|Modular_Tile/
            # Кожна плитка - окремий компонент (НЕ група)
            ProGran3::Logger.info("🔹 Плитка знайдена: #{name}", "Summary")
            ProGran3::Logger.info("🔍 Tile bounds: #{component.bounds.width.to_mm}×#{component.bounds.depth.to_mm}×#{component.bounds.height.to_mm} мм", "Summary")
            
            bounds = component.bounds
            trans = component.transformation
            
            # Розміри в см
            width_cm = (bounds.width.to_mm / 10.0).round(1)
            depth_cm = (bounds.depth.to_mm / 10.0).round(1)
            height_cm = (bounds.height.to_mm / 10.0).round(1)
            
            ProGran3::Logger.info("  📏 Bounds: #{bounds.width.to_mm} × #{bounds.depth.to_mm} × #{bounds.height.to_mm} мм", "Summary")
            ProGran3::Logger.info("  📏 В см: #{depth_cm} × #{width_cm} × #{height_cm} см", "Summary")
            
            # Площа верхньої грані
            scale_x = trans.xscale
            scale_y = trans.yscale
            
            top_area = 0
            face_count = 0
            component.definition.entities.grep(Sketchup::Face).each do |face|
              if face.normal.z > 0.9
                face_count += 1
                top_area += face.area * scale_x * scale_y
              end
            end
            area_m2 = (top_area / 1550.0031).round(3)
            
            # Об'єм
            volume_cu_inches = bounds.width * bounds.depth * bounds.height
            volume_m3 = (volume_cu_inches * 0.000016387064).round(4)
            
            ProGran3::Logger.info("  📊 Площа (#{face_count} граней): #{area_m2} м²", "Summary")
            ProGran3::Logger.info("  📦 Об'єм: #{volume_m3} м³", "Summary")
            
            item = {
              name: name,
              width: width_cm,
              depth: depth_cm,
              height: height_cm,
              area_m2: area_m2,
              volume_m3: volume_m3,
              material: get_component_material(component)
            }
            summary[:tiles] << item
            
          when /Cladding/
            # Облицювання - вертикальна плитка
            ProGran3::Logger.info("🔹 Облицювання (вертикальна плитка) знайдена: #{name}", "Summary")
            ProGran3::Logger.info("🔍 Cladding bounds: #{component.bounds.width.to_mm}×#{component.bounds.depth.to_mm}×#{component.bounds.height.to_mm} мм", "Summary")
            
            bounds = component.bounds
            trans = component.transformation
            
            # Розміри в см
            width_cm = (bounds.width.to_mm / 10.0).round(1)
            depth_cm = (bounds.depth.to_mm / 10.0).round(1)
            height_cm = (bounds.height.to_mm / 10.0).round(1)
            
            ProGran3::Logger.info("  📏 Bounds: #{bounds.width.to_mm} × #{bounds.depth.to_mm} × #{bounds.height.to_mm} мм", "Summary")
            
            # Площа НАЙБІЛЬШОЇ грані (не обов'язково верхньої)
            scale_x = trans.xscale
            scale_y = trans.yscale
            scale_z = trans.zscale
            
            max_area = 0
            max_face_info = ""
            face_count = 0
            
            component.definition.entities.grep(Sketchup::Face).each do |face|
              face_count += 1
              
              # Трансформована нормаль
              normal = face.normal.transform(trans)
              
              # Площа з урахуванням орієнтації
              if normal.z.abs > 0.9  # Горизонтальна (XY площина)
                face_area = face.area * scale_x * scale_y
              elsif normal.x.abs > 0.9  # Вертикальна (YZ площина)
                face_area = face.area * scale_y * scale_z
              elsif normal.y.abs > 0.9  # Вертикальна (XZ площина)
                face_area = face.area * scale_x * scale_z
              else
                # Похила грань - приблизний розрахунок
                avg_scale = Math.sqrt(scale_x * scale_y * scale_z)
                face_area = face.area * avg_scale * avg_scale
              end
              
              if face_area > max_area
                max_area = face_area
                max_face_info = "грань #{face_count}, normal: [#{normal.x.round(2)}, #{normal.y.round(2)}, #{normal.z.round(2)}]"
              end
            end
            
            area_m2 = (max_area / 1550.0031).round(3)
            
            # Об'єм
            volume_cu_inches = bounds.width * bounds.depth * bounds.height
            volume_m3 = (volume_cu_inches * 0.000016387064).round(4)
            
            ProGran3::Logger.info("  📊 Найбільша площина (#{max_face_info}): #{area_m2} м²", "Summary")
            ProGran3::Logger.info("  📦 Об'єм: #{volume_m3} м³", "Summary")
            
            item = {
              name: name,
              width: width_cm,
              depth: depth_cm,
              height: height_cm,
              area_m2: area_m2,
              volume_m3: volume_m3,
              tile_type: "вертикальна",
              material: get_component_material(component)
            }
            summary[:tiles] << item
            
          when /BlindArea/
            ProGran3::Logger.info("💡 CASE: BlindArea matched!", "Summary")
            ProGran3::Logger.info("🔍 BlindArea bounds: #{component.bounds.width.to_mm}×#{component.bounds.depth.to_mm}×#{component.bounds.height.to_mm} мм", "Summary")
            bounds = component.bounds
            trans = component.transformation
            
            # Розміри в см
            width_cm = (bounds.width.to_mm / 10.0).round(1)
            depth_cm = (bounds.depth.to_mm / 10.0).round(1)
            height_cm = (bounds.height.to_mm / 10.0).round(1)
            
            # Площа верхньої грані (РЕКУРСИВНИЙ пошук для вкладених компонентів)
            scale_x = trans.xscale
            scale_y = trans.yscale
            
            top_area = 0
            face_count = 0
            
            # Рекурсивна функція для пошуку всіх граней
            process_entities = lambda do |entities, transformation|
              entities.each do |entity|
                if entity.is_a?(Sketchup::Face)
                  # Трансформована нормаль
                  normal = entity.normal.transform(transformation)
                  
                  if normal.z > 0.9  # Верхня грань
                    face_count += 1
                    sx = transformation.xscale
                    sy = transformation.yscale
                    face_area = entity.area * sx * sy
                    top_area += face_area
                    ProGran3::Logger.info("  Грань #{face_count}: #{entity.area.round(2)} sq_in → #{face_area.round(2)} sq_in (scaled)", "Summary")
                  end
                  
                elsif entity.is_a?(Sketchup::ComponentInstance) || entity.is_a?(Sketchup::Group)
                  # Рекурсивно обробляємо вкладені компоненти/групи
                  new_trans = transformation * entity.transformation
                  process_entities.call(entity.definition.entities, new_trans)
                end
              end
            end
            
            # Запускаємо рекурсивний пошук
            process_entities.call(component.definition.entities, component.transformation)
            
            area_m2 = (top_area / 1550.0031).round(2)
            
            # Об'єм в м³ - рахуємо через реальну геометрію
            # Для BlindArea (рамка): об'єм = площа верхньої грані × товщина
            # Товщина = найменший з трьох розмірів
            thickness_mm = [bounds.width.to_mm, bounds.depth.to_mm, bounds.height.to_mm].min
            thickness_m = thickness_mm / 1000.0
            volume_m3 = (area_m2 * thickness_m).round(3)
            
            ProGran3::Logger.info("🔢 Розрахунок об'єму: #{area_m2} м² × #{thickness_m.round(3)} м (товщина #{thickness_mm} мм) = #{volume_m3} м³", "Summary")
            
            ProGran3::Logger.info("📏 BlindArea: #{depth_cm} × #{width_cm} × #{height_cm} см", "Summary")
            ProGran3::Logger.info("📊 Площа (#{face_count} граней): #{area_m2} м²", "Summary")
            ProGran3::Logger.info("📦 Об'єм: #{volume_m3} м³", "Summary")
            
            item = {
              name: name,
              width: width_cm,
              depth: depth_cm,
              height: height_cm,
              area_m2: area_m2,
              volume_m3: volume_m3,
              material: get_component_material(component)
            }
            
            ProGran3::Logger.info("✅ BlindArea item створено: #{item.inspect}", "Summary")
            ProGran3::Logger.info("   JSON: #{item.to_json}", "Summary")
            
            summary[:blind_area] << item
            
          when /stand/i
            ProGran3::Logger.info("🔹 Підставка знайдена: #{name}", "Summary")
            ProGran3::Logger.info("🔍 Stand bounds: #{component.bounds.width.to_mm}×#{component.bounds.depth.to_mm}×#{component.bounds.height.to_mm} мм", "Summary")
            bounds = component.bounds
            trans = component.transformation
            
            # Розміри в см
            width_cm = (bounds.width.to_mm / 10.0).round(1)
            depth_cm = (bounds.depth.to_mm / 10.0).round(1)
            height_cm = (bounds.height.to_mm / 10.0).round(1)
            
            # Площа верхньої грані
            scale_x = trans.xscale
            scale_y = trans.yscale
            
            top_area = 0
            component.definition.entities.grep(Sketchup::Face).each do |face|
              if face.normal.z > 0.9
                top_area += face.area * scale_x * scale_y
              end
            end
            area_m2 = (top_area / 1550.0031).round(2)
            
            # Об'єм
            volume_cu_inches = bounds.width * bounds.depth * bounds.height
            volume_m3 = (volume_cu_inches * 0.000016387064).round(3)
            
            # Визначаємо тип (основна чи проміжна)
            is_gaps = name =~ /StandGaps/i
            stand_type = is_gaps ? "проміжна" : "основна"
            
            ProGran3::Logger.info("📏 Stand (#{stand_type}): #{depth_cm} × #{width_cm} × #{height_cm} см, Площа: #{area_m2} м², Об'єм: #{volume_m3} м³", "Summary")
            
            item = {
              name: name,
              width: width_cm,
              depth: depth_cm,
              height: height_cm,
              area_m2: area_m2,
              volume_m3: volume_m3,
              stand_type: stand_type,
              material: get_component_material(component)
            }
            summary[:stands] << item
            
          when /stele/i
            ProGran3::Logger.info("🔹 Стела знайдена: #{name}", "Summary")
            ProGran3::Logger.info("🔍 Stele bounds: #{component.bounds.width.to_mm}×#{component.bounds.depth.to_mm}×#{component.bounds.height.to_mm} мм", "Summary")
            
            bounds = component.bounds
            trans = component.transformation
            
            # Розміри в см
            width_cm = (bounds.width.to_mm / 10.0).round(1)
            depth_cm = (bounds.depth.to_mm / 10.0).round(1)
            height_cm = (bounds.height.to_mm / 10.0).round(1)
            
            # Площа верхньої грані
            scale_x = trans.xscale
            scale_y = trans.yscale
            
            top_area = 0
            component.definition.entities.grep(Sketchup::Face).each do |face|
              if face.normal.z > 0.9
                top_area += face.area * scale_x * scale_y
              end
            end
            area_m2 = (top_area / 1550.0031).round(3)
            
            # Об'єм
            volume_cu_inches = bounds.width * bounds.depth * bounds.height
            volume_m3 = (volume_cu_inches * 0.000016387064).round(4)
            
            ProGran3::Logger.info("  📏 Стела: #{depth_cm} × #{width_cm} × #{height_cm} см, Площа: #{area_m2} м², Об'єм: #{volume_m3} м³", "Summary")
            
            item = {
              name: name,
              width: width_cm,
              depth: depth_cm,
              height: height_cm,
              area_m2: area_m2,
              volume_m3: volume_m3,
              material: get_component_material(component)
            }
            summary[:steles] << item
            
          when /flowerbed/i
            # Квітник містить внутрішні компоненти - показуємо ТІЛЬКИ їх
            ProGran3::Logger.info("🔹 Квітник знайдено: #{name}", "Summary")
            ProGran3::Logger.info("🔍 Flowerbed bounds: #{component.bounds.width.to_mm}×#{component.bounds.depth.to_mm}×#{component.bounds.height.to_mm} мм", "Summary")
            
            internal_components = component.definition.entities.grep(Sketchup::ComponentInstance)
            ProGran3::Logger.info("  📦 Внутрішніх компонентів: #{internal_components.count}", "Summary")
            
            # Обробляємо ТІЛЬКИ внутрішні компоненти (не сам квітник)
            internal_components.each do |internal|
              bounds = internal.bounds
              trans = component.transformation * internal.transformation
              
              # Розміри в см
              width_cm = (bounds.width.to_mm / 10.0).round(1)
              depth_cm = (bounds.depth.to_mm / 10.0).round(1)
              height_cm = (bounds.height.to_mm / 10.0).round(1)
              
              # Площа верхньої грані
              scale_x = trans.xscale
              scale_y = trans.yscale
              
              top_area = 0
              internal.definition.entities.grep(Sketchup::Face).each do |face|
                if face.normal.z > 0.9
                  top_area += face.area * scale_x * scale_y
                end
              end
              area_m2 = (top_area / 1550.0031).round(3)
              
              # Об'єм
              volume_cu_inches = bounds.width * bounds.depth * bounds.height * scale_x * scale_y * trans.zscale
              volume_m3 = (volume_cu_inches * 0.000016387064).round(4)
              
              ProGran3::Logger.info("    ➕ #{internal.definition.name}: #{depth_cm}×#{width_cm}×#{height_cm} см, Площа: #{area_m2} м², Об'єм: #{volume_m3} м³", "Summary")
              
              item = {
                name: internal.definition.name,
                width: width_cm,
                depth: depth_cm,
                height: height_cm,
                area_m2: area_m2,
                volume_m3: volume_m3,
                material: get_component_material(internal)
              }
              summary[:flowerbeds] << item
            end
            
          when /gravestone|plate/i
            ProGran3::Logger.info("🔹 Надгробок знайдено: #{name}", "Summary")
            ProGran3::Logger.info("🔍 Gravestone bounds: #{component.bounds.width.to_mm}×#{component.bounds.depth.to_mm}×#{component.bounds.height.to_mm} мм", "Summary")
            bounds = component.bounds
            item = {
              name: name,
              width: (bounds.width.to_mm / 10.0).round(1),
              depth: (bounds.depth.to_mm / 10.0).round(1),
              height: (bounds.height.to_mm / 10.0).round(1),
              material: get_component_material(component)
            }
            summary[:gravestones] << item
            
          when /lamp/i
            bounds = component.bounds
            item = {
              name: name,
              width: (bounds.width.to_mm / 10.0).round(1),
              depth: (bounds.depth.to_mm / 10.0).round(1),
              height: (bounds.height.to_mm / 10.0).round(1),
              material: get_component_material(component)
            }
            summary[:lamps] << item
            
          when /^CornerFence$/
            # CornerFence - контейнер з 3 внутрішніми компонентами (Post, Panel_X, Panel_Y)
            ProGran3::Logger.info("🔹 CornerFence контейнер знайдено: #{name}", "Summary")
            ProGran3::Logger.info("🔍 CornerFence bounds: #{component.bounds.width.to_mm}×#{component.bounds.depth.to_mm}×#{component.bounds.height.to_mm} мм", "Summary")
            
            # Збираємо внутрішні компоненти
            internal_components = component.definition.entities.grep(Sketchup::ComponentInstance)
            ProGran3::Logger.info("  📦 Внутрішніх компонентів: #{internal_components.count}", "Summary")
            
            # Обробляємо кожен внутрішній компонент
            internal_components.each do |internal|
              bounds = internal.bounds
              combined_trans = component.transformation * internal.transformation
              
              # Розміри в см
              width_cm = (bounds.width.to_mm / 10.0).round(1)
              depth_cm = (bounds.depth.to_mm / 10.0).round(1)
              height_cm = (bounds.height.to_mm / 10.0).round(1)
              
              # Площа найбільшої грані
              scale_x = combined_trans.xscale
              scale_y = combined_trans.yscale
              scale_z = combined_trans.zscale
              
              max_area = 0
              internal.definition.entities.grep(Sketchup::Face).each do |face|
                normal = face.normal
                
                if normal.z.abs > 0.9
                  face_area = face.area * scale_x * scale_y
                elsif normal.x.abs > 0.9
                  face_area = face.area * scale_y * scale_z
                elsif normal.y.abs > 0.9
                  face_area = face.area * scale_x * scale_z
                else
                  face_area = face.area
                end
                
                max_area = face_area if face_area > max_area
              end
              
              area_m2 = (max_area / 1550.0031).round(3)
              
              # Об'єм
              volume_cu_inches = bounds.width * bounds.depth * bounds.height * scale_x * scale_y * scale_z
              volume_m3 = (volume_cu_inches * 0.000016387064).round(4)
              
              ProGran3::Logger.info("    ➕ #{internal.definition.name}: #{depth_cm} × #{width_cm} × #{height_cm} см, Площа: #{area_m2} м², Об'єм: #{volume_m3} м³", "Summary")
              
              item = {
                name: internal.definition.name,
                width: width_cm,
                depth: depth_cm,
                height: height_cm,
                area_m2: area_m2,
                volume_m3: volume_m3,
                material: get_component_material(internal)
              }
              summary[:fence_corner] << item
            end
            
          when /PerimeterFence/
            ProGran3::Logger.info("🔹 Периметр огорожі знайдено: #{name}", "Summary")
            ProGran3::Logger.info("🔍 PerimeterFence bounds: #{component.bounds.width.to_mm}×#{component.bounds.depth.to_mm}×#{component.bounds.height.to_mm} мм", "Summary")
            bounds = component.bounds
            item = {
              name: name,
              width: (bounds.width.to_mm / 10.0).round(1),
              depth: (bounds.depth.to_mm / 10.0).round(1),
              height: (bounds.height.to_mm / 10.0).round(1),
              material: get_component_material(component)
            }
            summary[:fence_perimeter] << item
            
          when /fence_decor|ball\.skp|pancake\.skp|ball2\.skp/i
            # Декоративні елементи огорожі
            ProGran3::Logger.info("🔹 Декор огорожі: #{name}", "Summary")
            ProGran3::Logger.info("🔍 FenceDecor bounds: #{component.bounds.width.to_mm}×#{component.bounds.depth.to_mm}×#{component.bounds.height.to_mm} мм", "Summary")
            
            bounds = component.bounds
            trans = component.transformation
            
            # Розміри в см
            width_cm = (bounds.width.to_mm / 10.0).round(1)
            depth_cm = (bounds.depth.to_mm / 10.0).round(1)
            height_cm = (bounds.height.to_mm / 10.0).round(1)
            
            # Площа найбільшої грані
            scale_x = trans.xscale
            scale_y = trans.yscale
            scale_z = trans.zscale
            
            max_area = 0
            component.definition.entities.grep(Sketchup::Face).each do |face|
              normal = face.normal
              
              if normal.z.abs > 0.9
                face_area = face.area * scale_x * scale_y
              elsif normal.x.abs > 0.9
                face_area = face.area * scale_y * scale_z
              elsif normal.y.abs > 0.9
                face_area = face.area * scale_x * scale_z
              else
                face_area = face.area
              end
              
              max_area = face_area if face_area > max_area
            end
            
            area_m2 = (max_area / 1550.0031).round(3)
            
            # Об'єм
            volume_cu_inches = bounds.width * bounds.depth * bounds.height
            volume_m3 = (volume_cu_inches * 0.000016387064).round(4)
            
            ProGran3::Logger.info("  📏 #{name}: #{depth_cm} × #{width_cm} × #{height_cm} см, Площа: #{area_m2} м², Об'єм: #{volume_m3} м³", "Summary")
            
            item = {
              name: name,
              width: width_cm,
              depth: depth_cm,
              height: height_cm,
              area_m2: area_m2,
              volume_m3: volume_m3,
              material: get_component_material(component)
            }
            summary[:fence_decor] << item
          else
            ProGran3::Logger.warn("⚠️ Компонент '#{name}' НЕ розпізнано жодним case!", "Summary")
          end
        end
        
        # Логуємо результати збору
        summary.each do |category, items|
          ProGran3::Logger.info("📊 #{category}: #{items.count} елементів", "Summary")
        end
        
        # Групуємо однакові компоненти
        grouped_summary = {}
        summary.each do |category, items|
          # Foundation, BlindArea, Stands, Tiles, Steles, Flowerbeds, FenceCorner, FenceDecor не групуємо - вони мають додаткові дані (площа, об'єм)
          if category == :foundation || category == :blind_area || category == :stands || 
             category == :tiles || category == :steles || category == :flowerbeds || 
             category == :fence_corner || category == :fence_decor
            grouped_summary[category] = items
          else
            grouped_summary[category] = group_components(items)
          end
        end
        
        # Логуємо згруповані результати
        grouped_summary.each do |category, items|
          if items.any?
            if category == :foundation
              ProGran3::Logger.info("✅ #{category}: #{items.count} елементів", "Summary")
            else
              ProGran3::Logger.info("✅ #{category} (згруповано): #{items.count} типів", "Summary")
            end
            
            items.each do |item|
              if category == :foundation || category == :blind_area || category == :stands || 
                 category == :tiles || category == :steles || category == :flowerbeds || 
                 category == :fence_corner || category == :fence_decor
                log_text = "  - #{item[:name]}: #{item[:depth]}×#{item[:width]}×#{item[:height]} см" if item[:name]
                log_text = "  - #{item[:depth]}×#{item[:width]}×#{item[:height]} см" unless item[:name]
                log_text += " (#{item[:stand_type]})" if item[:stand_type]
                log_text += " (#{item[:tile_type]})" if item[:tile_type]
                log_text += ", Площа: #{item[:area_m2]} м²" if item[:area_m2]
                log_text += ", Об'єм: #{item[:volume_m3]} м³" if item[:volume_m3]
              else
                log_text = "  - #{item[:width]}×#{item[:depth]}×#{item[:height]} см (#{item[:material]}) - #{item[:count]} шт"
              end
              ProGran3::Logger.info(log_text, "Summary")
            end
            
            # Показуємо загальну суму
            if (category == :tiles || category == :steles || category == :flowerbeds || 
                category == :fence_corner || category == :fence_decor) && items.any?
              total_area = items.map { |t| t[:area_m2] || 0 }.sum
              total_volume = items.map { |t| t[:volume_m3] || 0 }.sum
              cat_name = case category
                when :tiles then "Плитка"
                when :steles then "Стели"
                when :flowerbeds then "Квітники"
                when :fence_corner then "Кутова огорожа"
                when :fence_decor then "Декор огорожі"
              end
              ProGran3::Logger.info("  📊 ЗАГАЛОМ #{cat_name}: Площа #{total_area.round(2)} м², Об'єм #{total_volume.round(3)} м³", "Summary")
            end
          end
        end
        
        # Валідація підсумку (тільки попередження)
        warnings = ProGran3::SummaryValidator.validate_summary(grouped_summary)
        
        # Додаємо метадані (тільки timestamp та попередження)
        result_data = {
          summary: grouped_summary,
          metadata: {
            timestamp: Time.now.iso8601,
            warnings: warnings
          }
        }
        
        # Кешуємо результат
        ProGran3::SummaryCache.cache_summary(result_data)
        
        # Відправляємо в JS
        json_data = result_data.to_json
        ProGran3::Logger.info("📤 Відправка даних в JS: #{json_data.length} символів", "Summary")
        
        if warnings.any?
          ProGran3::Logger.warn("⚠️ Знайдено #{warnings.count} попереджень", "Summary")
          warnings.each { |w| ProGran3::Logger.warn("  - #{w}", "Summary") }
        end
        
        # Викликаємо відповідний JS callback
        if for_report
          # v3.2: showReportModal тепер async
          dialog.execute_script("(async () => { await window.ProGran3.UI.SummaryTable.showReportModal(#{json_data}); })();")
        else
          dialog.execute_script("updateDetailedSummary(#{json_data});")
        end
        
        ProGran3::Logger.info("✅ Детальна специфікація згенерована успішно", "Summary")
        true
        
      rescue => e
        ErrorHandler.handle_error(e, "Summary", "get_detailed_summary")
        false
      end
    end
    
    private
    
    # Аналіз внутрішніх компонентів плитки
    def analyze_tile_components(tile_group, tiles_array)
      definition = tile_group.definition
      group_trans = tile_group.transformation
      
      ProGran3::Logger.info("  📦 Аналіз групи плитки: #{definition.name}", "Summary")
      ProGran3::Logger.info("  📦 Група трансформація: scale #{group_trans.xscale}, #{group_trans.yscale}, #{group_trans.zscale}", "Summary")
      ProGran3::Logger.info("  📦 Внутрішніх entities: #{definition.entities.count}", "Summary")
      
      internal_components = definition.entities.grep(Sketchup::ComponentInstance)
      ProGran3::Logger.info("  📦 Внутрішніх компонентів: #{internal_components.count}", "Summary")
      
      internal_components.each do |tile|
        bounds = tile.bounds
        
        # Комбінована трансформація (група + сама плитка)
        combined_trans = group_trans * tile.transformation
        
        # Розміри в см (з урахуванням трансформації групи)
        width_cm = (bounds.width.to_mm / 10.0).round(1)
        depth_cm = (bounds.depth.to_mm / 10.0).round(1)
        height_cm = (bounds.height.to_mm / 10.0).round(1)
        
        ProGran3::Logger.info("    📏 Плитка bounds: #{bounds.width.to_mm} × #{bounds.depth.to_mm} × #{bounds.height.to_mm} мм", "Summary")
        
        # Площа верхньої грані (з урахуванням комбінованої трансформації)
        scale_x = combined_trans.xscale
        scale_y = combined_trans.yscale
        
        ProGran3::Logger.info("    🔄 Комбінована трансформація: scale #{scale_x.round(3)}, #{scale_y.round(3)}", "Summary")
        
        top_area = 0
        tile.definition.entities.grep(Sketchup::Face).each do |face|
          if face.normal.z > 0.9
            top_area += face.area * scale_x * scale_y
          end
        end
        area_m2 = (top_area / 1550.0031).round(3)
        
        # Об'єм (з урахуванням всіх scale)
        volume_cu_inches = bounds.width * bounds.depth * bounds.height * scale_x * scale_y * combined_trans.zscale
        volume_m3 = (volume_cu_inches * 0.000016387064).round(4)
        
        material = get_component_material(tile)
        
        ProGran3::Logger.info("    ➕ Плитка: #{tile.definition.name}, #{depth_cm}×#{width_cm}×#{height_cm} см, Площа: #{area_m2} м², Об'єм: #{volume_m3} м³", "Summary")
        
        item = {
          name: tile.definition.name,
          width: width_cm,
          depth: depth_cm,
          height: height_cm,
          area_m2: area_m2,
          volume_m3: volume_m3,
          material: material
        }
        tiles_array << item
      end
      
      # Якщо немає внутрішніх компонентів, додаємо сам tile_group
      if tiles_array.empty?
        ProGran3::Logger.info("  ⚠️ Немає внутрішніх компонентів, додаю саму групу", "Summary")
        bounds = tile_group.bounds
        trans = tile_group.transformation
        
        width_cm = (bounds.width.to_mm / 10.0).round(1)
        depth_cm = (bounds.depth.to_mm / 10.0).round(1)
        height_cm = (bounds.height.to_mm / 10.0).round(1)
        
        # Площа та об'єм
        scale_x = trans.xscale
        scale_y = trans.yscale
        
        top_area = 0
        tile_group.definition.entities.grep(Sketchup::Face).each do |face|
          if face.normal.z > 0.9
            top_area += face.area * scale_x * scale_y
          end
        end
        area_m2 = (top_area / 1550.0031).round(3)
        
        volume_cu_inches = bounds.width * bounds.depth * bounds.height
        volume_m3 = (volume_cu_inches * 0.000016387064).round(4)
        
        material = get_component_material(tile_group)
        
        ProGran3::Logger.info("    ➕ Група як єдиний елемент: #{depth_cm}×#{width_cm}×#{height_cm} см, Площа: #{area_m2} м², Об'єм: #{volume_m3} м³", "Summary")
        
        item = {
          name: tile_group.definition.name,
          width: width_cm,
          depth: depth_cm,
          height: height_cm,
          area_m2: area_m2,
          volume_m3: volume_m3,
          material: material
        }
        tiles_array << item
      end
    end
    
    # Аналіз внутрішніх компонентів облицювання
    def analyze_cladding_components(cladding_group, cladding_array)
      definition = cladding_group.definition
      definition.entities.grep(Sketchup::ComponentInstance).each do |piece|
        bounds = piece.bounds
        
        item = {
          name: piece.definition.name,
          width: (bounds.width / 10.0).round(1),
          depth: (bounds.depth / 10.0).round(1),
          height: (bounds.height / 10.0).round(1),
          material: get_component_material(piece)
        }
        cladding_array << item
      end
      
      # Якщо немає внутрішніх компонентів, додаємо сам cladding_group
      if cladding_array.empty?
        bounds = cladding_group.bounds
        item = {
          name: cladding_group.definition.name,
          width: (bounds.width / 10.0).round(1),
          depth: (bounds.depth / 10.0).round(1),
          height: (bounds.height / 10.0).round(1),
          material: get_component_material(cladding_group)
        }
        cladding_array << item
      end
    end
    
    # Отримання матеріалу компонента
    def get_component_material(component)
      # Спробуємо отримати матеріал компонента
      if component.material
        return component.material.display_name
      end
      
      # Якщо у компонента немає матеріалу, шукаємо в його definition
      definition = component.definition
      if definition.entities.length > 0
        first_entity = definition.entities[0]
        if first_entity.respond_to?(:material) && first_entity.material
          return first_entity.material.display_name
        end
      end
      
      # Шукаємо в faces definition
      definition.entities.grep(Sketchup::Face).each do |face|
        if face.material
          return face.material.display_name
        end
      end
      
      "Без матеріалу"
    end
    
    # Групування компонентів за розмірами і матеріалом
    def group_components(items)
      grouped = {}
      
      items.each do |item|
        key = "#{item[:width]}×#{item[:depth]}×#{item[:height]}_#{item[:material]}"
        
        if grouped[key]
          grouped[key][:count] += 1
        else
          grouped[key] = item.merge(count: 1)
        end
      end
      
      grouped.values.sort_by { |item| -item[:count] }
    end
  end
end
