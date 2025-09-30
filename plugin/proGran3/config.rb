# progran3/config.rb
# Система конфігурації ProGran3

module ProGran3
  module Config
    # Шлях до конфігураційного файлу
    CONFIG_FILE_PATH = File.join(Constants::PLUGIN_ROOT, 'config.json')
    
    # Завантаження конфігурації
    def self.load_config
      config = {}
      
      # Завантажуємо з JSON файлу якщо існує
      if File.exist?(CONFIG_FILE_PATH)
        begin
          config = JSON.parse(File.read(CONFIG_FILE_PATH))
          Logger.info("Конфігурацію завантажено з #{CONFIG_FILE_PATH}", "Config")
        rescue => e
          Logger.error("Помилка завантаження конфігурації: #{e.message}", "Config")
          config = {}
        end
      end
      
      # Додаємо дефолтні значення
      default_config = get_default_config
      config = default_config.merge(config)
      
      config
    end
    
    # Збереження конфігурації
    def self.save_config(config)
      begin
        File.write(CONFIG_FILE_PATH, JSON.pretty_generate(config))
        Logger.info("Конфігурацію збережено в #{CONFIG_FILE_PATH}", "Config")
        true
      rescue => e
        Logger.error("Помилка збереження конфігурації: #{e.message}", "Config")
        false
      end
    end
    
    # Отримання URL сервера відстеження
    def self.get_tracking_server_url
      # 1. Перевіряємо змінну середовища
      env_url = ENV[Constants::TRACKING_SERVER_URL_ENV_VAR]
      if env_url && !env_url.strip.empty?
        Logger.info("Використовуємо URL з змінної середовища: #{env_url}", "Config")
        return env_url
      end
      
      # 2. Завантажуємо конфігурацію
      config = load_config
      config_url = config['tracking_server_url']
      if config_url && !config_url.strip.empty?
        Logger.info("Використовуємо URL з конфігурації: #{config_url}", "Config")
        return config_url
      end
      
      # 3. Використовуємо дефолтний URL
      Logger.info("Використовуємо дефолтний URL: #{Constants::DEFAULT_TRACKING_SERVER_URL}", "Config")
      Constants::DEFAULT_TRACKING_SERVER_URL
    end
    
    # Встановлення URL сервера відстеження
    def self.set_tracking_server_url(url)
      config = load_config
      config['tracking_server_url'] = url
      
      if save_config(config)
        Logger.info("URL сервера відстеження оновлено: #{url}", "Config")
        true
      else
        Logger.error("Не вдалося оновити URL сервера відстеження", "Config")
        false
      end
    end
    
    # Перевірка доступності сервера
    def self.test_server_connection(url = nil)
      test_url = url || get_tracking_server_url
      
      begin
        require 'net/http'
        require 'uri'
        
        uri = URI(test_url)
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = (uri.scheme == 'https')
        http.read_timeout = 10
        http.open_timeout = 5
        
        request = Net::HTTP::Get.new(uri)
        request['User-Agent'] = "ProGran3-Plugin/#{Constants::VERSION}"
        
        response = http.request(request)
        
        if response.code == '200'
          Logger.info("Сервер доступний: #{test_url}", "Config")
          return { success: true, url: test_url, status: response.code }
        else
          Logger.warn("Сервер недоступний: #{test_url} (код: #{response.code})", "Config")
          return { success: false, url: test_url, status: response.code }
        end
        
      rescue => e
        Logger.error("Помилка підключення до сервера: #{e.message}", "Config")
        return { success: false, url: test_url, error: e.message }
      end
    end
    
    # Отримання всіх налаштувань
    def self.get_all_settings
      load_config
    end
    
    # Оновлення налаштувань
    def self.update_settings(new_settings)
      config = load_config
      config.merge!(new_settings)
      save_config(config)
    end
    
    private
    
    # Дефолтна конфігурація
    def self.get_default_config
      {
        'tracking_server_url' => Constants::DEFAULT_TRACKING_SERVER_URL,
        'fallback_server_url' => Constants::FALLBACK_SERVER_URL,
        'heartbeat_interval' => 3600, # 1 година в секундах
        'max_retries' => 3,
        'retry_delay' => 30, # секунди
        'offline_fallback_enabled' => true,
        'offline_fallback_duration' => 48, # секунди
        'debug_mode' => false,
        'auto_reload' => true,
        'backup_enabled' => true
      }
    end
  end
end
