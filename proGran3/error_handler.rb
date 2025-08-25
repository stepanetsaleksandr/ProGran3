# progran3/error_handler.rb
require_relative 'logger'

module ProGran3
  module ErrorHandler
    extend self
    
    # Клас для кастомних помилок плагіна
    class ProGranError < StandardError
      attr_reader :context, :code
      
      def initialize(message, context = nil, code = nil)
        super(message)
        @context = context
        @code = code
      end
    end
    
    # Специфічні помилки
    class ValidationError < ProGranError; end
    class FileNotFoundError < ProGranError; end
    class ComponentError < ProGranError; end
    class UIError < ProGranError; end
    
    # Обробка помилок з контекстом
    def handle_error(error, context = nil, operation = nil)
      error_context = context || error.context || "Unknown"
      operation_info = operation ? " (операція: #{operation})" : ""
      
      # Логуємо помилку
      Logger.error("#{error.message}#{operation_info}", error_context)
      
      # Логуємо стек викликів для детального аналізу
      if Logger.level == :debug
        Logger.debug("Стек викликів:", error_context)
        error.backtrace&.first(5)&.each do |line|
          Logger.debug("  #{line}", error_context)
        end
      end
      
      # Показуємо користувачу зрозуміле повідомлення
      show_user_friendly_error(error, error_context)
    end
    
    # Безпечне виконання блоку коду
    def safe_execute(context = nil, operation = nil)
      yield
    rescue ProGranError => e
      handle_error(e, context, operation)
      false
    rescue StandardError => e
      handle_error(e, context, operation)
      false
    rescue => e
      handle_error(e, context, operation)
      false
    end
    
    # Валідація з викиданням помилки
    def validate(condition, message, context = nil)
      return true if condition
      
      error = ValidationError.new(message, context)
      raise error
    end
    
    # Перевірка існування файлу
    def validate_file_exists(file_path, context = nil)
      unless File.exist?(file_path)
        error = FileNotFoundError.new("Файл не знайдено: #{file_path}", context)
        raise error
      end
      true
    end
    
    # Перевірка активного моделю
    def validate_active_model(context = nil)
      model = Sketchup.active_model
      unless model
        error = ComponentError.new("Активна модель не знайдена", context)
        raise error
      end
      model
    end
    
    # Перевірка активного вибору
    def validate_selection(context = nil)
      model = validate_active_model(context)
      selection = model.selection
      
      if selection.empty?
        error = ComponentError.new("Нічого не вибрано", context)
        raise error
      end
      
      selection
    end
    
    private
    
    # Показ зрозумілого повідомлення користувачу
    def show_user_friendly_error(error, context)
      user_message = case error
      when ValidationError
        "Помилка валідації: #{error.message}"
      when FileNotFoundError
        "Файл не знайдено: #{error.message}"
      when ComponentError
        "Помилка компонента: #{error.message}"
      when UIError
        "Помилка інтерфейсу: #{error.message}"
      when ProGranError
        "Помилка ProGran3: #{error.message}"
      else
        "Неочікувана помилка: #{error.message}"
      end
      
      # Додаємо контекст якщо він є
      if context && context != "Unknown"
        user_message += "\nКонтекст: #{context}"
      end
      
      # Показуємо діалог
      begin
        ::UI.messagebox(user_message, MB_OK)
      rescue => e
        # Якщо не вдалося показати діалог, виводимо в консоль
        Logger.error("Не вдалося показати діалог помилки: #{e.message}")
        puts "❌ #{user_message}"
      end
    end
  end
end

