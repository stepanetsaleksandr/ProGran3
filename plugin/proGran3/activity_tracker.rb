# plugin/proGran3/activity_tracker.rb
# Професійна система відстеження активності плагіна

module ProGran3
  module ActivityTracker
    extend self
    
    # Інтервал heartbeat (10 хвилин)
    HEARTBEAT_INTERVAL = 600 # секунд
    
    # Версія плагіна
    PLUGIN_VERSION = '1.0.0'
    
    # Статус відстеження
    @tracking_enabled = false
    @heartbeat_timer = nil
    @session_start = nil
    @last_heartbeat = nil
    
    # Запускає відстеження активності
    def start_tracking
      return if @tracking_enabled
      
      puts "📊 Запуск Activity Tracker..."
      
      # Перевірка чи є ліцензія
      license = get_license_info
      unless license && license[:has_license]
        puts "   ⚠️ Ліцензія не знайдена - tracking вимкнено"
        return
      end
      
      @tracking_enabled = true
      @session_start = Time.now
      
      # Відправка startup event
      send_startup_event(license)
      
      # Запуск періодичного heartbeat
      start_heartbeat_timer(license)
      
      puts "   ✅ Activity Tracker запущено"
      puts "   📍 Session start: #{@session_start}"
      puts "   ⏱️ Heartbeat interval: #{HEARTBEAT_INTERVAL}s (#{HEARTBEAT_INTERVAL / 60} хв)"
      
    rescue => e
      puts "   ❌ Помилка запуску Activity Tracker: #{e.message}"
      @tracking_enabled = false
    end
    
    # Зупиняє відстеження
    def stop_tracking
      return unless @tracking_enabled
      
      puts "📊 Зупинка Activity Tracker..."
      
      # Зупинка heartbeat timer
      if @heartbeat_timer
        UI.stop_timer(@heartbeat_timer)
        @heartbeat_timer = nil
      end
      
      # Відправка shutdown event (опціонально)
      license = get_license_info
      send_shutdown_event(license) if license && license[:has_license]
      
      @tracking_enabled = false
      puts "   ✅ Activity Tracker зупинено"
    end
    
    # Відправка startup event
    def send_startup_event(license)
      puts "   📤 Відправка startup event..."
      
      begin
        require_relative 'system/network/network_client'
        require_relative 'system/utils/device_identifier'
        
        fingerprint = ProGran3::System::Utils::DeviceIdentifier.generate[:fingerprint]
        
        # Відправляємо startup event через heartbeat з додатковими даними
        result = ProGran3::System::Network::NetworkClient.post_request('/api/heartbeats', {
          license_key: license[:license_key],
          system_fingerprint: fingerprint,
          event_type: 'startup',
          plugin_version: PLUGIN_VERSION,
          session_start: @session_start.iso8601,
          sketchup_version: Sketchup.version,
          platform: Sketchup.platform,
          timestamp: Time.now.to_i
        }, silent: true)
        
        if result[:success]
          puts "   ✅ Startup event відправлено"
        else
          puts "   ⚠️ Startup event не відправлено: #{result[:error]}"
        end
        
      rescue => e
        puts "   ⚠️ Помилка відправки startup event: #{e.message}"
        # Не критична помилка - продовжуємо роботу
      end
    end
    
    # Відправка shutdown event
    def send_shutdown_event(license)
      begin
        require_relative 'system/network/network_client'
        require_relative 'system/utils/device_identifier'
        
        fingerprint = ProGran3::System::Utils::DeviceIdentifier.generate[:fingerprint]
        session_duration = Time.now - @session_start
        
        ProGran3::System::Network::NetworkClient.post_request('/api/heartbeats', {
          license_key: license[:license_key],
          system_fingerprint: fingerprint,
          event_type: 'shutdown',
          plugin_version: PLUGIN_VERSION,
          session_duration: session_duration.to_i,
          timestamp: Time.now.to_i
        }, silent: true)
        
      rescue => e
        # Ігноруємо помилки при shutdown
      end
    end
    
    # Запуск періодичного heartbeat
    def start_heartbeat_timer(license)
      # Перевірка чи таймер вже запущений
      if @heartbeat_timer
        UI.stop_timer(@heartbeat_timer)
      end
      
      # Створюємо таймер який виконується кожні HEARTBEAT_INTERVAL секунд
      @heartbeat_timer = UI.start_timer(HEARTBEAT_INTERVAL, true) do
        send_heartbeat(license) if @tracking_enabled
      end
      
      puts "   ⏱️ Heartbeat timer запущено"
    end
    
    # Відправка heartbeat
    def send_heartbeat(license)
      return unless @tracking_enabled
      
      begin
        require_relative 'system/network/network_client'
        require_relative 'system/utils/device_identifier'
        
        fingerprint = ProGran3::System::Utils::DeviceIdentifier.generate[:fingerprint]
        session_duration = Time.now - @session_start
        
        # Відправляємо heartbeat
        result = ProGran3::System::Network::NetworkClient.post_request('/api/heartbeats', {
          license_key: license[:license_key],
          system_fingerprint: fingerprint,
          event_type: 'heartbeat',
          plugin_version: PLUGIN_VERSION,
          session_duration: session_duration.to_i,
          session_start: @session_start.iso8601,
          sketchup_version: Sketchup.version,
          platform: Sketchup.platform,
          timestamp: Time.now.to_i
        }, silent: true)
        
        if result[:success]
          @last_heartbeat = Time.now
          puts "💓 Heartbeat відправлено (session: #{format_duration(session_duration)})"
        else
          puts "⚠️ Heartbeat не відправлено: #{result[:error]}" unless result[:offline]
        end
        
      rescue => e
        puts "⚠️ Помилка heartbeat: #{e.message}"
        # Не критична помилка - продовжуємо роботу
      end
    end
    
    # Примусова відправка heartbeat (для тестування)
    def force_heartbeat
      license = get_license_info
      if license && license[:has_license]
        send_heartbeat(license)
      else
        puts "❌ Неможливо відправити heartbeat - ліцензія не знайдена"
      end
    end
    
    # Отримання інформації про ліцензію
    def get_license_info
      require_relative 'system/core/session_manager'
      manager = ProGran3::System::Core::SessionManager.new
      manager.license_info
    rescue => e
      puts "⚠️ Помилка отримання license info: #{e.message}"
      nil
    end
    
    # Форматування тривалості
    def format_duration(seconds)
      hours = (seconds / 3600).to_i
      minutes = ((seconds % 3600) / 60).to_i
      
      if hours > 0
        "#{hours}год #{minutes}хв"
      else
        "#{minutes}хв"
      end
    end
    
    # Статус tracking
    def tracking_enabled?
      @tracking_enabled
    end
    
    # Інформація про поточну сесію
    def session_info
      return nil unless @tracking_enabled
      
      {
        enabled: true,
        session_start: @session_start,
        session_duration: Time.now - @session_start,
        last_heartbeat: @last_heartbeat,
        heartbeat_interval: HEARTBEAT_INTERVAL,
        plugin_version: PLUGIN_VERSION
      }
    end
    
  end
end

# Автоматичний запуск при завантаженні модуля (якщо плагін вже ініціалізовано)
if defined?(Sketchup) && Sketchup.active_model
  # Запускаємо через невелику затримку щоб дати час іншим модулям завантажитись
  UI.start_timer(5, false) do
    ProGran3::ActivityTracker.start_tracking
  end
end

