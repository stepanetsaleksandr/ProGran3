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
        @email = nil
        @license_key = nil
        @hardware_id = get_hardware_id
        @offline_count = 0
        @max_offline_hours = 24
        @base_url = ENV['PROGRAN3_TRACKING_URL'] || 'https://progran3-tracking-server-dydv5vbld-provis3ds-projects.vercel.app'
        puts "🔐 [LicenseManager] Ініціалізовано нову систему без локального збереження"
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
              @email = email
              @license_key = license_key
              puts "✅ [LicenseManager] Ліцензія успішно зареєстрована"
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
      
      # Отримання інформації для відображення в UI
      def get_license_display_info
        if has_license?
          {
            email: @email,
            license_key: "#{@license_key[0..8]}...",
            hardware_id: @hardware_id,
            offline_count: @offline_count,
            max_offline_hours: @max_offline_hours
          }
        else
          {
            email: nil,
            license_key: nil,
            hardware_id: @hardware_id,
            offline_count: @offline_count,
            max_offline_hours: @max_offline_hours
          }
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
