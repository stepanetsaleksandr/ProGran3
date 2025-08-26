# progran3/dimensions_manager.rb
# Єдиний модуль для управління розмірами в ProGran3
require_relative 'constants'
require_relative 'validation'
require_relative 'logger'
require_relative 'error_handler'

module ProGran3
  module DimensionsManager
    extend self
    
    # Підтримувані одиниці вимірювання
    SUPPORTED_UNITS = [:mm, :cm]
    DEFAULT_UNIT = :mm
    
    # Поточна одиниця вимірювання (може змінюватися)
    @current_unit = DEFAULT_UNIT
    
    # Типи розмірів для різних елементів
    DIMENSION_TYPES = {
      foundation: {
        depth: { min: 500, max: 5000, default: 2000, label: "Довжина" },
        width: { min: 300, max: 3000, default: 1000, label: "Ширина" },
        height: { min: 100, max: 500, default: 150, label: "Висота" }
      },
      blind_area: {
        thickness: { min: 30, max: 200, default: 50, label: "Товщина" },
        width: { min: 50, max: 1000, default: 300, label: "Ширина" }
      },
      tiles: {
        thickness: { min: 10, max: 100, default: 30, label: "Товщина" },
        border_width: { min: 50, max: 1000, default: 300, label: "Ширина рамки" },
        overhang: { min: 10, max: 200, default: 50, label: "Виступ" },
        seam: { min: 1, max: 20, default: 5, label: "Шов" }
      },
      cladding: {
        thickness: { min: 10, max: 100, default: 20, label: "Товщина" }
      }
    }
    
    # Конвертація в SketchUp одиниці (мм)
    def to_sketchup_units(value, unit = nil)
      unit ||= @current_unit
      
      if value.is_a?(Numeric)
        case unit
        when :mm
          return value.mm
        when :cm
          return (value * 10).mm
        else
          raise ArgumentError, "Непідтримувана одиниця: #{unit}"
        end
      end
      
      # Обробка рядків з одиницями
      if value.is_a?(String)
        return parse_dimension_string(value)
      end
      
      raise ArgumentError, "Непідтримуваний тип розміру: #{value.class}"
    end
    
    # Конвертація з SketchUp одиниць (мм) в числове значення
    def from_sketchup_units(value, unit = nil)
      unit ||= @current_unit
      
      if value.is_a?(Numeric)
        case unit
        when :mm
          return value.to_f
        when :cm
          return (value.to_f / 10).round(1)
        else
          raise ArgumentError, "Непідтримувана одиниця: #{unit}"
        end
      end
      
      raise ArgumentError, "Непідтримуваний тип для конвертації: #{value.class}"
    end
    
    # Валідація та конвертація розміру
    def validate_and_convert(value, dimension_type, context = "DimensionsManager")
      begin
        # Конвертуємо в SketchUp одиниці
        sketchup_value = to_sketchup_units(value)
        
        # Валідуємо розмір
        validation_result = validate_dimension(sketchup_value, dimension_type, context)
        
        if validation_result.valid
          Logger.debug("Розмір валідовано та конвертовано: #{value} -> #{sketchup_value}", context)
          { success: true, value: sketchup_value, original: value }
        else
          Logger.warn("Помилка валідації розміру: #{validation_result.error_messages.join(', ')}", context)
          { success: false, errors: validation_result.error_messages, original: value }
        end
        
      rescue => e
        ErrorHandler.handle_error(e, context, "validate_and_convert")
        { success: false, errors: [e.message], original: value }
      end
    end
    
    # Валідація розміру для конкретного типу
    def validate_dimension(value, dimension_type, context = "DimensionsManager")
      result = Validation::ValidationResult.new
      
      # Отримуємо налаштування для типу розміру
      type_config = get_dimension_config(dimension_type)
      return result unless type_config
      
      # Перевіряємо чи є значення числом
      unless value.is_a?(Numeric) && value > 0
        result.add_error("#{type_config[:label]} повинна бути додатним числом", :value)
        return result
      end
      
      # Перевіряємо діапазон
      if value < type_config[:min]
        result.add_error("#{type_config[:label]} повинна бути не менше #{type_config[:min]}мм", :min)
      elsif value > type_config[:max]
        result.add_error("#{type_config[:label]} повинна бути не більше #{type_config[:max]}мм", :max)
      end
      
      result
    end
    
    # Отримання конфігурації розміру
    def get_dimension_config(dimension_type)
      # Шукаємо в DIMENSION_TYPES
      DIMENSION_TYPES.each do |category, dimensions|
        dimensions.each do |dim_name, config|
          if "#{category}_#{dim_name}".to_sym == dimension_type
            return config
          end
        end
      end
      
      # Якщо не знайдено, повертаємо загальні налаштування
      {
        min: Constants::MIN_DIMENSION,
        max: Constants::MAX_DIMENSION,
        default: 100,
        label: "Розмір"
      }
    end
    
    # Отримання значення за замовчуванням для типу розміру
    def get_default_value(dimension_type)
      config = get_dimension_config(dimension_type)
      config[:default]
    end
    
    # Отримання мінімального значення для типу розміру
    def get_min_value(dimension_type)
      config = get_dimension_config(dimension_type)
      config[:min]
    end
    
    # Отримання максимального значення для типу розміру
    def get_max_value(dimension_type)
      config = get_dimension_config(dimension_type)
      config[:max]
    end
    
    # Отримання підпису для типу розміру
    def get_label(dimension_type)
      config = get_dimension_config(dimension_type)
      config[:label]
    end
    
    # Парсинг рядка з розміром (наприклад, "150mm", "15cm")
    def parse_dimension_string(value)
      return value.to_f.mm if value.match(/^\d+(\.\d+)?$/)
      
      # Парсимо рядки з одиницями
      if value.match(/^\d+(\.\d+)?\s*mm$/i)
        return value.gsub(/mm/i, '').to_f.mm
      elsif value.match(/^\d+(\.\d+)?\s*cm$/i)
        return (value.gsub(/cm/i, '').to_f * 10).mm
      elsif value.match(/^\d+(\.\d+)?\s*m$/i)
        return (value.gsub(/m/i, '').to_f * 1000).mm
      end
      
      raise ArgumentError, "Непідтримуваний формат розміру: #{value}"
    end
    
    # Форматування розміру для відображення
    def format_for_display(value, unit = nil)
      unit ||= @current_unit
      
      case unit
      when :mm
        return "#{value.to_i}мм"
      when :cm
        return "#{value.to_f}см"
      else
        raise ArgumentError, "Непідтримувана одиниця для відображення: #{unit}"
      end
    end
    
    # Перевірка чи підтримується одиниця
    def supported_unit?(unit)
      SUPPORTED_UNITS.include?(unit.to_sym)
    end
    
    # Отримання поточної одиниці вимірювання
    def current_unit
      @current_unit
    end
    
    # Встановлення поточної одиниці вимірювання
    def set_current_unit(unit)
      if supported_unit?(unit)
        @current_unit = unit.to_sym
        Logger.info("Одиниця вимірювання змінена на: #{unit}", "DimensionsManager")
        true
      else
        Logger.warn("Непідтримувана одиниця: #{unit}", "DimensionsManager")
        false
      end
    end
    
    # Конвертація значення між одиницями
    def convert_value(value, from_unit, to_unit)
      return value unless supported_unit?(from_unit) && supported_unit?(to_unit)
      
      # Спочатку конвертуємо в мм
      mm_value = case from_unit
      when :mm
        value
      when :cm
        value * 10
      end
      
      # Потім конвертуємо в цільову одиницю
      case to_unit
      when :mm
        mm_value
      when :cm
        (mm_value / 10.0).round(1)
      end
    end
    
    # Отримання всіх підтримуваних одиниць
    def supported_units
      SUPPORTED_UNITS.dup
    end
  end
end
