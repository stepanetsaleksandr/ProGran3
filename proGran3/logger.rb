# progran3/logger.rb
require_relative 'constants'

module ProGran3
  module Logger
    extend self
    
    # Рівні логування
    LEVELS = {
      debug: 0,
      info: 1, 
      warn: 2,
      error: 3,
      fatal: 4
    }
    
    # Поточний рівень логування
    @current_level = LEVELS[Constants::DEFAULT_LOG_LEVEL]
    
    # Кольори для різних рівнів
    COLORS = {
      debug: "\033[36m", # Cyan
      info: "\033[32m",  # Green
      warn: "\033[33m",  # Yellow
      error: "\033[31m", # Red
      fatal: "\033[35m"  # Magenta
    }
    
    # Іконки для різних рівнів
    ICONS = {
      debug: "🔍",
      info: "ℹ️",
      warn: "⚠️",
      error: "❌",
      fatal: "💥"
    }
    
    # Встановлення рівня логування
    def level=(new_level)
      @current_level = LEVELS[new_level.to_sym] || LEVELS[:info]
    end
    
    # Отримання поточного рівня
    def level
      LEVELS.key(@current_level) || :info
    end
    
    # Основна функція логування
    def log(level, message, context = nil)
      return unless should_log?(level)
      
      timestamp = Time.now.strftime("%H:%M:%S")
      level_sym = level.to_sym
      icon = ICONS[level_sym] || "📝"
      color = COLORS[level_sym] || "\033[0m"
      
      formatted_message = format_message(timestamp, icon, message, context)
      
      # Виводимо в консоль SketchUp
      puts "#{color}#{formatted_message}\033[0m"
      
      # Додатково для помилок показуємо в UI
      if [:error, :fatal].include?(level_sym)
        show_error_dialog(message, context)
      end
    end
    
    # Методи для різних рівнів логування
    def debug(message, context = nil)
      log(:debug, message, context)
    end
    
    def info(message, context = nil)
      log(:info, message, context)
    end
    
    def warn(message, context = nil)
      log(:warn, message, context)
    end
    
    def error(message, context = nil)
      log(:error, message, context)
    end
    
    def fatal(message, context = nil)
      log(:fatal, message, context)
    end
    
    # Успішні операції
    def success(message, context = nil)
      log(:info, "✅ #{message}", context)
    end
    
    # Початок операції
    def start(operation, context = nil)
      log(:info, "🚀 Початок: #{operation}", context)
    end
    
    # Завершення операції
    def finish(operation, context = nil)
      log(:info, "✅ Завершено: #{operation}", context)
    end
    
    private
    
    # Перевірка чи потрібно логувати
    def should_log?(level)
      LEVELS[level.to_sym] >= @current_level
    end
    
    # Форматування повідомлення
    def format_message(timestamp, icon, message, context)
      if context
        "[#{timestamp}] #{icon} [#{context}] #{message}"
      else
        "[#{timestamp}] #{icon} #{message}"
      end
    end
    
    # Показ діалогу помилки
    def show_error_dialog(message, context)
      full_message = context ? "#{context}: #{message}" : message
      begin
        ::UI.messagebox("Помилка ProGran3:\n#{full_message}")
      rescue => e
        puts "❌ Не вдалося показати діалог помилки: #{e.message}"
      end
    end
  end
end

