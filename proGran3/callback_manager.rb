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
  end
end
