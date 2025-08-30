# progran3/callback_manager.rb
module ProGran3
  module CallbackManager
    extend self

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
      CoordinationManager.update_all_elements(@foundation_params)
      true
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
    def add_tiles_frame_callback(dialog, thickness, borderWidth, overhang)
      thickness, borderWidth, overhang = [thickness, borderWidth, overhang].map(&:to_i)
      
      return false unless validate_dimensions_callback(borderWidth, overhang, thickness, "периметральної плитки")
      
      # Зберігаємо параметри для автоматичного оновлення
      @tiles_params = {
        mode: 'frame',
        thickness: thickness,
        border_width: borderWidth,
        overhang: overhang
      }
      
      ProGran3::TilingBuilder.insert_perimeter_tiles(thickness, borderWidth, overhang)
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

    # Callback для додавання моделей
    def add_model_callback(dialog, category, model_name)
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
        
        # Зберігаємо параметри для автоматичного оновлення
        case category.to_sym
        when :stands
          @stand_params = { category: category, filename: model_name }
        when :steles
          @stele_params = { category: category, filename: model_name }
        when :flowerbeds
          @flowerbed_params = { category: category, filename: model_name }
        when :gravestones
          @gravestone_params = { category: category, filename: model_name }
        end
        
        # Додаємо модель
        ProGran3.insert_component(category, model_name)
        true
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
    end
  end
end
