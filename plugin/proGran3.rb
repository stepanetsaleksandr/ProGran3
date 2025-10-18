# progran3.rb
# VERSION: 2025-09-25-19:50 - FIX_SERVER_URL_INTERNAL
require 'sketchup.rb'

# Автоматичне перезавантаження плагіна при змінах
def self.reload_plugin
  puts "🔄 Перезавантаження плагіна ProGran3..."
  
  # Видаляємо глобальні змінні
  # $plugin_blocked = nil (видалено)
  # $license_manager = nil (видалено)
  $progran3_tracker = nil
  $tracker = nil
  
  # Видаляємо модуль
  Object.send(:remove_const, :ProGran3) if defined?(ProGran3)
  
  # Перезавантажуємо
  load __FILE__
  
  puts "✅ Плагін перезавантажено"
end

# Зберігаємо час останньої зміни файлу
$last_plugin_mtime = File.mtime(__FILE__)

# Автоматична перевірка змін при запуску UI
def self.check_for_updates
  current_mtime = File.mtime(__FILE__)
  if current_mtime > $last_plugin_mtime
    puts "🔄 Виявлено зміни в плагіні - перезавантаження..."
    reload_plugin
    return true
  end
  false
end
require 'socket'

# Глобальна змінна для статусу блокування плагіна (видалено)
# $plugin_blocked = false

# Глобальна змінна для менеджера ліцензій (видалено)
# $license_manager = nil

# Клас для відстеження активності плагіна (локальне логування)
class ProGran3Tracker
  def initialize
    @plugin_id = generate_unique_plugin_id
    @is_running = false
    @heartbeat_thread = nil
    @retry_count = 0
    @max_retries = 3
    @retry_delay = 30
  end

  private

  def generate_unique_plugin_id
    hostname = Socket.gethostname.downcase.gsub(/[^a-z0-9]/, '-')
    username = ENV['USERNAME'] || ENV['USER'] || 'sketchup-user'
    # Створюємо стабільний ID на основі hostname та username
    "progran3-desktop-#{hostname}-#{username}".downcase
  end

  public

  def start_tracking
    if @is_running
      puts "📊 Відстеження вже запущено, пропускаємо повторний запуск"
      return
    end
    
    @is_running = true
    puts "🚀 Запуск локального відстеження ProGran3 (без сервера)..."
    
    # Локальне логування замість серверного heartbeat
    puts "🚀 [#{Time.now.strftime('%H:%M:%S')}] Локальне логування активності..."
    log_local_activity
    
    puts "✅ Локальне відстеження активне. Plugin ID: #{@plugin_id}"
  end

  def stop_tracking
    puts "🔄 Початок зупинки відстеження..."
    @is_running = false
    
    # Зупиняємо SketchUp timer якщо він запущений
    if @sketchup_timer
      puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] Зупиняємо SketchUp timer: #{@sketchup_timer}"
      UI.stop_timer(@sketchup_timer) if defined?(UI) && UI.respond_to?(:stop_timer)
      @sketchup_timer = nil
    end
    
    # Відправляємо сигнал про закриття плагіна
    puts "📤 Спроба відправки сигналу закриття..."
    send_shutdown_signal
    
    if @heartbeat_thread
      # Graceful shutdown - чекаємо до 5 секунд
      puts "⏳ Очікування завершення heartbeat потоку..."
      @heartbeat_thread.join(5)
      @heartbeat_thread.kill if @heartbeat_thread.alive?
      puts "✅ Heartbeat потік завершено"
    end
    
    puts "⏹️ Відстеження зупинено"
  end

  # Локальне логування активності (замість серверного heartbeat)
  def log_local_activity
    timestamp = Time.now.strftime('%H:%M:%S')
    puts "📝 [#{timestamp}] ========== ЛОКАЛЬНЕ ЛОГУВАННЯ =========="
    puts "📝 [#{timestamp}] Plugin ID: #{@plugin_id}"
    puts "📝 [#{timestamp}] Час запуску: #{Time.now}"
    puts "📝 [#{timestamp}] Комп'ютер: #{Socket.gethostname}"
    puts "📝 [#{timestamp}] Користувач: #{ENV['USERNAME'] || ENV['USER'] || 'unknown'}"
    puts "📝 [#{timestamp}] ==========================================="
  end

  def send_heartbeat
    # Серверна частина видалена - використовуємо локальне логування
    log_local_activity
  end

  def send_shutdown_signal
    # Локальне логування закриття
    timestamp = Time.now.strftime('%H:%M:%S')
    puts "📝 [#{timestamp}] ========== ЛОКАЛЬНЕ ЛОГУВАННЯ ЗАКРИТТЯ =========="
    puts "📝 [#{timestamp}] Plugin ID: #{@plugin_id}"
    puts "📝 [#{timestamp}] Час закриття: #{Time.now}"
    puts "📝 [#{timestamp}] ================================================="
  end

  private
  
  public
  
  

  private

  def get_plugin_version
    # Читаємо версію з constants.rb або використовуємо дефолтну
    if defined?(ProGran3::Constants) && ProGran3::Constants.const_defined?(:VERSION)
      ProGran3::Constants::VERSION
    else
      "1.0.0"
    end
  end

  def get_user_identifier
    # Генеруємо унікальний ідентифікатор користувача
    username = ENV['USERNAME'] || ENV['USER'] || 'sketchup-user'
    hostname = Socket.gethostname
    "#{username}@#{hostname}"
  end

  def get_system_info
    {
      os: RUBY_PLATFORM,
      ruby_version: RUBY_VERSION,
      sketchup_version: defined?(Sketchup) ? Sketchup.version : 'unknown',
      architecture: RUBY_PLATFORM.include?('x64') ? '64-bit' : '32-bit'
    }
  end
end

module ProGran3
  # Підключаємо нові системні модулі першими
  require_relative 'progran3/constants'
  require_relative 'progran3/logger'
  require_relative 'progran3/error_handler'
  require_relative 'progran3/validation'
  require_relative 'progran3/dimensions_manager'
  require_relative 'progran3/coordination_manager'
  require_relative 'progran3/callback_manager'
  require_relative 'progran3/config'
  
  # Підключаємо основні модулі
  require_relative 'progran3/loader'
  require_relative 'progran3/builders/foundation_builder'
  require_relative 'progran3/builders/tiling_builder'
  require_relative 'progran3/builders/cladding_builder'
  require_relative 'progran3/builders/blind_area_builder'
  require_relative 'progran3/ui'
  require_relative 'progran3/skp_preview_extractor'
  
  # Підключаємо систему завантаження
  require_relative 'progran3/splash_screen'
  require_relative 'progran3/license_ui'
  require_relative 'progran3/demo_ui'
  require_relative 'progran3/activity_tracker'
  
  # Підключаємо систему підсумку
  require_relative 'progran3/summary_cache'
  require_relative 'progran3/summary_validator'
  
  # Методи для керування activity tracking
  def self.start_tracking
    ActivityTracker.start_tracking
  end
  
  def self.stop_tracking
    ActivityTracker.stop_tracking
  end
  
  def self.session_info
    ActivityTracker.session_info
  end

  # Метод для створення панелі інструментів
  def self.create_toolbar
    ErrorHandler.safe_execute("Toolbar", "Створення панелі інструментів") do
      # Створюємо панель інструментів
      toolbar = ::UI::Toolbar.new("ProGran3")
      
      # Команда для запуску плагіна
      cmd = ::UI::Command.new("ProGran3 Конструктор") {
        ErrorHandler.safe_execute("UI", "Запуск діалогу") do
          # Показуємо splash screen з перевіркою ліцензії
          ProGran3::SplashScreen.show
        end
      }
      
      # Встановлюємо іконки
      icon_path = File.join(Constants::ICONS_PATH, "icon_24.png")
      ErrorHandler.validate_file_exists(icon_path, "Toolbar")
      cmd.small_icon = icon_path
      cmd.large_icon = icon_path
      
      cmd.tooltip = "ProGran3 Конструктор - Створення конструкцій"
      
      # Додаємо команду до панелі
      toolbar.add_item(cmd)
      
      # Показуємо панель
      toolbar.show
      
      Logger.success("Панель інструментів ProGran3 створена", "Toolbar")
    end
  end

  # Додаємо пункт у меню Plugins
  unless file_loaded?(__FILE__)
    # Меню Plugins
    ::UI.menu("Plugins").add_item("proGran3 Конструктор") {
      ErrorHandler.safe_execute("Menu", "Запуск з меню") do
        # Показуємо splash screen з перевіркою ліцензії
        ProGran3::SplashScreen.show
      end
    }
    
    # Створюємо панель інструментів
    create_toolbar
    file_loaded(__FILE__)
    
    Logger.info("Плагін ProGran3 завантажено", "Main")
  end

  # Метод для перезавантаження плагіна
  def self.reload
    Logger.start("Перезавантаження плагіна ProGran3", "Main")
    
    # Очищаємо завантажені файли
    $LOADED_FEATURES.delete_if { |file| file.include?('progran3') }
    
          # Перезавантажуємо тільки наші файли
      plugin_dir = File.dirname(__FILE__)
      our_files = [
        File.join(plugin_dir, 'proGran3.rb'),
        File.join(plugin_dir, 'proGran3', 'constants.rb'),
        File.join(plugin_dir, 'proGran3', 'logger.rb'),
        File.join(plugin_dir, 'proGran3', 'error_handler.rb'),
        File.join(plugin_dir, 'proGran3', 'validation.rb'),
        File.join(plugin_dir, 'proGran3', 'dimensions_manager.rb'),
        File.join(plugin_dir, 'proGran3', 'coordination_manager.rb'),
        File.join(plugin_dir, 'proGran3', 'callback_manager.rb'),
        File.join(plugin_dir, 'proGran3', 'loader.rb'),
        File.join(plugin_dir, 'proGran3', 'ui.rb'),
        File.join(plugin_dir, 'proGran3', 'builders', 'foundation_builder.rb'),
        File.join(plugin_dir, 'proGran3', 'builders', 'tiling_builder.rb'),
        File.join(plugin_dir, 'proGran3', 'builders', 'cladding_builder.rb'),
        File.join(plugin_dir, 'proGran3', 'builders', 'blind_area_builder.rb'),
        File.join(plugin_dir, 'proGran3', 'skp_preview_extractor.rb'),
        File.join(plugin_dir, 'proGran3', 'carousel', 'carousel_manager.rb'),
        File.join(plugin_dir, 'proGran3', 'carousel', 'carousel_ui.rb')
      ]
    
    our_files.each do |file|
      if File.exist?(file)
        ErrorHandler.safe_execute("Reload", "Завантаження #{File.basename(file)}") do
          load file
          Logger.success(File.basename(file), "Reload")
        end
      else
        Logger.warn("Файл не знайдено: #{File.basename(file)}", "Reload")
      end
    end
    
    Logger.finish("Перезавантаження плагіна ProGran3", "Main")
  end
  

  # Універсальний метод для витягування превью з .skp файлів
  def self.extract_skp_preview(component_path, size = 256)
    SkpPreviewExtractor.extract_preview(component_path, size)
  end
  
  # Метод для отримання base64 даних превью
  def self.get_preview_base64(component_path, size = 256)
    SkpPreviewExtractor.get_preview_base64(component_path, size)
  end

  # Метод для координації елементів
  def self.coordinate_elements
    CoordinationManager.update_all_elements
  end



# Ініціалізація відстеження
if defined?(Sketchup)
  # Створюємо глобальний трекер з конфігурацією
  $progran3_tracker = ProGran3Tracker.new
  
  # Трекер ініціалізовано, але відстеження запускається тільки при відкритті UI
  puts "📊 Трекер ініціалізовано (відстеження запуститься при відкритті UI)"
  
  # Зупиняємо при закритті SketchUp
  at_exit do
    begin
      $progran3_tracker.stop_tracking if $progran3_tracker
    rescue => e
      puts "⚠️ Помилка при зупинці відстеження: #{e.message}"
    end
  end
  
  # Методи для управління трекером (завжди доступні)
  def self.start_tracking
    $progran3_tracker&.start_tracking
  end
  
  def self.stop_tracking
    $progran3_tracker&.stop_tracking
  end
  
  def self.send_heartbeat
    $progran3_tracker&.send_heartbeat
  end
  
  # Метод для перевірки статусу блокування (локальна перевірка)
  def self.check_blocking_status
    # Плагін завжди активний (локальне логування)
    return {
      success: true,
      blocked: false,
      active: true,
      has_license: false
    }
  end
  
  # Методи для роботи з ліцензіями (видалено - серверна частина)
  
  # Функція активації ліцензії (видалено - серверна частина)
  
  # Функція перевірки статусу блокування (видалено - серверна частина)
  
  
  def self.tracking_status
    if $progran3_tracker
      is_running = $progran3_tracker.instance_variable_get(:@is_running)
      plugin_id = $progran3_tracker.instance_variable_get(:@plugin_id)
      thread_alive = $progran3_tracker.instance_variable_get(:@heartbeat_thread)&.alive?
      
      puts "📊 Статус відстеження:"
      puts "   🔄 Відстеження активне: #{is_running ? '✅ ТАК' : '❌ НІ'}"
      puts "   🆔 Plugin ID: #{plugin_id}"
      puts "   🧵 Фонова задача: #{thread_alive ? '✅ ПРАЦЮЄ' : '❌ НЕ ПРАЦЮЄ'}"
      
      {
        running: is_running,
        plugin_id: plugin_id,
        thread_alive: thread_alive,
        # base_url видалено (локальне логування)
        retry_count: $progran3_tracker.instance_variable_get(:@retry_count),
        max_retries: $progran3_tracker.instance_variable_get(:@max_retries),
        retry_delay: $progran3_tracker.instance_variable_get(:@retry_delay)
      }
    else
      { error: "Трекер не ініціалізований" }
    end
  end
  
  def self.create_new_tracker
    # Зупиняємо старий трекер
    $progran3_tracker&.stop_tracking
    
    # Створюємо новий трекер (локальне логування)
    $progran3_tracker = ProGran3Tracker.new
    
    # Запускаємо відстеження
    $progran3_tracker.start_tracking
    
    puts "✅ Новий трекер створено та запущено"
  end
  
  # Функція для розблокування плагіна (видалено - серверна частина)
  
  # Методи для управління конфігурацією (локальні)
  def self.get_config
    Config.get_all_settings
  end
  
  def self.update_config(settings)
    Config.update_settings(settings)
  end
  

  # Менеджер ліцензій видалено (серверна частина)
  # Плагін працює локально без обмежень
  $plugin_blocked = false
  
  # НЕ запускаємо відстеження автоматично - тільки після відкриття UI
  puts "🔄 Завантаження всіх модулів завершено"
end

end