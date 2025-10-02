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
    
    # Серверні методи видалено (локальне логування)
    
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
    
    # Дефолтна конфігурація (локальна)
    def self.get_default_config
      {
        'debug_mode' => false,
        'auto_reload' => true,
        'backup_enabled' => true
      }
    end
  end
end
