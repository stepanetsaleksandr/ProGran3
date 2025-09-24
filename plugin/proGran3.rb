# progran3.rb
require 'sketchup.rb'
require 'net/http'
require 'json'
require 'socket'
require 'timeout'

# Глобальна змінна для статусу блокування плагіна
$plugin_blocked = false

# Клас для відстеження активності плагіна
class ProGran3Tracker
  def initialize(base_url = nil)
    # ⚠️ ВАЖЛИВО: Після кожного деплою сервера оновити URL нижче!
    # Команда для перевірки: vercel ls
    @base_url = base_url || ENV['PROGRAN3_TRACKING_URL'] || 'https://progran3-tracking-server-7nm5dyi3b-provis3ds-projects.vercel.app'
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
    "progran3-#{hostname}-#{username}".downcase
  end

  public

  def start_tracking
    if @is_running
      puts "📊 Відстеження вже запущено, пропускаємо повторний запуск"
      return
    end
    
    @is_running = true
    puts "🚀 Запуск відстеження ProGran3..."
    
    # Відправляємо перший heartbeat
    puts "🚀 [#{Time.now.strftime('%H:%M:%S')}] Відправка першого heartbeat..."
    send_heartbeat
    
    # Запускаємо фонову задачу для регулярних heartbeat
    @heartbeat_thread = Thread.new do
      puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] Фонова задача heartbeat запущена"
      puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] Thread ID: #{Thread.current.object_id}"
      puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] Thread alive: #{Thread.current.alive?}"
      
      loop_count = 0
      loop do
        loop_count += 1
        puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] Цикл #{loop_count}: @is_running = #{@is_running}"
        
        break unless @is_running
        
        puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] Засинаємо на 60 секунд..."
        sleep(60) # 60 секунд = 1 хвилина
        
        puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] Прокинулися після 60 секунд"
        puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] Перевіряємо @is_running = #{@is_running}"
        
        if @is_running
          puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] ========== РЕГУЛЯРНИЙ HEARTBEAT =========="
          puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] Запуск регулярного heartbeat..."
          send_heartbeat
          puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] Регулярний heartbeat завершено"
        else
          puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] @is_running = false, виходимо з циклу"
        end
      end
      puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] Фонова задача heartbeat завершена"
    end
    
    # Додаємо невелику затримку та перевірку
    sleep(1)
    puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] Перевірка після запуску потоку:"
    puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] Thread alive: #{@heartbeat_thread.alive?}"
    puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] Thread status: #{@heartbeat_thread.status}"
    
    # Альтернативний підхід - використовуємо SketchUp timer якщо потрібно
    if defined?(UI) && UI.respond_to?(:start_timer)
      puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] Запуск альтернативного таймера SketchUp..."
      @sketchup_timer = UI.start_timer(60, true) do
        if @is_running
          puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] ========== TIMER HEARTBEAT =========="
          puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] Запуск heartbeat через SketchUp timer..."
          send_heartbeat
        else
          puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] @is_running = false, зупиняємо timer"
          UI.stop_timer(@sketchup_timer) if @sketchup_timer
        end
      end
      puts "🔄 [#{Time.now.strftime('%H:%M:%S')}] SketchUp timer запущено: #{@sketchup_timer}"
    end
    
    puts "✅ Відстеження активне. Plugin ID: #{@plugin_id}"
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

  def send_heartbeat
    timestamp = Time.now.strftime('%H:%M:%S')
    puts "📡 [#{timestamp}] ========== HEARTBEAT ВІДПРАВКА =========="
    puts "📡 [#{timestamp}] Plugin ID: #{@plugin_id}"
    puts "📡 [#{timestamp}] Сервер: #{@base_url}"
    puts "📡 [#{timestamp}] ==========================================="
    send_heartbeat_with_retry
  end

  def send_shutdown_signal
    begin
      uri = URI.parse("#{@base_url}/api/heartbeat")
      
      data = {
        plugin_id: @plugin_id,
        plugin_name: "ProGran3",
        version: get_plugin_version,
        user_id: get_user_identifier,
        computer_name: Socket.gethostname,
        system_info: get_system_info,
        timestamp: Time.now.iso8601,
        action: "plugin_shutdown",  # Сигнал про закриття
        source: "sketchup_plugin",
        update_existing: true,
        force_update: false
      }
      
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true if uri.scheme == 'https'
      http.read_timeout = 5
      http.open_timeout = 5
      
      request = Net::HTTP::Post.new(uri)
      request['Content-Type'] = 'application/json'
      request['User-Agent'] = "ProGran3-Plugin/#{get_plugin_version}"
      request.body = data.to_json
      
      timestamp = Time.now.strftime('%H:%M:%S')
      puts "📤 [#{timestamp}] ========== СИГНАЛ ЗАКРИТТЯ =========="
      puts "📤 [#{timestamp}] Відправка сигналу закриття до: #{@base_url}/api/heartbeat"
      puts "📊 [#{timestamp}] Plugin ID: #{data[:plugin_id]}"
      puts "📋 [#{timestamp}] Action: #{data[:action]}"
      puts "📤 [#{timestamp}] ========================================"
      
      response = http.request(request)
      
      if response.code == '200'
        puts "✅ [#{timestamp}] ✅ СИГНАЛ ЗАКРИТТЯ УСПІШНО ВІДПРАВЛЕНО!"
        puts "✅ [#{timestamp}] ========== ПЛАГІН ЗАКРИТО =========="
      else
        puts "⚠️ [#{timestamp}] Помилка відправки сигналу закриття: #{response.code}"
      end
      
    rescue => e
      puts "⚠️ [#{Time.now.strftime('%H:%M:%S')}] Помилка при відправці сигналу закриття: #{e.message}"
    end
  end

  private

  def send_heartbeat_with_retry
    begin
      timestamp = Time.now.strftime('%H:%M:%S')
      puts "📡 [#{timestamp}] Підготовка HTTP запиту..."
      
      uri = URI("#{@base_url}/api/heartbeat")
      
      # Валідація URL
      unless uri.scheme == 'https' || uri.scheme == 'http'
        raise "Невірний URL: #{@base_url}"
      end
      
      data = {
        plugin_id: @plugin_id,
        plugin_name: "ProGran3",
        version: get_plugin_version,
        user_id: get_user_identifier,
        computer_name: Socket.gethostname,
        system_info: get_system_info,
        timestamp: Time.now.iso8601,
        action: "heartbeat_update",  # Додаємо тип дії
        source: "sketchup_plugin",   # Додаємо джерело
        update_existing: true,       # Явно вказуємо, що потрібно оновити існуючий
        force_update: false          # Не примусово створювати новий
      }
      
      puts "📡 Дані heartbeat: #{data.inspect}"
      
      # Валідація даних
      validate_heartbeat_data(data)
      
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true if uri.scheme == 'https'
      http.read_timeout = 10
      http.open_timeout = 10
      
      request = Net::HTTP::Post.new(uri)
      request['Content-Type'] = 'application/json'
      request['User-Agent'] = "ProGran3-Plugin/#{get_plugin_version}"
      request.body = data.to_json
      
        puts "📡 [#{timestamp}] Відправка heartbeat до: #{@base_url}/api/heartbeat"
        puts "📊 [#{timestamp}] Plugin ID: #{data[:plugin_id]}"
        puts "📋 [#{timestamp}] Action: #{data[:action]}"
        puts "📋 [#{timestamp}] Update existing: #{data[:update_existing]}"
        puts "📋 [#{timestamp}] Timestamp: #{data[:timestamp]}"
      
      response = http.request(request)
      
      puts "📨 [#{timestamp}] Відповідь сервера: #{response.code} #{response.message}"
      puts "📄 [#{timestamp}] Тіло відповіді: #{response.body}"
      
      if response.code == '200'
        # Для тестового сервера (httpbin.org) завжди успіх
        if @base_url.include?('httpbin.org')
          puts "💓 [#{timestamp}] ✅ HEARTBEAT УСПІШНО ВІДПРАВЛЕНО!"
          puts "💓 [#{timestamp}] ========== HEARTBEAT ЗАВЕРШЕНО УСПІШНО =========="
          @retry_count = 0 # Скидаємо лічильник при успіху
        elsif @base_url.include?('vercel.app')
          # Для Vercel сервера - перевіряємо відповідь
          begin
            result = JSON.parse(response.body)
            if result['success'] && result['plugin']
              puts "💓 [#{timestamp}] ✅ HEARTBEAT УСПІШНО ВІДПРАВЛЕНО!"
              puts "📋 [#{timestamp}] Сервер ID: #{result['plugin']['id']}"
              puts "📋 [#{timestamp}] Plugin ID: #{result['plugin']['plugin_id']}"
              puts "📋 [#{timestamp}] Last heartbeat: #{result['plugin']['last_heartbeat']}"
              puts "📋 [#{timestamp}] Is active: #{result['plugin']['is_active']}"
              puts "📋 [#{timestamp}] Is blocked: #{result['plugin']['is_blocked']}"
              
              # Перевіряємо статус блокування
              is_blocked = result['plugin']['is_blocked']
              if is_blocked
                puts "🚫 [#{timestamp}] ⚠️ ПЛАГІН ЗАБЛОКОВАНО СЕРВЕРОМ!"
                @plugin_blocked = true
                $plugin_blocked = true
                
                # Автоматично показуємо карточку блокування в UI
                show_blocking_card_in_ui
              else
                puts "✅ [#{timestamp}] Плагін активний (не заблоковано)"
                @plugin_blocked = false
                $plugin_blocked = false
                
                # Приховуємо карточку блокування якщо плагін розблокований
                hide_blocking_card_in_ui
              end
              
              puts "💓 [#{timestamp}] ========== HEARTBEAT ЗАВЕРШЕНО УСПІШНО =========="
              
              # Перевіряємо, чи plugin_id співпадає
              if result['plugin']['plugin_id'] != @plugin_id
                puts "⚠️ УВАГА: Plugin ID не співпадає!"
                puts "   Відправлено: #{@plugin_id}"
                puts "   Отримано: #{result['plugin']['plugin_id']}"
              end
              
              @retry_count = 0
            else
              puts "⚠️ Сервер не повернув очікувану відповідь"
              @retry_count = 0 # Все одно вважаємо успіхом при 200
            end
          rescue => e
            puts "⚠️ Помилка парсингу відповіді: #{e.message}"
            @retry_count = 0
          end
        else
          # Для інших серверів перевіряємо JSON відповідь
          result = JSON.parse(response.body)
          if result['success'] || result['status'] == 'ok'
            puts "💓 [#{timestamp}] ✅ HEARTBEAT УСПІШНО ВІДПРАВЛЕНО!"
            puts "💓 [#{timestamp}] ========== HEARTBEAT ЗАВЕРШЕНО УСПІШНО =========="
            @retry_count = 0 # Скидаємо лічильник при успіху
          else
            puts "❌ [#{timestamp}] Сервер повернув помилку: #{result['error'] || result['message']}"
            raise "Сервер повернув помилку: #{result['error'] || result['message']}"
          end
        end
      else
        puts "❌ [#{timestamp}] HTTP помилка: #{response.code} - #{response.message}"
        raise "HTTP помилка: #{response.code} - #{response.message}"
      end
      
    rescue Timeout::Error
      puts "⏰ [#{Time.now.strftime('%H:%M:%S')}] ❌ ТАЙМАУТ при відправці heartbeat"
      handle_heartbeat_error("Таймаут при відправці heartbeat")
    rescue => e
      puts "💥 [#{Time.now.strftime('%H:%M:%S')}] ❌ ПОМИЛКА відправки heartbeat: #{e.message}"
      handle_heartbeat_error("Помилка відправки heartbeat: #{e.message}")
    end
  end
  
  public
  
  # Метод для перевірки статусу на сервері (публічний)
  def check_server_status
    begin
      uri = URI("#{@base_url}/api/plugins")
      
      # Валідація URL
      unless uri.scheme == 'https' || uri.scheme == 'http'
        raise "Невірний URL: #{@base_url}"
      end
      
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = (uri.scheme == 'https')
      http.read_timeout = 30
      http.open_timeout = 10
      
      request = Net::HTTP::Get.new(uri)
      request['User-Agent'] = "ProGran3-Plugin/#{get_plugin_version}"
      
      puts "📡 Запит статусу з сервера: #{@base_url}/api/plugins"
      
      response = http.request(request)
      
      puts "📨 Відповідь сервера: #{response.code} #{response.message}"
      
      if response.code == '200'
        begin
          result = JSON.parse(response.body)
          puts "📄 Дані з сервера:"
          puts JSON.pretty_generate(result)
          
          # Шукаємо наш плагін
          if result.is_a?(Array)
            our_plugin = result.find { |p| p['plugin_id'] == @plugin_id }
            if our_plugin
              puts "✅ Знайдено наш плагін на сервері:"
              puts "   ID: #{our_plugin['id']}"
              puts "   Plugin ID: #{our_plugin['plugin_id']}"
              puts "   Last heartbeat: #{our_plugin['last_heartbeat']}"
              puts "   Is active: #{our_plugin['is_active']}"
            else
              puts "❌ Наш плагін не знайдено на сервері"
              puts "   Шукаємо: #{@plugin_id}"
            end
          end
        rescue => e
          puts "⚠️ Помилка парсингу відповіді: #{e.message}"
        end
      else
        puts "❌ Не вдалося отримати статус: #{response.code}"
      end
      
    rescue => e
      puts "❌ Помилка при перевірці статусу: #{e.message}"
    end
  end
  
  

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


  def validate_heartbeat_data(data)
    required_fields = [:plugin_id, :plugin_name, :version, :user_id, :computer_name]
    required_fields.each do |field|
      if data[field].nil? || data[field].to_s.strip.empty?
        raise "Відсутнє обов'язкове поле: #{field}"
      end
    end
  end

  def send_heartbeat_direct
    begin
      timestamp = Time.now.strftime('%H:%M:%S')
      puts "📡 [#{timestamp}] Heartbeat для перевірки статусу блокування..."
      
      uri = URI("#{@base_url}/api/heartbeat")
      
      data = {
        plugin_id: @plugin_id,
        plugin_name: "ProGran3",
        version: get_plugin_version,
        user_id: get_user_identifier,
        computer_name: Socket.gethostname,
        system_info: get_system_info,
        timestamp: Time.now.iso8601,
        action: "heartbeat_update",
        source: "sketchup_plugin",
        update_existing: true,
        force_update: false
      }
      
      validate_heartbeat_data(data)
      
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = (uri.scheme == 'https')
      http.read_timeout = 30
      http.open_timeout = 10
      
      request = Net::HTTP::Post.new(uri)
      request['Content-Type'] = 'application/json'
      request['User-Agent'] = "ProGran3-Plugin/#{get_plugin_version}"
      request.body = data.to_json
      
      puts "📡 [#{timestamp}] Відправка heartbeat до: #{@base_url}/api/heartbeat"
      
      response = http.request(request)
      
      puts "📨 [#{timestamp}] Відповідь сервера: #{response.code} #{response.message}"
      puts "📄 [#{timestamp}] Тіло відповіді: #{response.body}"
      
      if response.code == '200'
        begin
          result = JSON.parse(response.body)
          if result['success'] && result['plugin']
            is_blocked = result['plugin']['is_blocked'] || false
            is_active = result['plugin']['is_active'] || false
            puts "📡 [#{timestamp}] Статус блокування: #{is_blocked ? 'ЗАБЛОКОВАНО' : 'АКТИВНИЙ'}"
            puts "📡 [#{timestamp}] Статус активності: #{is_active ? 'АКТИВНИЙ' : 'НЕАКТИВНИЙ'}"
            
            # Оновлюємо локальні змінні
            @plugin_blocked = is_blocked
            $plugin_blocked = is_blocked
            
            # Автоматично показуємо/приховуємо карточку блокування
            if is_blocked
              show_blocking_card_in_ui
            else
              hide_blocking_card_in_ui
            end
            
            return {
              success: true,
              blocked: is_blocked,
              plugin_id: @plugin_id
            }
          else
            return {
              success: false,
              error: "Неочікувана відповідь від сервера",
              blocked: false
            }
          end
        rescue JSON::ParserError => e
          return {
            success: false,
            error: "Помилка парсингу JSON: #{e.message}",
            blocked: false
          }
        end
      else
        return {
          success: false,
          error: "HTTP помилка: #{response.code} - #{response.message}",
          blocked: false
        }
      end
    rescue => e
      puts "❌ [#{timestamp}] Помилка тестового heartbeat: #{e.message}"
      return {
        success: false,
        error: e.message,
        blocked: false
      }
    end
  end

  # Показати карточку блокування в UI
  def show_blocking_card_in_ui
    begin
      # Перевіряємо чи UI відкрито
      if defined?(ProGran3::UI) && ProGran3::UI.instance_variable_get(:@dialog) && ProGran3::UI.instance_variable_get(:@dialog).visible?
        puts "📱 Показуємо карточку блокування в UI..."
        ProGran3::UI.instance_variable_get(:@dialog).execute_script("showBlockingCard();")
        puts "✅ Карточка блокування показана"
      else
        puts "📱 UI не відкрито - карточка блокування буде показана при відкритті"
      end
    rescue => e
      puts "❌ Помилка показу карточки блокування: #{e.message}"
    end
  end

  # Приховати карточку блокування в UI
  def hide_blocking_card_in_ui
    begin
      # Перевіряємо чи UI відкрито
      if defined?(ProGran3::UI) && ProGran3::UI.instance_variable_get(:@dialog) && ProGran3::UI.instance_variable_get(:@dialog).visible?
        puts "📱 Приховуємо карточку блокування в UI..."
        ProGran3::UI.instance_variable_get(:@dialog).execute_script("hideBlockingCard();")
        puts "✅ Карточка блокування прихована"
      end
    rescue => e
      puts "❌ Помилка приховування карточки блокування: #{e.message}"
    end
  end

  def handle_heartbeat_error(message)
    @retry_count += 1
    timestamp = Time.now.strftime('%H:%M:%S')
    puts "❌ [#{timestamp}] #{message}"
    
    if @retry_count < @max_retries
      puts "🔄 [#{timestamp}] Повторна спроба #{@retry_count}/#{@max_retries} через #{@retry_delay} секунд..."
      sleep(@retry_delay)
      send_heartbeat_with_retry
    else
      puts "❌ [#{timestamp}] ❌❌❌ КРИТИЧНА ПОМИЛКА ❌❌❌"
      puts "❌ [#{timestamp}] Не вдалося відправити heartbeat після #{@max_retries} спроб"
      puts "❌ [#{timestamp}] Плагін продовжує працювати, але відстеження неактивне"
      @retry_count = 0 # Скидаємо лічильник
    end
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
  
  # Підключаємо основні модулі
  require_relative 'progran3/loader'
  require_relative 'progran3/builders/foundation_builder'
  require_relative 'progran3/builders/tiling_builder'
  require_relative 'progran3/builders/cladding_builder'
  require_relative 'progran3/builders/blind_area_builder'
  require_relative 'progran3/ui'
  require_relative 'progran3/skp_preview_extractor'

  # Метод для створення панелі інструментів
  def self.create_toolbar
    ErrorHandler.safe_execute("Toolbar", "Створення панелі інструментів") do
      # Створюємо панель інструментів
      toolbar = ::UI::Toolbar.new("ProGran3")
      
      # Команда для запуску плагіна
      cmd = ::UI::Command.new("ProGran3 Конструктор") {
        ErrorHandler.safe_execute("UI", "Запуск діалогу") do
          ProGran3::UI.show_dialog
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
        ProGran3::UI.show_dialog
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
  
  # Метод для перевірки статусу блокування з сервера
  def self.check_blocking_status
    begin
      if $progran3_tracker
        result = $progran3_tracker.send_heartbeat_direct
        
        if result && result[:success]
          return {
            success: true,
            blocked: result[:blocked] || false,
            active: !result[:blocked] # Активний якщо не заблокований
          }
        else
          return {
            success: false,
            blocked: false,
            active: false,
            error: result ? result[:error] : "No response from server"
          }
        end
      else
        return {
          success: false,
          blocked: false,
          active: false,
          error: "Tracker not initialized"
        }
      end
    rescue => e
      return {
        success: false,
        blocked: false,
        active: false,
        error: e.message
      }
    end
  end
  
  
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
        base_url: $progran3_tracker.instance_variable_get(:@base_url),
        retry_count: $progran3_tracker.instance_variable_get(:@retry_count),
        max_retries: $progran3_tracker.instance_variable_get(:@max_retries),
        retry_delay: $progran3_tracker.instance_variable_get(:@retry_delay)
      }
    else
      { error: "Трекер не ініціалізований" }
    end
  end
  
  def self.create_new_tracker(server_url = nil)
    # Зупиняємо старий трекер
    $progran3_tracker&.stop_tracking
    
    # Створюємо новий трекер з правильним URL
    $progran3_tracker = ProGran3Tracker.new(server_url)
    
    # Запускаємо відстеження
    $progran3_tracker.start_tracking
    
    puts "✅ Новий трекер створено та запущено"
  end
  

  # НЕ запускаємо відстеження автоматично - тільки після відкриття UI
  puts "🔄 Завантаження всіх модулів завершено"
end
end