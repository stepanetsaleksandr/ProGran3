# plugin/proGran3/system/monitoring/analytics.rb
# Анонімна аналітика для виявлення крякнутих копій та аномалій

require 'digest'
require_relative '../../logger'
require_relative '../utils/device_identifier'
require_relative '../network/network_client'

module ProGran3
  module System
    module Monitoring
      class Analytics
        
        # Відправляти аналітику кожні N годин
        ANALYTICS_INTERVAL = 3600  # 1 година
        
        # Останній час відправки
        @@last_analytics = 0
        
        # Session start time
        @@session_start = Time.now
        
        # Counters
        @@features_used = Set.new
        @@errors_count = 0
        @@api_calls = 0
        
        # Відправити аналітику (якщо час прийшов)
        # @param force [Boolean] Примусова відправка
        # @return [Boolean]
        def self.send_if_needed(force = false)
          now = Time.now.to_i
          
          # Перевіряємо чи час відправляти
          return false unless force || (now - @@last_analytics) >= ANALYTICS_INTERVAL
          
          # Відправляємо
          result = send_analytics
          
          # Оновлюємо timestamp
          @@last_analytics = now if result
          
          result
        end
        
        # Відправити аналітику
        # @return [Boolean]
        def self.send_analytics
          begin
            data = collect_analytics_data
            
            # Відправляємо через NetworkClient
            result = NetworkClient.post_request('/api/telemetry', data, silent: true)
            
            if result[:success]
              puts "✅ Аналітика відправлена"
              true
            else
              puts "⚠️ Помилка відправки аналітики: #{result[:error]}"
              false
            end
            
          rescue => e
            puts "⚠️ Exception при відправці аналітики: #{e.message}"
            false
          end
        end
        
        # Збирає дані аналітики
        # @return [Hash]
        def self.collect_analytics_data
          fp_data = DeviceIdentifier.generate
          
          {
            plugin_version: '3.2.1',
            fingerprint: fp_data[:fingerprint],
            timestamp: Time.now.to_i,
            session_duration: Time.now - @@session_start,
            features_used: @@features_used.to_a,
            errors_count: @@errors_count,
            api_calls: @@api_calls,
            platform: RUBY_PLATFORM,
            ruby_version: RUBY_VERSION
          }
        end
        
        # Відстежити використання функції
        # @param feature [String] Назва функції
        def self.track_feature(feature)
          @@features_used.add(feature)
        end
        
        # Відстежити помилку
        def self.track_error
          @@errors_count += 1
        end
        
        # Відстежити API виклик
        def self.track_api_call
          @@api_calls += 1
        end
        
        # Статистика сесії
        # @return [Hash]
        def self.session_stats
          {
            session_duration: Time.now - @@session_start,
            features_used: @@features_used.to_a,
            errors_count: @@errors_count,
            api_calls: @@api_calls
          }
        end
        
        # Скинути статистику
        def self.reset_stats
          @@features_used.clear
          @@errors_count = 0
          @@api_calls = 0
          @@session_start = Time.now
        end
      end
    end
  end
end

# === BACKWARD COMPATIBILITY ALIASES ===
# Для зворотної сумісності з існуючим кодом
module ProGran3
  module Security
    # Alias для зворотної сумісності
    Telemetry = System::Monitoring::Analytics
  end
end

# === ТЕСТУВАННЯ ===
if __FILE__ == $0
  puts "🧪 Базове тестування Analytics..."
  
  # Тест 1: Збір аналітики
  puts "\n📝 Тест 1: Збір аналітики..."
  data = ProGran3::System::Monitoring::Analytics.send(:collect_analytics_data)
  puts "   Plugin version: #{data[:plugin_version]}"
  puts "   Fingerprint: #{data[:fingerprint][0..16]}..."
  puts "   Platform: #{data[:platform]}"
  
  # Тест 2: Tracking features
  puts "\n📝 Тест 2: Tracking features..."
  ProGran3::System::Monitoring::Analytics.track_feature('foundation_added')
  ProGran3::System::Monitoring::Analytics.track_feature('tiles_added')
  ProGran3::System::Monitoring::Analytics.track_error
  
  stats = ProGran3::System::Monitoring::Analytics.session_stats
  puts "   Features: #{stats[:features_used].length}"
  puts "   Errors: #{stats[:errors_count]}"
  puts "   API calls: #{stats[:api_calls]}"
  
  # Тест 3: Відправка аналітики (forced)
  puts "\n📝 Тест 3: Відправка аналітики (forced)..."
  result = ProGran3::System::Monitoring::Analytics.send_if_needed(true)
  puts "   Result: #{result}"
  
  puts "\n✅ Базове тестування завершено"
end
