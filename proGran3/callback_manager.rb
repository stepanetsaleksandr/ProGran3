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
      
      # Створюємо підставку з правильним позиціонуванням
      success = ProGran3.create_stand_with_dimensions(@stand_params[:height], @stand_params[:width], @stand_params[:depth], @stand_params[:gaps], @stand_params[:gaps_height], @stand_params[:gaps_width], @stand_params[:gaps_depth])
      
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
      
      ProGran3::TilingBuilder.insert_perimeter_tiles(thickness, borderWidth, overhang, seam)
      true
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
      
      ProGran3::TilingBuilder.insert_modular_tiles(tileSize, thickness, seam, overhang)
      true
    end

    # Callback для облицювання
    def add_cladding_callback(dialog, thickness)
      thickness = thickness.to_i
      
      return false unless validate_dimensions_callback(100, 100, thickness, "облицювання")
      
      # Зберігаємо параметри для автоматичного оновлення
      @cladding_params = { thickness: thickness }
      
      ProGran3::CladdingBuilder.create(thickness)
      true
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
      
      case mode
      when "uniform"
        ProGran3::BlindAreaBuilder.create_uniform(width_params[0].to_i, thickness)
      when "custom"
        ProGran3::BlindAreaBuilder.create(*width_params.map(&:to_i), thickness)
      end
      true
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
    def add_model_callback(dialog, category, model_name, stele_type = nil, stele_distance = nil)
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
          @stele_params = { category: category, filename: model_name, type: stele_type, distance: stele_distance }
        when :flowerbeds
          @flowerbed_params = { category: category, filename: model_name }
        when :gravestones
          @gravestone_params = { category: category, filename: model_name }
        when :fence_decor
          @fence_decor_params = { category: category, filename: model_name }
        end
        
        # Додаємо модель
        if category.to_sym == :steles && stele_type == 'paired'
          success = ProGran3.insert_paired_steles(category, model_name, stele_distance)
        else
          success = ProGran3.insert_component(category, model_name)
        end
        
        if success
          # Оновлення стану через ModelStateManager
          state_params = { filename: model_name }
          if category.to_sym == :steles
            state_params[:type] = stele_type if stele_type
            state_params[:distance] = stele_distance if stele_distance
          end
          ModelStateManager.component_added(category.to_sym, state_params)
        end
        
        success
      rescue => e
        ErrorHandler.handle_error(e, "UI", "add_model")
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
