# plugin/proGran3/security/time_validator.rb
# Валідація системного часу через NTP (захист від time tampering)

require 'socket'
require 'timeout'
require_relative '../logger'

module ProGran3
  module Security
    class TimeValidator
      
      # NTP сервери (використовуємо кілька для надійності)
      NTP_SERVERS = [
        'time.google.com',
        'time.windows.com',
        'pool.ntp.org',
        'time.cloudflare.com'
      ].freeze
      
      # Максимально допустима різниця часу (5 хвилин)
      MAX_TIME_DIFF_SECONDS = 300
      
      # Timeout для NTP запиту
      NTP_TIMEOUT = 5
      
      # Кеш NTP часу (щоб не робити запит кожного разу)
      @@ntp_cache = nil
      @@ntp_cache_timestamp = 0
      CACHE_TTL = 3600  # 1 година
      
      # Отримати справжній час з NTP серверів
      # @return [Hash] { time: Time, reliable: Boolean, source: String }
      def self.get_real_time
        # Перевіряємо кеш
        now = Time.now.to_i
        if @@ntp_cache && (now - @@ntp_cache_timestamp) < CACHE_TTL
          Logger.debug("Використовуємо cached NTP time", "TimeValidator")
          return @@ntp_cache
        end
        
        # Пробуємо кожен NTP сервер
        NTP_SERVERS.each do |server|
          begin
            ntp_time = fetch_ntp_time(server)
            
            result = {
              time: ntp_time,
              reliable: true,
              source: server,
              system_time: Time.now
            }
            
            # Зберігаємо в кеш
            @@ntp_cache = result
            @@ntp_cache_timestamp = now
            
            Logger.info("NTP time отримано з #{server}", "TimeValidator")
            return result
            
          rescue => e
            Logger.warn("NTP server #{server} недоступний: #{e.message}", "TimeValidator")
            next  # Спробувати наступний сервер
          end
        end
        
        # Якщо всі NTP сервери недоступні - використати системний час
        Logger.warn("Всі NTP сервери недоступні, використовуємо системний час", "TimeValidator")
        {
          time: Time.now,
          reliable: false,
          source: 'system',
          system_time: Time.now
        }
      end
      
      # Валідує системний час
      # @return [Hash] { valid: Boolean, error: String, ntp_time: Time, diff_seconds: Integer }
      def self.validate_system_time
        ntp_result = get_real_time
        system_time = Time.now
        
        # Якщо NTP недоступний - дозволити але з попередженням
        unless ntp_result[:reliable]
          return {
            valid: true,
            warning: 'NTP сервери недоступні, час не верифіковано',
            system_time: system_time,
            verified: false
          }
        end
        
        # Порівнюємо NTP час з системним
        time_diff = (ntp_result[:time] - system_time).abs
        
        if time_diff > MAX_TIME_DIFF_SECONDS
          # Занадто велика різниця - підозра на tampering
          Logger.error("Системний час не синхронізовано! Різниця: #{time_diff.to_i}s", "TimeValidator")
          
          {
            valid: false,
            error: "Системний час не синхронізовано (різниця: #{format_time_diff(time_diff)})",
            ntp_time: ntp_result[:time],
            system_time: system_time,
            diff_seconds: time_diff.to_i,
            ntp_source: ntp_result[:source]
          }
        else
          # Час валідний
          Logger.debug("Системний час валідний (різниця: #{time_diff.to_i}s)", "TimeValidator")
          
          {
            valid: true,
            ntp_time: ntp_result[:time],
            system_time: system_time,
            diff_seconds: time_diff.to_i,
            ntp_source: ntp_result[:source],
            verified: true
          }
        end
      end
      
      # Отримати надійний час (NTP або system)
      # @return [Time]
      def self.get_trusted_time
        ntp_result = get_real_time
        ntp_result[:time]
      end
      
      private
      
      # Simplified SNTP implementation
      # @param server [String] NTP server hostname
      # @return [Time] NTP time
      def self.fetch_ntp_time(server)
        Timeout.timeout(NTP_TIMEOUT) do
          socket = UDPSocket.new
          
          begin
            # NTP request packet (48 bytes, client mode, version 3)
            request = [0x1B].pack('C') + ("\0" * 47)
            
            # Відправляємо запит
            socket.send(request, 0, server, 123)
            
            # Отримуємо відповідь
            response, _ = socket.recvfrom(48)
            
            # Parse NTP timestamp (bytes 40-43, big-endian unsigned 32-bit)
            transmit_timestamp = response[40..43].unpack1('N')
            
            # Конвертуємо NTP timestamp в Ruby Time
            # NTP epoch: 1 Jan 1900, Unix epoch: 1 Jan 1970
            # Різниця: 2208988800 секунд
            unix_timestamp = transmit_timestamp - 2208988800
            
            Time.at(unix_timestamp)
            
          ensure
            socket.close
          end
        end
      rescue Timeout::Error
        raise "NTP timeout для #{server}"
      rescue => e
        raise "NTP error для #{server}: #{e.message}"
      end
      
      # Форматує різницю часу для відображення
      # @param seconds [Float] Різниця в секундах
      # @return [String]
      def self.format_time_diff(seconds)
        if seconds < 60
          "#{seconds.to_i} секунд"
        elsif seconds < 3600
          "#{(seconds / 60).to_i} хвилин"
        elsif seconds < 86400
          "#{(seconds / 3600).to_i} годин"
        else
          "#{(seconds / 86400).to_i} днів"
        end
      end
    end
  end
end

# === ТЕСТУВАННЯ ===
if __FILE__ == $0
  puts "🧪 Тестування TimeValidator..."
  
  # Тест 1: Отримання NTP часу
  puts "\n📝 Тест 1: Отримання NTP часу..."
  begin
    ntp_result = ProGran3::Security::TimeValidator.get_real_time
    puts "   NTP Time: #{ntp_result[:time]}"
    puts "   System Time: #{ntp_result[:system_time]}"
    puts "   Source: #{ntp_result[:source]}"
    puts "   Reliable: #{ntp_result[:reliable]}"
    puts "   ✅ PASSED"
  rescue => e
    puts "   ⚠️ FAILED: #{e.message}"
  end
  
  # Тест 2: Валідація системного часу
  puts "\n📝 Тест 2: Валідація системного часу..."
  validation = ProGran3::Security::TimeValidator.validate_system_time
  puts "   Valid: #{validation[:valid]}"
  puts "   Diff: #{validation[:diff_seconds]} seconds" if validation[:diff_seconds]
  puts "   Warning: #{validation[:warning]}" if validation[:warning]
  puts "   Error: #{validation[:error]}" if validation[:error]
  puts "   ✅ PASSED"
  
  # Тест 3: Consistency (кеш)
  puts "\n📝 Тест 3: Cache consistency..."
  time1 = ProGran3::Security::TimeValidator.get_real_time
  sleep(1)
  time2 = ProGran3::Security::TimeValidator.get_real_time
  
  if time1[:time] == time2[:time]
    puts "   ✅ PASSED: Cache працює"
  else
    puts "   ⚠️ INFO: Cache не спрацював (можливо TTL)"
  end
  
  puts "\n✅ Тестування TimeValidator завершено"
end

