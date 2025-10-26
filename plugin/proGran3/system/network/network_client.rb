# plugin/proGran3/system/network/network_client.rb
# Мережевий клієнт для комунікації з сервером

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
        config_path = File.join(File.dirname(__FILE__), '..', '..', 'config.json')
        if File.exist?(config_path)
          config = JSON.parse(File.read(config_path))
          {
            base_url: config.dig('api', 'base_url') || 'https://server-one-amber.vercel.app',
            timeout: config.dig('api', 'timeout') || 10,
            retry_attempts: config.dig('api', 'retry_attempts') || 3
          }
        else
          # Fallback якщо config не знайдено
          {
            base_url: 'https://server-one-amber.vercel.app',
            timeout: 10,
            retry_attempts: 3
          }
        end
      rescue => e
        puts "⚠️ Помилка читання конфігу: #{e.message}. Використовуємо default."
        {
          base_url: 'https://server-one-amber.vercel.app',
          timeout: 10,
          retry_attempts: 3
        }
      end
      
      # URL сервера (динамічний з конфігу)
      def self.get_api_base_url
        url = load_api_config[:base_url]
        puts "🌐 Використовуємо сервер: #{url}" if defined?(puts)
        url
      end
      
      # Примусове оновлення конфігурації
      def self.reload_config!
        puts "🔄 Примусове оновлення конфігурації NetworkClient..."
        # Очищаємо будь-який кеш
        @config_cache = nil if defined?(@config_cache)
        url = load_api_config[:base_url]
        puts "✅ Новий URL сервера: #{url}"
        url
      end
      
      # Timeout для запитів (динамічний з конфігу)
      def self.get_request_timeout
        load_api_config[:timeout]
      end
      
      # HMAC Secret Key (v3.2: obfuscated через SecretManager)
      # Використовуємо глобальний secret для всіх клієнтів
      # Має збігатися з HMAC_SECRET_KEY на сервері
      # 
      # Security Note: v3.2 improvements:
      # 1. Secret обфускований через SecretManager (multi-layer)
      # 2. XOR з hardware fingerprint
      # 3. Розбитий на частини в різних методах
      # 4. Складніше витягнути через reverse engineering
      
      # ❌ ВИДАЛЕНО: Секрети небезпечні!
      # Замінено на hardware-based аутентифікацію
      def self.get_secret_key
        raise SecurityError, "Секрети видалені з міркувань безпеки. Використовуйте hardware-based аутентифікацію."
      end
      
      SECRET_KEY = nil  # Буде встановлено динамічно через get_secret_key
      
      # Активує ліцензію на сервері з retry логікою
      # @param email [String] Email користувача
      # @param license_key [String] Ключ ліцензії
      # @param fingerprint [String] Hardware fingerprint
      # @param max_retries [Integer] Максимальна кількість спроб
      # @return [Hash] { success: Boolean, license: Hash, error: String }
      def self.activate(email, license_key, fingerprint, max_retries = 3)
        endpoint = '/api/licenses/activate'
        
        payload = {
          user_email: email,
          license_key: license_key,
          system_fingerprint: fingerprint
        }
        
        puts "📤 Активація ліцензії: #{license_key[0..8]}..."
        
        response = post_request_with_retry(endpoint, payload, max_retries)
        
        if response[:success]
          puts "✅ Ліцензію активовано успішно"
        else
          puts "❌ Помилка активації: #{response[:error]}"
        end
        
        response
        
      rescue => e
        handle_exception('activate', e)
      end
      
      # Валідує ліцензію на сервері з retry логікою
      # @param license_key [String] Ключ ліцензії
      # @param fingerprint [String] Hardware fingerprint
      # @param max_retries [Integer] Максимальна кількість спроб
      # @return [Hash] { success: Boolean, valid: Boolean, license: Hash, error: String }
      def self.validate(license_key, fingerprint, max_retries = 3)
        endpoint = '/api/licenses/validate'
        
        payload = {
          license_key: license_key,
          system_fingerprint: fingerprint
        }
        
        puts "🔍 Валідація ліцензії: #{license_key[0..8]}..."
        
        response = post_request_with_retry(endpoint, payload, max_retries)
        
        if response[:success]
          puts "✅ Ліцензія валідна"
        else
          puts "❌ Помилка валідації: #{response[:error]}"
        end
        
        response
        
      rescue => e
        handle_exception('validate', e)
      end
      
      # v3.2: Перевірити налаштування HMAC на сервері (НЕ отримуємо секрет!)
      # @return [Hash] { success: Boolean, hmac_enabled: Boolean, error: String }
      def self.check_hmac_config
        endpoint = '/api/client/secret'
        
        uri = URI.parse("#{get_api_base_url}#{endpoint}")
        
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = (uri.scheme == 'https')
        http.open_timeout = get_request_timeout
        http.read_timeout = get_request_timeout
        
        request = Net::HTTP::Get.new(uri.request_uri)
        request['Content-Type'] = 'application/json'
        request['User-Agent'] = 'ProGran3-Plugin/1.0'
        request['X-Fingerprint'] = ProGran3::System::Utils::DeviceIdentifier.generate[:fingerprint]
        
        response = http.request(request)
        
        case response.code.to_i
        when 200
          data = JSON.parse(response.body, symbolize_names: true)
          if data[:success]
            { success: true, hmac_enabled: data[:data][:hmac_enabled] }
          else
            { success: false, error: data[:error] }
          end
        else
          { success: false, error: "HTTP #{response.code}" }
        end
        
      rescue => e
        { success: false, error: e.message }
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
        uri = URI.parse(get_api_base_url)
        
        Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https', open_timeout: 3, read_timeout: 3) do |http|
          response = http.head('/')
          response.code.to_i < 500
        end
        
      rescue => e
        puts "⚠️ Сервер недоступний: #{e.message}"
        false
      end
      
      private
      
      # ❌ ВИДАЛЕНО: HMAC підписи небезпечні!
      # Замінено на hardware-based аутентифікацію
      def self.create_hmac_signature(body, timestamp)
        raise SecurityError, "HMAC підписи видалені з міркувань безпеки. Використовуйте hardware-based аутентифікацію."
      end
      
      # Виконує POST запит
      # @param endpoint [String] API endpoint (наприклад '/api/licenses/activate')
      # @param payload [Hash] Дані для відправки
      # @param silent [Boolean] Чи приховувати логи
      # @return [Hash]
      def self.post_request(endpoint, payload, silent: false)
        # SECURITY: Валідуємо URL перед кожним запитом
        begin
          ProGran3::System::Utils::EndpointValidator.validate_url(get_api_base_url)
        rescue SecurityError => e
          Logger.error("Server validation failed: #{e.message}", "ApiClient")
          return {
            success: false,
            error: "Security error: #{e.message}",
            security_block: true
          }
        end
        
        uri = URI.parse("#{get_api_base_url}#{endpoint}")
        
        puts "🌐 POST #{uri}" unless silent
        
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = (uri.scheme == 'https')
        http.open_timeout = get_request_timeout
        http.read_timeout = get_request_timeout
        
        # Для production - перевіряємо SSL сертифікати
        # Для development можна вимкнути якщо є проблеми
        http.verify_mode = OpenSSL::SSL::VERIFY_PEER
        
        request = Net::HTTP::Post.new(uri.request_uri)
        request['Content-Type'] = 'application/json'
        request['User-Agent'] = 'ProGran3-Plugin/1.0'
        
        # Конвертуємо payload в JSON
        body = payload.to_json
        request.body = body
        
        # ✅ НОВА БЕЗПЕЧНА СИСТЕМА: Hardware-based аутентифікація
        headers = ProGran3::System::Core::ConfigManager.create_authenticated_headers(endpoint, payload)
        
        headers.each do |key, value|
          request[key] = value
        end
        
        puts "🔐 Hardware-based аутентифікація додана" unless silent
        
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
              
              # Спеціальна обробка для "License not found"
              if error_message.include?('License not found') || error_message.include?('not found')
                return {
                  success: false,
                  error: 'License not found',
                  data: { valid: false, error: 'License not found' }
                }
              end
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
      
      # POST запит з retry логікою
      # @param endpoint [String] API endpoint
      # @param payload [Hash] Дані для відправки
      # @param max_retries [Integer] Максимальна кількість спроб
      # @return [Hash] Response
      def self.post_request_with_retry(endpoint, payload, max_retries = 3)
        retries = 0
        last_exception = nil
        
        begin
          response = post_request(endpoint, payload)
          
          # Якщо успішно - повертаємо відповідь
          return response if response[:success]
          
          # Якщо помилка, але не network - не retry
          unless response[:offline]
            return response
          end
          
        rescue => e
          last_exception = e
          retries += 1
          
          puts "⚠️ Спроба #{retries}/#{max_retries} невдала: #{e.message}"
          
          if retries < max_retries
            # Exponential backoff: 1s, 2s, 4s
            delay = 2 ** (retries - 1)
            puts "⏳ Очікування #{delay} секунд перед повторною спробою..."
            sleep(delay)
            retry
          else
            puts "❌ Всі спроби вичерпано"
            return handle_exception('post_request_with_retry', e)
          end
        end
        
        # Якщо дійшли сюди - всі спроби невдалі
        {
          success: false,
          error: "Network error after #{max_retries} attempts: #{last_exception&.message}",
          offline: true
        }
      end
      
      # v3.2: Створює HMAC підпис з конкретним secret
      # @param body [String] JSON тіло запиту
      # @param timestamp [Integer] Unix timestamp
      # @param secret [String] HMAC secret
      # @return [String] HMAC підпис (hex)
      def self.create_hmac_signature_with_secret(body, timestamp, secret)
        message = "#{body}#{timestamp}"
        OpenSSL::HMAC.hexdigest('SHA256', secret, message)
      rescue => e
        puts "⚠️ Помилка створення HMAC підпису: #{e.message}"
        nil
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
end

