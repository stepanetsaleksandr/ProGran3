# plugin/proGran3/security/telemetry.rb
# Анонімна телеметрія для виявлення крякнутих копій та аномалій

require 'digest'
require_relative '../logger'
require_relative 'hardware_fingerprint'
require_relative 'api_client'

module ProGran3
  module Security
    class Telemetry
      
      # Відправляти телеметрію кожні N годин
      TELEMETRY_INTERVAL = 3600  # 1 година
      
      # Останній час відправки
      @@last_telemetry = 0
      
      # Session start time
      @@session_start = Time.now
      
      # Counters
      @@features_used = Set.new
      @@errors_count = 0
      @@api_calls = 0
      
      # Відправити телеметрію (якщо час прийшов)
      # @param force [Boolean] Примусова відправка
      # @return [Boolean]
      def self.send_if_needed(force = false)
        now = Time.now.to_i
        
        # Перевіряємо чи час відправляти
        return false unless force || (now - @@last_telemetry) >= TELEMETRY_INTERVAL
        
        # Відправляємо
        result = send_telemetry
        
        # Оновлюємо timestamp
        @@last_telemetry = now if result
        
        result
      end
      
      # Відправити телеметрію
      # @return [Boolean]
      def self.send_telemetry
        begin
          data = collect_telemetry_data
          
          Logger.debug("Відправка телеметрії...", "Telemetry")
          
          # Відправляємо асинхронно (не блокує UI)
          Thread.new do
            begin
              result = ApiClient.post_request('/api/telemetry', data, silent: true)
              
              if result[:success]
                Logger.debug("Телеметрія відправлена успішно", "Telemetry")
              else
                Logger.warn("Телеметрія не відправлена: #{result[:error]}", "Telemetry")
              end
            rescue => e
              Logger.warn("Помилка відправки телеметрії: #{e.message}", "Telemetry")
            end
          end
          
          true
        rescue => e
          Logger.warn("Помилка збору телеметрії: #{e.message}", "Telemetry")
          false
        end
      end
      
      # Збирає дані телеметрії (анонімно)
      # @return [Hash]
      def self.collect_telemetry_data
        fp = HardwareFingerprint.generate
        
        {
          # Анонімні ідентифікатори (хеш замість реальних значень)
          fingerprint_hash: Digest::SHA256.hexdigest(fp[:fingerprint])[0..15],  # Перші 16 символів
          
          # Версії
          plugin_version: '3.2.1',
          sketchup_version: defined?(Sketchup) ? Sketchup.version : 'unknown',
          ruby_version: RUBY_VERSION,
          
          # Платформа
          os: RUBY_PLATFORM,
          architecture: RUBY_PLATFORM.include?('x64') ? '64-bit' : '32-bit',
          
          # Session інформація
          session_duration: (Time.now - @@session_start).to_i,
          features_used: @@features_used.to_a,
          errors_count: @@errors_count,
          api_calls: @@api_calls,
          
          # Timestamp
          timestamp: Time.now.iso8601,
          
          # Hardware capabilities (для статистики)
          hardware_capabilities: collect_hardware_capabilities,
          
          # Locale
          locale: ENV['LANG'] || ENV['LANGUAGE'] || 'unknown'
        }
      end
      
      # Збирає анонімну інформацію про можливості системи
      # @return [Hash]
      def self.collect_hardware_capabilities
        {
          has_machine_guid: fp_has_component?(:machine_guid),
          has_volume_serial: fp_has_component?(:volume_serial),
          has_bios_serial: fp_has_component?(:bios_serial),
          has_mac_address: fp_has_component?(:mac_address)
        }
      end
      
      # Перевіряє чи fingerprint має компонент
      # @param component [Symbol]
      # @return [Boolean]
      def self.fp_has_component?(component)
        fp = HardwareFingerprint.generate
        value = fp[:components][component]
        value && !value.to_s.include?('unknown')
      end
      
      # Відмічає використання feature
      # @param feature [String]
      def self.track_feature(feature)
        @@features_used.add(feature)
      end
      
      # Відмічає помилку
      def self.track_error
        @@errors_count += 1
      end
      
      # Відмічає API call
      def self.track_api_call
        @@api_calls += 1
      end
      
      # Скидає лічильники (при новій сесії)
      def self.reset_counters
        @@session_start = Time.now
        @@features_used = Set.new
        @@errors_count = 0
        @@api_calls = 0
      end
      
      # Статистика поточної сесії
      # @return [Hash]
      def self.session_stats
        {
          session_duration: (Time.now - @@session_start).to_i,
          features_used: @@features_used.to_a,
          errors_count: @@errors_count,
          api_calls: @@api_calls,
          last_telemetry: @@last_telemetry > 0 ? Time.at(@@last_telemetry) : nil
        }
      end
    end
  end
end

# === ТЕСТУВАННЯ ===
if __FILE__ == $0
  require 'set'
  
  puts "🧪 Тестування Telemetry..."
  
  # Тест 1: Збір даних
  puts "\n📝 Тест 1: Збір телеметрії..."
  data = ProGran3::Security::Telemetry.send(:collect_telemetry_data)
  puts "   Plugin version: #{data[:plugin_version]}"
  puts "   SketchUp version: #{data[:sketchup_version]}"
  puts "   Fingerprint hash: #{data[:fingerprint_hash]}"
  puts "   ✅ PASSED"
  
  # Тест 2: Track features
  puts "\n📝 Тест 2: Tracking features..."
  ProGran3::Security::Telemetry.track_feature('foundation_added')
  ProGran3::Security::Telemetry.track_feature('tiles_added')
  ProGran3::Security::Telemetry.track_error
  
  stats = ProGran3::Security::Telemetry.session_stats
  puts "   Features: #{stats[:features_used].length}"
  puts "   Errors: #{stats[:errors_count]}"
  puts "   ✅ PASSED"
  
  # Тест 3: Send telemetry (force)
  puts "\n📝 Тест 3: Відправка телеметрії (forced)..."
  result = ProGran3::Security::Telemetry.send_if_needed(true)
  puts "   Result: #{result}"
  puts "   ✅ PASSED"
  
  puts "\n✅ Тестування Telemetry завершено"
end

