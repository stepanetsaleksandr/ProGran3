# LicenseManager - Нова система ліцензування без локального збереження
# VERSION: 2025-09-26 - NEW_ARCHITECTURE

require 'net/http'
require 'json'
require 'socket'

module ProGran3
  module Security
    class LicenseManager
      attr_reader :email, :license_key, :hardware_id, :offline_count
      
      def initialize
        @hardware_id = get_hardware_id
        @offline_count = 0
        @max_offline_hours = 24
        @base_url = ENV['PROGRAN3_TRACKING_URL'] || 'https://progran3-tracking-server-qflxj41tp-provis3ds-projects.vercel.app'
        
        # Завантажуємо збережену ліцензію при ініціалізації
        load_saved_license
        puts "🔐 [LicenseManager] Ініціалізовано з локальним збереженням"
      end
      
      # Перевірка чи є ліцензія
      def has_license?
        !@email.nil? && !@license_key.nil?
      end
      
      # Перевірка чи заблокований плагін
      def is_blocked?
        !has_license?
      end
      
      # Реєстрація ліцензії на сервері
      def register_license(email, license_key)
        begin
          puts "🔐 [LicenseManager] Реєстрація ліцензії: #{email} + #{license_key[0..8]}..."
          
          uri = URI("#{@base_url}/api/license/register-simple")
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = true
          http.read_timeout = 10
          http.open_timeout = 10
          
          request = Net::HTTP::Post.new(uri)
          request['Content-Type'] = 'application/json'
          request.body = {
            email: email,
            license_key: license_key,
            hardware_id: @hardware_id
          }.to_json
          
          response = http.request(request)
          
          if response.code == '200'
            result = JSON.parse(response.body)
            if result['success']
              # Зберігаємо ліцензію локально
              expires_at = result['user_license'] && result['user_license']['expires_at'] ? result['user_license']['expires_at'] : nil
              save_license_locally(email, license_key, expires_at)
              
              puts "✅ [LicenseManager] Ліцензія успішно зареєстрована та збережена"
              puts "🔐 [DEBUG] LicenseManager після активації: email=#{@email}, license_key=#{@license_key[0..8]}..."
              puts "🔐 [DEBUG] has_license? після активації: #{has_license?}"
              return {
                success: true,
                message: result['message'],
                user_license: result['user_license']
              }
            else
              puts "❌ [LicenseManager] Помилка реєстрації: #{result['error']}"
              return {
                success: false,
                error: result['error']
              }
            end
          else
            puts "❌ [LicenseManager] HTTP помилка: #{response.code}"
            return {
              success: false,
              error: "HTTP помилка: #{response.code}"
            }
          end
        rescue => e
          puts "❌ [LicenseManager] Помилка реєстрації: #{e.message}"
          return {
            success: false,
            error: e.message
          }
        end
      end
      
      # Отримання інформації про ліцензію для heartbeat
      def get_license_info_for_heartbeat
        if has_license?
          {
            email: @email,
            license_key: @license_key,
            hardware_id: @hardware_id
          }
        else
          nil
        end
      end
      
      # Отримання повної інформації про ліцензію (включаючи термін дії)
      def get_license_info_full
        if has_license?
          {
            email: @email,
            license_key: @license_key,
            hardware_id: @hardware_id,
            expires_at: @expires_at,
            days_remaining: calculate_days_remaining
          }
        else
          nil
        end
      end
      
      # Збереження ліцензії локально
      def save_license_locally(email, license_key, expires_at = nil)
        begin
          @email = email
          @license_key = license_key
          @expires_at = expires_at
          
          # Зберігаємо в Windows Registry
          save_to_registry(email, license_key, expires_at)
          puts "✅ [LicenseManager] Ліцензія збережена локально"
        rescue => e
          puts "❌ [LicenseManager] Помилка збереження: #{e.message}"
        end
      end
      
      # Завантаження збереженої ліцензії
      def load_saved_license
        begin
          data = load_from_registry
          if data && data[:email] && data[:license_key]
            @email = data[:email]
            @license_key = data[:license_key]
            @expires_at = data[:expires_at]
            puts "✅ [LicenseManager] Збережена ліцензія завантажена: #{@email}"
          else
            puts "ℹ️ [LicenseManager] Збережена ліцензія не знайдена"
          end
        rescue => e
          puts "❌ [LicenseManager] Помилка завантаження: #{e.message}"
        end
      end
      
      # Очищення збереженої ліцензії
      def clear_saved_license
        begin
          @email = nil
          @license_key = nil
          @expires_at = nil
          clear_registry
          puts "✅ [LicenseManager] Ліцензія очищена"
        rescue => e
          puts "❌ [LicenseManager] Помилка очищення: #{e.message}"
        end
      end
      
      # Розрахунок днів до закінчення
      def calculate_days_remaining
        return nil unless @expires_at && @expires_at.strip != ''
        
        begin
          expiry_date = Date.parse(@expires_at)
          remaining = (expiry_date - Date.today).to_i
          remaining > 0 ? remaining : 0
        rescue
          nil
        end
      end
      
      # Отримання інформації для відображення в UI
      def get_license_display_info
        if has_license?
          days_remaining = calculate_days_remaining
          {
            email: @email,
            license_key: @license_key,
            expires_at: @expires_at,
            days_remaining: days_remaining,
            status: days_remaining.nil? ? 'active' : (days_remaining > 0 ? 'active' : 'expired')
          }
        else
          {
            email: 'Не активована',
            license_key: '',
            expires_at: nil,
            days_remaining: nil,
            status: 'inactive'
          }
        end
      end
      
      private
      
      # Збереження в Windows Registry
      def save_to_registry(email, license_key, expires_at)
        begin
          require 'win32/registry'
          
          # Створюємо ключ реєстру якщо не існує
          Win32::Registry::HKEY_CURRENT_USER.create('Software\\ProGran3') do |reg|
            reg['Email', Win32::Registry::REG_SZ] = email
            reg['LicenseKey', Win32::Registry::REG_SZ] = license_key
            reg['ExpiresAt', Win32::Registry::REG_SZ] = expires_at.to_s if expires_at
            reg['HardwareId', Win32::Registry::REG_SZ] = @hardware_id
            reg['LastUpdated', Win32::Registry::REG_SZ] = Time.now.to_s
          end
          
          puts "✅ [LicenseManager] Ліцензія збережена в реєстрі"
        rescue => e
          puts "❌ [LicenseManager] Помилка збереження в реєстрі: #{e.message}"
        end
      end
      
      # Завантаження з Windows Registry
      def load_from_registry
        begin
          require 'win32/registry'
          
          Win32::Registry::HKEY_CURRENT_USER.open('Software\\ProGran3', Win32::Registry::KEY_READ) do |reg|
            email = reg['Email', Win32::Registry::REG_SZ] rescue nil
            license_key = reg['LicenseKey', Win32::Registry::REG_SZ] rescue nil
            expires_at = reg['ExpiresAt', Win32::Registry::REG_SZ] rescue nil
            
            if email && license_key
              {
                email: email,
                license_key: license_key,
                expires_at: expires_at
              }
            else
              nil
            end
          end
        rescue => e
          puts "❌ [LicenseManager] Помилка завантаження з реєстру: #{e.message}"
          nil
        end
      end
      
      # Очищення Windows Registry
      def clear_registry
        begin
          require 'win32/registry'
          
          Win32::Registry::HKEY_CURRENT_USER.open('Software\\ProGran3', Win32::Registry::KEY_WRITE) do |reg|
            reg.delete('Email') rescue nil
            reg.delete('LicenseKey') rescue nil
            reg.delete('ExpiresAt') rescue nil
            reg.delete('HardwareId') rescue nil
            reg.delete('LastUpdated') rescue nil
          end
          
          puts "✅ [LicenseManager] Реєстр очищено"
        rescue => e
          puts "❌ [LicenseManager] Помилка очищення реєстру: #{e.message}"
        end
      end
      
      # Збільшення offline лічильника
      def increment_offline_count
        @offline_count += 1
        puts "🔐 [LicenseManager] Offline лічильник: #{@offline_count}/#{@max_offline_hours}"
      end
      
      # Скидання offline лічильника
      def reset_offline_count
        @offline_count = 0
        puts "🔐 [LicenseManager] Offline лічильник скинуто"
      end
      
      # Валідація ліцензії (для heartbeat)
      public
      def validate_license
        if has_license?
          {
            valid: true,
            email: @email,
            license_key: @license_key,
            hardware_id: @hardware_id,
            offline_count: @offline_count
          }
        else
          {
            valid: false,
            error: 'No license registered'
          }
        end
      end
      
      # Перевірка чи показувати попередження про offline
      def should_show_offline_warning?
        @offline_count > (@max_offline_hours / 2) # Після 12 годин
      end
      
      # Перевірка чи блокувати плагін
      def should_block_plugin?
        @offline_count >= @max_offline_hours # Після 24 годин
      end
      
      # Очищення ліцензії
      def clear_license
        @email = nil
        @license_key = nil
        @offline_count = 0
        puts "🔐 [LicenseManager] Ліцензія очищена"
      end
      
      private
      
      # Генерація унікального hardware ID
      def get_hardware_id
        begin
          # Використовуємо hostname + username для стабільності
          hostname = Socket.gethostname.downcase.gsub(/[^a-z0-9]/, '-')
          username = ENV['USERNAME'] || ENV['USER'] || 'sketchup-user'
          "#{hostname}-#{username}".downcase
        rescue => e
          puts "⚠️ [LicenseManager] Помилка генерації hardware_id: #{e.message}"
          "unknown-hardware-#{Time.now.to_i}"
        end
      end
    end
  end
end
