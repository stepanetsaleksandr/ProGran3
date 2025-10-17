# plugin/proGran3/security/api_client.rb
# HTTP клієнт для комунікації з сервером ліцензій

require 'net/http'
require 'uri'
require 'json'
require 'openssl'

module ProGran3
  module Security
    class ApiClient
      
      # URL сервера (Vercel)
      API_BASE_URL = 'https://server-hbf7li0u7-provis3ds-projects.vercel.app'.freeze
      
      # Timeout для запитів
      REQUEST_TIMEOUT = 10 # секунд
      
      # HMAC Secret Key (v3.1: server-side secret)
      # Використовуємо глобальний secret для всіх клієнтів
      # Має збігатися з HMAC_SECRET_KEY на сервері
      # 
      # Security Note: Цей ключ захардкожений тут, але:
      # 1. Клієнт може бути обфусковано (.rbc)
      # 2. Зміна ключа = оновлення плагіна (контрольоване)
      # 3. Краще ніж predictable fingerprint-based key
      
      def self.get_secret_key
        # Глобальний shared secret (має збігатися з сервером)
        # В production: обфускувати або завантажувати динамічно
        'ProGran3-HMAC-Global-Secret-2025-v3.1-DO-NOT-SHARE-9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d'
      end
      
      SECRET_KEY = nil  # Буде встановлено динамічно через get_secret_key
      
      # Активує ліцензію на сервері
      # @param email [String] Email користувача
      # @param license_key [String] Ключ ліцензії
      # @param fingerprint [String] Hardware fingerprint
      # @return [Hash] { success: Boolean, license: Hash, error: String }
      def self.activate(email, license_key, fingerprint)
        endpoint = '/api/licenses/activate'
        
        payload = {
          user_email: email,
          license_key: license_key,
          system_fingerprint: fingerprint
        }
        
        puts "📤 Активація ліцензії: #{license_key[0..8]}..."
        
        response = post_request(endpoint, payload)
        
        if response[:success]
          puts "✅ Ліцензію активовано успішно"
        else
          puts "❌ Помилка активації: #{response[:error]}"
        end
        
        response
        
      rescue => e
        handle_exception('activate', e)
      end
      
      # Валідує ліцензію на сервері
      # @param license_key [String] Ключ ліцензії
      # @param fingerprint [String] Hardware fingerprint
      # @return [Hash] { success: Boolean, valid: Boolean, license: Hash, error: String }
      def self.validate(license_key, fingerprint)
        endpoint = '/api/licenses/validate'
        
        payload = {
          license_key: license_key,
          system_fingerprint: fingerprint
        }
        
        puts "🔍 Валідація ліцензії: #{license_key[0..8]}..."
        
        response = post_request(endpoint, payload)
        
        if response[:success]
          puts "✅ Ліцензія валідна"
        else
          puts "❌ Помилка валідації: #{response[:error]}"
        end
        
        response
        
      rescue => e
        handle_exception('validate', e)
      end
      
      # Відправляє heartbeat на сервер
      # @param license_key [String] Ключ ліцензії
      # @param fingerprint [String] Hardware fingerprint
      # @return [Hash] { success: Boolean }
      def self.heartbeat(license_key, fingerprint)
        endpoint = '/api/heartbeats'
        
        payload = {
          license_key: license_key,
          system_fingerprint: fingerprint,
          plugin_version: '1.0.0',
          timestamp: Time.now.iso8601
        }
        
        # Heartbeat не виводимо в лог (занадто часто)
        
        response = post_request(endpoint, payload, silent: true)
        response
        
      rescue => e
        # Heartbeat помилки не критичні - просто повертаємо offline
        { success: false, offline: true, error: e.message }
      end
      
      # Асинхронна активація (не блокує UI)
      # @param email [String]
      # @param license_key [String]
      # @param fingerprint [String]
      # @param callback [Proc] Callback функція для результату
      def self.activate_async(email, license_key, fingerprint, &callback)
        Thread.new do
          begin
            result = activate(email, license_key, fingerprint)
            callback.call(result) if callback
          rescue => e
            callback.call(handle_exception('activate_async', e)) if callback
          end
        end
      end
      
      # Асинхронна валідація
      # @param license_key [String]
      # @param fingerprint [String]
      # @param callback [Proc]
      def self.validate_async(license_key, fingerprint, &callback)
        Thread.new do
          begin
            result = validate(license_key, fingerprint)
            callback.call(result) if callback
          rescue => e
            callback.call(handle_exception('validate_async', e)) if callback
          end
        end
      end
      
      # Перевірка доступності сервера
      # @return [Boolean]
      def self.server_available?
        uri = URI.parse(API_BASE_URL)
        
        Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https', open_timeout: 3, read_timeout: 3) do |http|
          response = http.head('/')
          response.code.to_i < 500
        end
        
      rescue => e
        puts "⚠️ Сервер недоступний: #{e.message}"
        false
      end
      
      private
      
      # Створює HMAC підпис для запиту (v3.0: завжди ввімкнено)
      # @param body [String] JSON тіло запиту
      # @param timestamp [Integer] Unix timestamp
      # @return [String] HMAC підпис (hex)
      def self.create_hmac_signature(body, timestamp)
        # v3.0: Завжди використовуємо HMAC (не опціонально!)
        secret = get_secret_key
        
        message = "#{body}#{timestamp}"
        OpenSSL::HMAC.hexdigest('SHA256', secret, message)
      rescue => e
        puts "⚠️ Помилка створення HMAC підпису: #{e.message}"
        nil
      end
      
      # Виконує POST запит
      # @param endpoint [String] API endpoint (наприклад '/api/licenses/activate')
      # @param payload [Hash] Дані для відправки
      # @param silent [Boolean] Чи приховувати логи
      # @return [Hash]
      def self.post_request(endpoint, payload, silent: false)
        uri = URI.parse("#{API_BASE_URL}#{endpoint}")
        
        puts "🌐 POST #{uri}" unless silent
        
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = (uri.scheme == 'https')
        http.open_timeout = REQUEST_TIMEOUT
        http.read_timeout = REQUEST_TIMEOUT
        
        # Для production - перевіряємо SSL сертифікати
        # Для development можна вимкнути якщо є проблеми
        http.verify_mode = OpenSSL::SSL::VERIFY_PEER
        
        request = Net::HTTP::Post.new(uri.request_uri)
        request['Content-Type'] = 'application/json'
        request['User-Agent'] = 'ProGran3-Plugin/1.0'
        
        # Конвертуємо payload в JSON
        body = payload.to_json
        request.body = body
        
        # Додаємо HMAC headers (v3.0: завжди!)
        timestamp = Time.now.to_i
        signature = create_hmac_signature(body, timestamp)
        
        if signature
          request['X-Signature'] = signature
          request['X-Timestamp'] = timestamp.to_s
          puts "🔐 HMAC підпис додано" unless silent
        else
          puts "⚠️ Не вдалося створити HMAC підпис - запит може бути відхилено сервером" unless silent
        end
        
        response = http.request(request)
        
        puts "📥 Response: #{response.code}" unless silent
        
        # Додаткове логування для debug
        unless silent
          puts "📥 Response Body: #{response.body[0..200]}..." if response.body
        end
        
        # Парсимо відповідь
        parse_response(response)
        
      rescue Timeout::Error
        {
          success: false,
          offline: true,
          error: 'Request timeout - сервер не відповідає'
        }
        
      rescue SocketError, Errno::ECONNREFUSED => e
        {
          success: false,
          offline: true,
          error: "Немає з'єднання з сервером: #{e.message}"
        }
        
      rescue OpenSSL::SSL::SSLError => e
        {
          success: false,
          error: "SSL помилка: #{e.message}"
        }
        
      rescue => e
        {
          success: false,
          error: "Network error: #{e.message}"
        }
      end
      
      # Парсить HTTP відповідь
      # @param response [Net::HTTPResponse]
      # @return [Hash]
      def self.parse_response(response)
        # Перевіряємо статус код
        case response.code.to_i
        when 200, 201
          # Успіх - парсимо JSON
          begin
            body = response.body
            return { success: false, error: 'Empty response' } if body.nil? || body.empty?
            
            data = JSON.parse(body, symbolize_names: true)
            
            # API повертає { success: true/false, data: {...}, error: '...' }
            if data[:success]
              data
            else
              {
                success: false,
                error: data[:error] || 'Unknown error'
              }
            end
            
          rescue JSON::ParserError => e
            {
              success: false,
              error: "Invalid JSON response: #{e.message}"
            }
          end
          
        when 400, 401, 403, 404
          # Для помилок також намагаємось парсити body щоб отримати деталі
          begin
            body = response.body
            if body && !body.empty?
              data = JSON.parse(body, symbolize_names: true)
              error_message = data[:error] || data[:message] || "HTTP #{response.code}"
            else
              error_message = "HTTP #{response.code}"
            end
          rescue JSON::ParserError
            error_message = "HTTP #{response.code}: #{response.body}"
          end
          
          {
            success: false,
            error: error_message
          }
          
        when 429
          {
            success: false,
            error: 'Too many requests - забагато запитів, спробуйте пізніше'
          }
          
        when 500..599
          {
            success: false,
            error: "Server error (#{response.code}) - проблема на сервері"
          }
          
        else
          {
            success: false,
            error: "Unexpected status code: #{response.code}"
          }
        end
      end
      
      # Обробка винятків
      # @param operation [String]
      # @param exception [Exception]
      # @return [Hash]
      def self.handle_exception(operation, exception)
        puts "❌ Exception in #{operation}: #{exception.message}"
        puts exception.backtrace.first(3).join("\n") if $DEBUG
        
        {
          success: false,
          error: exception.message,
          offline: exception.is_a?(SocketError) || exception.is_a?(Errno::ECONNREFUSED)
        }
      end
    end
  end
end

# === ТЕСТУВАННЯ ===
if __FILE__ == $0
  puts "🧪 Тестування API Client..."
  
  # Тест 1: Перевірка доступності сервера
  puts "\n📝 Тест 1: Перевірка сервера..."
  available = ProGran3::Security::ApiClient.server_available?
  puts "   #{available ? '✅ Сервер доступний' : '❌ Сервер недоступний'}"
  
  # Тест 2: Спроба валідації (з неіснуючим ключем)
  puts "\n📝 Тест 2: Валідація (очікується помилка)..."
  result = ProGran3::Security::ApiClient.validate('TEST-KEY-12345', 'test_fingerprint')
  puts "   Success: #{result[:success]}"
  puts "   Error: #{result[:error]}" if result[:error]
  
  puts "\n✅ Базове тестування завершено"
  puts "   Детальні тести в TEST_STEP_3.rb"
end

