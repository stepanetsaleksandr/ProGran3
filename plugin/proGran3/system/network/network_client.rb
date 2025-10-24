# plugin/proGran3/system/network/network_client.rb
# HTTP клієнт для комунікації з сервером

require 'net/http'
require 'uri'
require 'json'
require 'openssl'
require_relative '../utils/endpoint_validator'
require_relative '../core/config_manager'

module ProGran3
  module System
    module Network
      class NetworkClient
        
        # Читаємо URL з конфігу
        def self.load_api_config
          config_path = File.join(File.dirname(__FILE__), '..', '..', '..', 'config.json')
          if File.exist?(config_path)
            config = JSON.parse(File.read(config_path))
            {
              base_url: config.dig('api', 'base_url') || 'https://server-hbf7li0u7-provis3ds-projects.vercel.app',
              timeout: config.dig('api', 'timeout') || 10,
              retry_attempts: config.dig('api', 'retry_attempts') || 3
            }
          else
            # Fallback якщо config не знайдено
            {
              base_url: 'https://server-hbf7li0u7-provis3ds-projects.vercel.app',
              timeout: 10,
              retry_attempts: 3
            }
          end
        rescue => e
          puts "⚠️ Помилка читання конфігу: #{e.message}. Використовуємо default."
          {
            base_url: 'https://server-hbf7li0u7-provis3ds-projects.vercel.app',
            timeout: 10,
            retry_attempts: 3
          }
        end
        
        # URL сервера (з конфігу)
        API_BASE_URL = load_api_config[:base_url].freeze
        
        # Timeout для запитів (з конфігу)
        REQUEST_TIMEOUT = load_api_config[:timeout]
        
        # HMAC Secret Key (v3.2: obfuscated через ConfigManager)
        # Використовуємо глобальний secret для всіх клієнтів
        # Має збігатися з HMAC_SECRET_KEY на сервері
        # 
        # ⚠️ ВАЖЛИВО: Цей secret має бути ідентичним на клієнті і сервері!
        # Зміна цього ключа зламає всі існуючі ліцензії!
        def self.get_secret_key
          # v3.2: Використовуємо ConfigManager замість hardcoded secret
          ConfigManager.get_hmac_secret
        end
        
        # Активація ліцензії
        # @param email [String] Email користувача
        # @param license_key [String] Ключ ліцензії
        # @param fingerprint [String] Hardware fingerprint
        # @param max_retries [Integer] Максимальна кількість спроб
        # @return [Hash] { success: Boolean, data: Hash, error: String }
        def self.activate(email, license_key, fingerprint, max_retries = 3)
          endpoint = '/api/licenses/activate'
          
          payload = {
            email: email,
            license_key: license_key,
            system_fingerprint: fingerprint
          }
          
          post_request(endpoint, payload, max_retries)
        end
        
        # Валідація ліцензії
        # @param license_key [String] Ключ ліцензії
        # @param fingerprint [String] Hardware fingerprint
        # @param max_retries [Integer] Максимальна кількість спроб
        # @return [Hash] { success: Boolean, data: Hash, error: String }
        def self.validate(license_key, fingerprint, max_retries = 3)
          endpoint = '/api/licenses/validate'
          
          payload = {
            license_key: license_key,
            system_fingerprint: fingerprint
          }
          
          post_request(endpoint, payload, max_retries)
        end
        
        # Heartbeat (відправка статусу активності)
        # @param license_key [String] Ключ ліцензії
        # @param fingerprint [String] Hardware fingerprint
        # @return [Hash] { success: Boolean, data: Hash, error: String }
        def self.heartbeat(license_key, fingerprint)
          endpoint = '/api/heartbeats'
          
          payload = {
            license_key: license_key,
            system_fingerprint: fingerprint,
            timestamp: Time.now.to_i,
            event_type: 'heartbeat',
            plugin_version: '3.2.1',
            platform: RUBY_PLATFORM
          }
          
          post_request(endpoint, payload, 1)  # Heartbeat не retry
        end
        
        # Перевірка доступності сервера
        # @return [Boolean] true якщо сервер доступний
        def self.server_available?
          begin
            uri = URI(API_BASE_URL)
            http = Net::HTTP.new(uri.host, uri.port)
            http.use_ssl = true
            http.verify_mode = OpenSSL::SSL::VERIFY_PEER
            http.read_timeout = 5
            http.open_timeout = 5
            
            response = http.get('/api/systems')
            response.code.to_i == 200
            
          rescue => e
            puts "⚠️ Сервер недоступний: #{e.message}"
            false
          end
        end
        
        # Виконує POST запит
        # @param endpoint [String] API endpoint (наприклад '/api/licenses/activate')
        # @param payload [Hash] Дані для відправки
        # @param max_retries [Integer] Максимальна кількість спроб
        # @param silent [Boolean] Приховати логи
        # @return [Hash] { success: Boolean, data: Hash, error: String, offline: Boolean }
        def self.post_request(endpoint, payload, max_retries = 3, silent = false)
          uri = URI(API_BASE_URL + endpoint)
          
          # Валідація URL (security check)
          unless EndpointValidator.validate_url(uri.to_s)
            return {
              success: false,
              error: 'Invalid server URL',
              offline: false
            }
          end
          
          # Конвертуємо payload в JSON
          body = payload.to_json
          
          # Створюємо HTTP запит
          request = Net::HTTP::Post.new(uri)
          request['Content-Type'] = 'application/json'
          request['User-Agent'] = 'ProGran3-Plugin/3.2.1'
          
          # Додаємо HMAC headers (v3.0: завжди!)
          timestamp = Time.now.to_i
          signature = create_hmac_signature(body, timestamp)
          
          if signature
            request['X-HMAC-Signature'] = signature
            request['X-Timestamp'] = timestamp.to_s
            puts "🔐 HMAC підпис додано" unless silent
          else
            puts "⚠️ Не вдалося створити HMAC підпис - запит може бути відхилено сервером" unless silent
          end
          
          # Виконуємо запит з retry логікою
          last_error = nil
          
          (1..max_retries).each do |attempt|
            begin
              puts "🌐 Відправка запиту (спроба #{attempt}/#{max_retries})..." unless silent
              
              http = Net::HTTP.new(uri.host, uri.port)
              http.use_ssl = true
              http.verify_mode = OpenSSL::SSL::VERIFY_PEER
              http.read_timeout = REQUEST_TIMEOUT
              http.open_timeout = REQUEST_TIMEOUT
              
              response = http.request(request)
              
              if response.code.to_i == 200
                data = JSON.parse(response.body, symbolize_names: true)
                puts "✅ Запит успішний" unless silent
                
                return {
                  success: true,
                  data: data,
                  offline: false
                }
              else
                error_msg = "HTTP #{response.code}: #{response.message}"
                puts "❌ Помилка сервера: #{error_msg}" unless silent
                
                return {
                  success: false,
                  error: error_msg,
                  offline: false
                }
              end
              
            rescue Net::TimeoutError, Net::OpenTimeout, Net::ReadTimeout => e
              last_error = e
              puts "⏰ Timeout (спроба #{attempt}/#{max_retries}): #{e.message}" unless silent
              
              if attempt < max_retries
                sleep(2 ** attempt)  # Exponential backoff
              end
              
            rescue => e
              last_error = e
              puts "❌ Помилка з'єднання (спроба #{attempt}/#{max_retries}): #{e.message}" unless silent
              
              if attempt < max_retries
                sleep(2 ** attempt)  # Exponential backoff
              end
            end
          end
          
          # Всі спроби невдалі
          puts "❌ Всі спроби невдалі. Остання помилка: #{last_error.message}" unless silent
          
          {
            success: false,
            error: last_error.message,
            offline: true
          }
        end
        
        # Створює HMAC підпис для запиту (v3.0: завжди ввімкнено)
        # @param body [String] JSON тіло запиту
        # @param timestamp [Integer] Unix timestamp
        # @return [String] HMAC підпис (hex)
        def self.create_hmac_signature(body, timestamp)
          # v3.0: Завжди використовуємо HMAC (не опціонально!)
          secret = get_secret_key
          return nil unless secret
          
          message = "#{body}#{timestamp}"
          OpenSSL::HMAC.hexdigest('SHA256', secret, message)
        rescue => e
          puts "⚠️ Помилка створення HMAC підпису: #{e.message}"
          nil
        end
        
        # Отримує інформацію про сервер
        # @return [Hash] { name: String, version: String, status: String }
        def self.server_info
          EndpointValidator.server_info(API_BASE_URL)
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
    ApiClient = System::Network::NetworkClient
  end
end

# === ТЕСТУВАННЯ ===
if __FILE__ == $0
  puts "🧪 Базове тестування Network Client..."
  
  # Тест 1: Перевірка сервера
  puts "\n📝 Тест 1: Перевірка сервера..."
  available = ProGran3::System::Network::NetworkClient.server_available?
  puts "   #{available ? '✅ Сервер доступний' : '❌ Сервер недоступний'}"
  
  # Тест 2: Валідація (очікується помилка)
  puts "\n📝 Тест 2: Валідація (очікується помилка)..."
  result = ProGran3::System::Network::NetworkClient.validate('TEST-KEY-12345', 'test_fingerprint')
  puts "   Success: #{result[:success]}"
  puts "   Error: #{result[:error]}" if result[:error]
  
  # Тест 3: Інформація про сервер
  puts "\n📝 Тест 3: Інформація про сервер..."
  info = ProGran3::System::Network::NetworkClient.server_info
  puts "   Name: #{info[:name]}"
  puts "   Version: #{info[:version]}"
  puts "   Status: #{info[:status]}"
  
  puts "\n✅ Базове тестування завершено"
end
