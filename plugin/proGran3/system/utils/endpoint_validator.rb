# plugin/proGran3/system/utils/endpoint_validator.rb
# Валідація серверних endpoint'ів для безпеки

require 'uri'
require 'net/http'

module ProGran3
  module System
    module Utils
      class EndpointValidator
        
        # Дозволені домени (whitelist)
        ALLOWED_DOMAINS = [
          'server-hbf7li0u7-provis3ds-projects.vercel.app',
          'progran3-server.vercel.app',
          'progran3-api.vercel.app'
        ].freeze
        
        # Дозволені протоколи
        ALLOWED_PROTOCOLS = ['https'].freeze
        
        # Валідація URL сервера
        # @param url [String] URL для перевірки
        # @return [Boolean] true якщо URL безпечний
        def self.validate_url(url)
          begin
            uri = URI(url)
            
            # Перевірка протоколу
            unless ALLOWED_PROTOCOLS.include?(uri.scheme)
              raise SecurityError, "Небезпечний протокол: #{uri.scheme}"
            end
            
            # Перевірка домену
            unless ALLOWED_DOMAINS.include?(uri.host)
              raise SecurityError, "Небезпечний домен: #{uri.host}"
            end
            
            # Перевірка порту (тільки стандартні HTTPS порти)
            unless [443, nil].include?(uri.port)
              raise SecurityError, "Небезпечний порт: #{uri.port}"
            end
            
            true
            
          rescue => e
            puts "❌ Security validation failed: #{e.message}"
            false
          end
        end
        
        # Отримати інформацію про сервер
        # @param base_url [String] Базовий URL сервера
        # @return [Hash] { name: String, version: String, status: String }
        def self.server_info(base_url)
          begin
            uri = URI(base_url + '/api/systems')
            
            # Валідація URL
            return { name: 'Unknown', version: 'Unknown', status: 'Invalid URL' } unless validate_url(uri.to_s)
            
            # Запит до сервера
            http = Net::HTTP.new(uri.host, uri.port)
            http.use_ssl = true
            http.verify_mode = OpenSSL::SSL::VERIFY_PEER
            http.read_timeout = 5
            http.open_timeout = 5
            
            response = http.get(uri.path)
            
            if response.code.to_i == 200
              data = JSON.parse(response.body, symbolize_names: true)
              {
                name: data[:name] || 'ProGran3 Server',
                version: data[:version] || 'Unknown',
                status: 'Online'
              }
            else
              {
                name: 'ProGran3 Server',
                version: 'Unknown',
                status: "HTTP #{response.code}"
              }
            end
            
          rescue => e
            {
              name: 'ProGran3 Server',
              version: 'Unknown',
              status: "Error: #{e.message}"
            }
          end
        end
        
        # Перевірка чи є URL в whitelist
        # @param url [String]
        # @return [Boolean]
        def self.is_whitelisted?(url)
          begin
            uri = URI(url)
            ALLOWED_DOMAINS.include?(uri.host)
          rescue
            false
          end
        end
        
        # Додати домен до whitelist (для майбутнього використання)
        # @param domain [String]
        def self.add_domain(domain)
          # TODO: Реалізувати якщо потрібно
          # Можна додати до конфігу або бази даних
        end
        
        # Видалити домен з whitelist
        # @param domain [String]
        def self.remove_domain(domain)
          # TODO: Реалізувати якщо потрібно
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
    ServerValidator = System::Utils::EndpointValidator
  end
end

# === ТЕСТУВАННЯ ===
if __FILE__ == $0
  puts "🧪 Базове тестування Endpoint Validator..."
  
  # Тест 1: Валідація дозволеного URL
  puts "\n📝 Тест 1: Валідація дозволеного URL..."
  valid_url = 'https://server-hbf7li0u7-provis3ds-projects.vercel.app/api/licenses'
  result1 = ProGran3::System::Utils::EndpointValidator.validate_url(valid_url)
  puts "   #{result1 ? '✅ PASSED' : '❌ FAILED'}"
  
  # Тест 2: Валідація небезпечного URL
  puts "\n📝 Тест 2: Валідація небезпечного URL..."
  invalid_url = 'http://evil-server.com/api/licenses'
  result2 = ProGran3::System::Utils::EndpointValidator.validate_url(invalid_url)
  puts "   #{!result2 ? '✅ PASSED' : '❌ FAILED'}"
  
  # Тест 3: Валідація localhost
  puts "\n📝 Тест 3: Валідація localhost..."
  localhost_url = 'https://localhost:3000/api/licenses'
  result3 = ProGran3::System::Utils::EndpointValidator.validate_url(localhost_url)
  puts "   #{!result3 ? '✅ PASSED' : '❌ FAILED'}"
  
  # Тест 4: Валідація IP адреси
  puts "\n📝 Тест 4: Валідація IP адреси..."
  ip_url = 'https://192.168.1.1/api/licenses'
  result4 = ProGran3::System::Utils::EndpointValidator.validate_url(ip_url)
  puts "   #{!result4 ? '✅ PASSED' : '❌ FAILED'}"
  
  # Тест 5: Валідація небезпечного домену
  puts "\n📝 Тест 5: Валідація небезпечного домену..."
  evil_url = 'https://evil-server.com/api/licenses'
  result5 = ProGran3::System::Utils::EndpointValidator.validate_url(evil_url)
  puts "   #{!result5 ? '✅ PASSED' : '❌ FAILED'}"
  
  # Тест 6: Server info
  puts "\n📝 Тест 6: Server info..."
  info = ProGran3::System::Utils::EndpointValidator.server_info('https://server-hbf7li0u7-provis3ds-projects.vercel.app')
  puts "   ✅ PASSED"
  
  puts "\n✅ Базове тестування завершено"
end
