# progran3/validation.rb
require_relative 'constants'
require_relative 'logger'
require_relative 'error_handler'

module ProGran3
  module Validation
    extend self
    
    # Клас для результатів валідації
    class ValidationResult
      attr_reader :valid, :errors, :warnings
      
      def initialize
        @valid = true
        @errors = []
        @warnings = []
      end
      
      def add_error(message, field = nil)
        @valid = false
        @errors << { message: message, field: field }
      end
      
      def add_warning(message, field = nil)
        @warnings << { message: message, field: field }
      end
      
      def error_messages
        @errors.map { |e| e[:message] }
      end
      
      def warning_messages
        @warnings.map { |w| w[:message] }
      end
      
      def to_s
        if @valid
          "✅ Валідація пройшла успішно"
        else
          "❌ Помилки валідації:\n" + @errors.map { |e| "  - #{e[:message]}" }.join("\n")
        end
      end
    end
    
    # Валідація розмірів
    def validate_dimensions(width, height, thickness = nil, context = "Dimensions")
      result = ValidationResult.new
      
      # Перевірка ширини
      if !(width.is_a?(Numeric) && width > 0)
        result.add_error("Ширина повинна бути додатним числом", :width)
      elsif width < Constants::MIN_DIMENSION || width > Constants::MAX_DIMENSION
        result.add_error("Ширина повинна бути від #{Constants::MIN_DIMENSION} до #{Constants::MAX_DIMENSION}", :width)
      end
      
      # Перевірка висоти
      if !(height.is_a?(Numeric) && height > 0)
        result.add_error("Висота повинна бути додатним числом", :height)
      elsif height < Constants::MIN_DIMENSION || height > Constants::MAX_DIMENSION
        result.add_error("Висота повинна бути від #{Constants::MIN_DIMENSION} до #{Constants::MAX_DIMENSION}", :height)
      end
      
      # Перевірка товщини (якщо передана)
      if thickness
        if !(thickness.is_a?(Numeric) && thickness > 0)
          result.add_error("Товщина повинна бути додатним числом", :thickness)
        elsif thickness < Constants::MIN_THICKNESS || thickness > Constants::MAX_THICKNESS
          result.add_error("Товщина повинна бути від #{Constants::MIN_THICKNESS} до #{Constants::MAX_THICKNESS}", :thickness)
        end
      end
      
      # Логуємо результат
      if result.valid
        Logger.debug("Валідація розмірів пройшла успішно", context)
      else
        Logger.warn("Помилки валідації розмірів: #{result.error_messages.join(', ')}", context)
      end
      
      result
    end
    
    # Валідація периметральної огорожі (дозволяє 0 для кількості стовпів)
    def validate_fence_perimeter(post_height, post_width, post_depth, north_count, south_count, east_west_count, decorative_height, decorative_thickness, context = "FencePerimeter")
      result = ValidationResult.new
      
      # Валідація розмірів стовпів (мають бути > 0)
      if !(post_height.is_a?(Numeric) && post_height > 0)
        result.add_error("Висота стовпа повинна бути додатним числом", :post_height)
      elsif post_height < Constants::MIN_DIMENSION || post_height > Constants::MAX_DIMENSION
        result.add_error("Висота стовпа повинна бути від #{Constants::MIN_DIMENSION} до #{Constants::MAX_DIMENSION}", :post_height)
      end
      
      if !(post_width.is_a?(Numeric) && post_width > 0)
        result.add_error("Ширина стовпа повинна бути додатним числом", :post_width)
      elsif post_width < Constants::MIN_DIMENSION || post_width > Constants::MAX_DIMENSION
        result.add_error("Ширина стовпа повинна бути від #{Constants::MIN_DIMENSION} до #{Constants::MAX_DIMENSION}", :post_width)
      end
      
      if !(post_depth.is_a?(Numeric) && post_depth > 0)
        result.add_error("Глибина стовпа повинна бути додатним числом", :post_depth)
      elsif post_depth < Constants::MIN_DIMENSION || post_depth > Constants::MAX_DIMENSION
        result.add_error("Глибина стовпа повинна бути від #{Constants::MIN_DIMENSION} до #{Constants::MAX_DIMENSION}", :post_depth)
      end
      
      # Валідація кількості стовпів (може бути 0)
      if !(north_count.is_a?(Numeric) && north_count >= 0)
        result.add_error("Кількість північних стовпів повинна бути невід'ємним числом", :north_count)
      elsif north_count > 10
        result.add_error("Кількість північних стовпів не може перевищувати 10", :north_count)
      end
      
      if !(south_count.is_a?(Numeric) && south_count >= 0)
        result.add_error("Кількість південних стовпів повинна бути невід'ємним числом", :south_count)
      elsif south_count > 10
        result.add_error("Кількість південних стовпів не може перевищувати 10", :south_count)
      end
      
      if !(east_west_count.is_a?(Numeric) && east_west_count >= 0)
        result.add_error("Кількість східно-західних стовпів повинна бути невід'ємним числом", :east_west_count)
      elsif east_west_count > 10
        result.add_error("Кількість східно-західних стовпів не може перевищувати 10", :east_west_count)
      end
      
      # Валідація декоративних елементів (мають бути > 0)
      if !(decorative_height.is_a?(Numeric) && decorative_height > 0)
        result.add_error("Висота декора повинна бути додатним числом", :decorative_height)
      elsif decorative_height < Constants::MIN_DIMENSION || decorative_height > Constants::MAX_DIMENSION
        result.add_error("Висота декора повинна бути від #{Constants::MIN_DIMENSION} до #{Constants::MAX_DIMENSION}", :decorative_height)
      end
      
      if !(decorative_thickness.is_a?(Numeric) && decorative_thickness > 0)
        result.add_error("Товщина декора повинна бути додатним числом", :decorative_thickness)
      elsif decorative_thickness < Constants::MIN_THICKNESS || decorative_thickness > Constants::MAX_THICKNESS
        result.add_error("Товщина декора повинна бути від #{Constants::MIN_THICKNESS} до #{Constants::MAX_THICKNESS}", :decorative_thickness)
      end
      
      # Логуємо результат
      if result.valid
        Logger.debug("Валідація периметральної огорожі пройшла успішно", context)
      else
        Logger.warn("Помилки валідації периметральної огорожі: #{result.error_messages.join(', ')}", context)
      end
      
      result
    end
    
    # Валідація файлів
    def validate_file_path(file_path, context = "FileValidation")
      result = ValidationResult.new
      
      unless file_path.is_a?(String) && !file_path.empty?
        result.add_error("Шлях до файлу не може бути порожнім", :file_path)
        return result
      end
      
      unless File.exist?(file_path)
        result.add_error("Файл не знайдено: #{file_path}", :file_path)
      end
      
      # Перевірка розширення
      extension = File.extname(file_path).downcase
      unless ['.skp', '.png', '.jpg', '.jpeg'].include?(extension)
        result.add_warning("Непідтримуване розширення файлу: #{extension}", :file_path)
      end
      
      if result.valid
        Logger.debug("Файл валідний: #{file_path}", context)
      else
        Logger.warn("Помилки валідації файлу: #{result.error_messages.join(', ')}", context)
      end
      
      result
    end
    
    # Валідація категорії компонентів
    def validate_category(category, context = "CategoryValidation")
      result = ValidationResult.new
      
      unless category.is_a?(String) || category.is_a?(Symbol)
        result.add_error("Категорія повинна бути рядком або символом", :category)
        return result
      end
      
      category_sym = category.to_sym
      unless Constants::COMPONENT_CATEGORIES.include?(category_sym)
        result.add_error("Непідтримувана категорія: #{category}", :category)
      end
      
      if result.valid
        Logger.debug("Категорія валідна: #{category}", context)
      else
        Logger.warn("Помилка валідації категорії: #{result.error_messages.join(', ')}", context)
      end
      
      result
    end
    
    # Валідація одиниць вимірювання
    def validate_unit(unit, context = "UnitValidation")
      result = ValidationResult.new
      
      unless unit.is_a?(String) || unit.is_a?(Symbol)
        result.add_error("Одиниця вимірювання повинна бути рядком або символом", :unit)
        return result
      end
      
      unit_sym = unit.to_sym
      unless Constants::SUPPORTED_UNITS.include?(unit_sym)
        result.add_error("Непідтримувана одиниця вимірювання: #{unit}", :unit)
      end
      
      if result.valid
        Logger.debug("Одиниця вимірювання валідна: #{unit}", context)
      else
        Logger.warn("Помилка валідації одиниці: #{result.error_messages.join(', ')}", context)
      end
      
      result
    end
    
    # Валідація налаштувань UI
    def validate_ui_settings(width, height, context = "UISettings")
      result = ValidationResult.new
      
      # Перевірка ширини діалогу
      if !(width.is_a?(Numeric) && width > 0)
        result.add_error("Ширина діалогу повинна бути додатним числом", :width)
      elsif width < Constants::MIN_DIALOG_WIDTH
        result.add_warning("Ширина діалогу занадто мала, рекомендовано мінімум #{Constants::MIN_DIALOG_WIDTH}", :width)
      end
      
      # Перевірка висоти діалогу
      if !(height.is_a?(Numeric) && height > 0)
        result.add_error("Висота діалогу повинна бути додатним числом", :height)
      elsif height < Constants::MIN_DIALOG_HEIGHT
        result.add_warning("Висота діалогу занадто мала, рекомендовано мінімум #{Constants::MIN_DIALOG_HEIGHT}", :height)
      end
      
      if result.valid
        Logger.debug("Налаштування UI валідні", context)
      else
        Logger.warn("Попередження валідації UI: #{result.warning_messages.join(', ')}", context)
      end
      
      result
    end
    
    # Валідація налаштувань превью
    def validate_preview_settings(size, context = "PreviewSettings")
      result = ValidationResult.new
      
      if !(size.is_a?(Numeric) && size > 0)
        result.add_error("Розмір превью повинен бути додатним числом", :size)
        return result
      end
      
      if size < Constants::MIN_PREVIEW_SIZE
        result.add_warning("Розмір превью занадто малий, рекомендовано мінімум #{Constants::MIN_PREVIEW_SIZE}", :size)
      elsif size > Constants::MAX_PREVIEW_SIZE
        result.add_warning("Розмір превью занадто великий, рекомендовано максимум #{Constants::MAX_PREVIEW_SIZE}", :size)
      end
      
      if result.valid
        Logger.debug("Налаштування превью валідні: #{size}", context)
      else
        Logger.warn("Попередження валідації превью: #{result.warning_messages.join(', ')}", context)
      end
      
      result
    end
    
    # Комплексна валідація компонента
    def validate_component_data(data, context = "ComponentData")
      result = ValidationResult.new
      
      # Перевірка обов'язкових полів
      required_fields = [:width, :height, :category]
      required_fields.each do |field|
        unless data.key?(field)
          result.add_error("Відсутнє обов'язкове поле: #{field}", field)
        end
      end
      
      return result unless result.valid
      
      # Валідація розмірів
      dim_result = validate_dimensions(data[:width], data[:height], data[:thickness], context)
      result.errors.concat(dim_result.errors)
      result.warnings.concat(dim_result.warnings)
      result.instance_variable_set(:@valid, result.valid && dim_result.valid)
      
      # Валідація категорії
      cat_result = validate_category(data[:category], context)
      result.errors.concat(cat_result.errors)
      result.warnings.concat(cat_result.warnings)
      result.instance_variable_set(:@valid, result.valid && cat_result.valid)
      
      # Валідація одиниці (якщо є)
      if data[:unit]
        unit_result = validate_unit(data[:unit], context)
        result.errors.concat(unit_result.errors)
        result.warnings.concat(unit_result.warnings)
        result.instance_variable_set(:@valid, result.valid && unit_result.valid)
      end
      
      # Валідація файлу (якщо є)
      if data[:file_path]
        file_result = validate_file_path(data[:file_path], context)
        result.errors.concat(file_result.errors)
        result.warnings.concat(file_result.warnings)
        result.instance_variable_set(:@valid, result.valid && file_result.valid)
      end
      
      if result.valid
        Logger.info("Дані компонента валідні", context)
      else
        Logger.error("Помилки валідації компонента: #{result.error_messages.join(', ')}", context)
      end
      
      result
    end
    
    # Швидка валідація з викиданням помилки
    def validate!(condition, message, context = nil)
      unless condition
        ErrorHandler.validate(false, message, context)
      end
      true
    end
    
    # Валідація з поверненням булевого значення
    def valid?(condition, message = nil, context = nil)
      if condition
        Logger.debug("Валідація пройшла: #{message}", context) if message
        true
      else
        Logger.warn("Валідація не пройшла: #{message}", context) if message
        false
      end
    end
    
    # Тестування системи валідації
    def self.test
      Logger.start("Тестування системи валідації", "Validation")
      
      # Тест валідації розмірів
      dim_result = validate_dimensions(100, 50, 10, "Test")
      Logger.info("Тест розмірів: #{dim_result.valid ? 'Пройшов' : 'Провалився'}", "Validation")
      
      # Тест валідації категорії
      cat_result = validate_category(:stands, "Test")
      Logger.info("Тест категорії: #{cat_result.valid ? 'Пройшов' : 'Провалився'}", "Validation")
      
      # Тест валідації одиниці
      unit_result = validate_unit(:mm, "Test")
      Logger.info("Тест одиниці: #{unit_result.valid ? 'Пройшов' : 'Провалився'}", "Validation")
      
      # Тест комплексної валідації
      component_data = {
        width: 100,
        height: 50,
        thickness: 10,
        category: :stands,
        unit: :mm
      }
      comp_result = validate_component_data(component_data, "Test")
      Logger.info("Тест компонента: #{comp_result.valid ? 'Пройшов' : 'Провалився'}", "Validation")
      
      Logger.finish("Тестування системи валідації", "Validation")
    end
  end
end
