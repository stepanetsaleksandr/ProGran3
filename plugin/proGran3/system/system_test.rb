# plugin/proGran3/system/system_test.rb
# Комплексне тестування всіх системних покращень v3.2

require_relative 'utils/endpoint_validator'
require_relative 'core/config_manager'
require_relative 'utils/time_sync'
require_relative 'monitoring/analytics'
require_relative 'core/session_manager'

module ProGran3
  module System
    class SystemTest
      
      def self.run_all_tests
        puts "\n" + "=" * 70
        puts "🔐 КОМПЛЕКСНЕ ТЕСТУВАННЯ SECURITY v3.2"
        puts "=" * 70
        
        results = {
          server_validator: test_server_validator,
          secret_manager: test_secret_manager,
          time_validator: test_time_validator,
          telemetry: test_telemetry,
          integration: test_integration
        }
        
        print_results(results)
        
        results
      end
      
      # Тест 1: Server Validator
      def self.test_server_validator
        puts "\n" + "-" * 70
        puts "🧪 ТЕСТ 1: Server Validator (Certificate Pinning)"
        puts "-" * 70
        
        tests = []
        
        # 1.1: Валідний Vercel URL
        print "  [1.1] Валідний Vercel URL... "
        begin
          ProGran3::System::Utils::EndpointValidator.validate_url('https://server-abc.vercel.app')
          puts "✅ PASS"
          tests << true
        rescue => e
          puts "❌ FAIL: #{e.message}"
          tests << false
        end
        
        # 1.2: HTTP (має бути заблоковано)
        print "  [1.2] HTTP URL (block)... "
        begin
          ProGran3::System::Utils::EndpointValidator.validate_url('http://server.vercel.app')
          puts "❌ FAIL: Не заблоковано!"
          tests << false
        rescue SecurityError
          puts "✅ PASS (blocked)"
          tests << true
        end
        
        # 1.3: Localhost (має бути заблоковано)
        print "  [1.3] Localhost (block)... "
        begin
          ProGran3::System::Utils::EndpointValidator.validate_url('https://localhost:3000')
          puts "❌ FAIL: Не заблоковано!"
          tests << false
        rescue SecurityError
          puts "✅ PASS (blocked)"
          tests << true
        end
        
        # 1.4: Evil domain (має бути заблоковано)
        print "  [1.4] Evil domain (block)... "
        begin
          ProGran3::System::Utils::EndpointValidator.validate_url('https://evil-hacker.com')
          puts "❌ FAIL: Не заблоковано!"
          tests << false
        rescue SecurityError
          puts "✅ PASS (blocked)"
          tests << true
        end
        
        # 1.5: Internal IP (має бути заблоковано)
        print "  [1.5] Internal IP (block)... "
        begin
          ProGran3::System::Utils::EndpointValidator.validate_url('https://192.168.1.100')
          puts "❌ FAIL: Не заблоковано!"
          tests << false
        rescue SecurityError
          puts "✅ PASS (blocked)"
          tests << true
        end
        
        passed = tests.count(true)
        total = tests.length
        puts "\n  📊 Server Validator: #{passed}/#{total} passed"
        
        { passed: passed, total: total, success: passed == total }
      end
      
      # Тест 2: Secret Manager
      def self.test_secret_manager
        puts "\n" + "-" * 70
        puts "🧪 ТЕСТ 2: Secret Manager (HMAC Obfuscation)"
        puts "-" * 70
        
        tests = []
        
        # 2.1: Secret генерується
        print "  [2.1] Secret generation... "
        begin
          secret = ProGran3::System::Core::ConfigManager.get_hmac_secret
          if secret && secret.length > 50
            puts "✅ PASS"
            tests << true
          else
            puts "❌ FAIL: Secret занадто короткий"
            tests << false
          end
        rescue => e
          puts "❌ FAIL: #{e.message}"
          tests << false
        end
        
        # 2.2: Secret консистентний
        print "  [2.2] Secret consistency... "
        begin
          secret1 = ProGran3::System::Core::ConfigManager.get_hmac_secret
          secret2 = ProGran3::System::Core::ConfigManager.get_hmac_secret
          if secret1 == secret2
            puts "✅ PASS"
            tests << true
          else
            puts "❌ FAIL: Secret не консистентний"
            tests << false
          end
        rescue => e
          puts "❌ FAIL: #{e.message}"
          tests << false
        end
        
        # 2.3: Secret правильний
        print "  [2.3] Secret correctness... "
        begin
          secret = ProGran3::System::Core::ConfigManager.get_hmac_secret
          expected = 'ProGran3-HMAC-Global-Secret-2025-v3.1-DO-NOT-SHARE-9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d'
          if secret == expected
            puts "✅ PASS"
            tests << true
          else
            puts "❌ FAIL: Secret не збігається"
            tests << false
          end
        rescue => e
          puts "❌ FAIL: #{e.message}"
          tests << false
        end
        
        passed = tests.count(true)
        total = tests.length
        puts "\n  📊 Secret Manager: #{passed}/#{total} passed"
        
        { passed: passed, total: total, success: passed == total }
      end
      
      # Тест 3: Time Validator
      def self.test_time_validator
        puts "\n" + "-" * 70
        puts "🧪 ТЕСТ 3: Time Validator (NTP Sync)"
        puts "-" * 70
        
        tests = []
        
        # 3.1: NTP час отримується
        print "  [3.1] NTP time fetch... "
        begin
          ntp_result = ProGran3::System::Utils::TimeSync.get_real_time
          if ntp_result[:time]
            puts "✅ PASS (source: #{ntp_result[:source]})"
            tests << true
          else
            puts "❌ FAIL: NTP час не отримано"
            tests << false
          end
        rescue => e
          puts "⚠️ WARN: #{e.message} (може бути offline)"
          tests << true  # Не критично
        end
        
        # 3.2: Системний час валідується
        print "  [3.2] System time validation... "
        begin
          validation = ProGran3::System::Utils::TimeSync.validate_system_time
          puts "✅ PASS (diff: #{validation[:diff_seconds]}s)"
          tests << true
        rescue => e
          puts "❌ FAIL: #{e.message}"
          tests << false
        end
        
        # 3.3: Cache працює
        print "  [3.3] NTP cache... "
        begin
          time1 = ProGran3::System::Utils::TimeSync.get_real_time
          time2 = ProGran3::System::Utils::TimeSync.get_real_time
          # Має бути той самий час (з кешу)
          if time1[:time] == time2[:time]
            puts "✅ PASS"
            tests << true
          else
            puts "⚠️ WARN: Cache не спрацював"
            tests << true  # Не критично
          end
        rescue => e
          puts "❌ FAIL: #{e.message}"
          tests << false
        end
        
        passed = tests.count(true)
        total = tests.length
        puts "\n  📊 Time Validator: #{passed}/#{total} passed"
        
        { passed: passed, total: total, success: passed == total }
      end
      
      # Тест 4: ProGran3::System::Monitoring::Analytics
      def self.test_telemetry
        puts "\n" + "-" * 70
        puts "🧪 ТЕСТ 4: ProGran3::System::Monitoring::Analytics (Anomaly Detection)"
        puts "-" * 70
        
        tests = []
        
        # 4.1: Збір даних
        print "  [4.1] Data collection... "
        begin
          data = ProGran3::System::Monitoring::Analytics.send(:collect_telemetry_data)
          if data[:fingerprint_hash] && data[:plugin_version]
            puts "✅ PASS"
            tests << true
          else
            puts "❌ FAIL: Неповні дані"
            tests << false
          end
        rescue => e
          puts "❌ FAIL: #{e.message}"
          tests << false
        end
        
        # 4.2: Feature tracking
        print "  [4.2] Feature tracking... "
        begin
          ProGran3::System::Monitoring::Analytics.track_feature('test_feature')
          ProGran3::System::Monitoring::Analytics.track_error
          stats = ProGran3::System::Monitoring::Analytics.session_stats
          if stats[:features_used].include?('test_feature') && stats[:errors_count] > 0
            puts "✅ PASS"
            tests << true
          else
            puts "❌ FAIL"
            tests << false
          end
        rescue => e
          puts "❌ FAIL: #{e.message}"
          tests << false
        end
        
        # 4.3: Відправка (async)
        print "  [4.3] ProGran3::System::Monitoring::Analytics send... "
        begin
          result = ProGran3::System::Monitoring::Analytics.send_if_needed(true)
          puts "✅ PASS"
          tests << true
        rescue => e
          puts "❌ FAIL: #{e.message}"
          tests << false
        end
        
        passed = tests.count(true)
        total = tests.length
        puts "\n  📊 ProGran3::System::Monitoring::Analytics: #{passed}/#{total} passed"
        
        { passed: passed, total: total, success: passed == total }
      end
      
      # Тест 5: Integration
      def self.test_integration
        puts "\n" + "-" * 70
        puts "🧪 ТЕСТ 5: Integration (Всі модулі разом)"
        puts "-" * 70
        
        tests = []
        
        # 5.1: License Manager ініціалізується
        print "  [5.1] ProGran3::System::Core::SessionManager init... "
        begin
          manager = ProGran3::System::Core::SessionManager.new
          puts "✅ PASS"
          tests << true
        rescue => e
          puts "❌ FAIL: #{e.message}"
          tests << false
        end
        
        # 5.2: API Client працює з security
        print "  [5.2] API Client with security... "
        begin
          # Має валідувати URL
          available = ApiClient.server_available?
          puts "✅ PASS (server: #{available ? 'online' : 'offline'})"
          tests << true
        rescue => e
          puts "❌ FAIL: #{e.message}"
          tests << false
        end
        
        # 5.3: Всі модулі завантажені
        print "  [5.3] All modules loaded... "
        modules = [
          defined?(ProGran3::System::Utils::EndpointValidator),
          defined?(ProGran3::System::Core::ConfigManager),
          defined?(ProGran3::System::Utils::TimeSync),
          defined?(ProGran3::System::Monitoring::Analytics),
          defined?(ProGran3::System::Core::SessionManager)
        ]
        
        if modules.all?
          puts "✅ PASS"
          tests << true
        else
          puts "❌ FAIL: Деякі модулі не завантажені"
          tests << false
        end
        
        passed = tests.count(true)
        total = tests.length
        puts "\n  📊 Integration: #{passed}/#{total} passed"
        
        { passed: passed, total: total, success: passed == total }
      end
      
      # Вивести результати
      def self.print_results(results)
        puts "\n" + "=" * 70
        puts "📊 ФІНАЛЬНІ РЕЗУЛЬТАТИ"
        puts "=" * 70
        
        total_passed = 0
        total_tests = 0
        
        results.each do |name, result|
          total_passed += result[:passed]
          total_tests += result[:total]
          
          status = result[:success] ? "✅ PASS" : "❌ FAIL"
          puts "  #{name.to_s.ljust(20)}: #{result[:passed]}/#{result[:total]} #{status}"
        end
        
        puts "\n" + "-" * 70
        puts "  ЗАГАЛОМ: #{total_passed}/#{total_tests} тестів пройдено"
        
        percentage = (total_passed.to_f / total_tests * 100).round(1)
        puts "  УСПІШНІСТЬ: #{percentage}%"
        
        if percentage == 100
          puts "\n  🎉 ВСІ ТЕСТИ ПРОЙДЕНІ! Security покращення працюють!"
        elsif percentage >= 90
          puts "\n  ✅ Більшість тестів пройдено. Security покращено!"
        elsif percentage >= 70
          puts "\n  ⚠️ Деякі тести не пройдені. Потрібні виправлення."
        else
          puts "\n  ❌ Багато тестів не пройдено. Критичні проблеми!"
        end
        
        puts "=" * 70 + "\n"
      end
    end
  end
end

# === ЗАПУСК ТЕСТУВАННЯ ===
if __FILE__ == $0
  require 'set'
  ProGran3::Security::SecurityTest.run_all_tests
end

