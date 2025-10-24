# plugin/proGran3/system/utils/time_sync.rb
# Синхронізація системного часу через NTP (захист від time tampering)

require 'socket'
require 'timeout'
require_relative '../../logger'

module ProGran3
  module System
    module Utils
      class TimeSync
        
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
            Logger.debug("Використовуємо cached NTP time", "TimeSync")
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
              
              Logger.debug("NTP time отримано з #{server}", "TimeSync")
              return result
              
            rescue => e
              Logger.debug("NTP сервер #{server} недоступний: #{e.message}", "TimeSync")
              next
            end
          end
          
          # Всі NTP сервери недоступні
          Logger.warn("Всі NTP сервери недоступні", "TimeSync")
          {
            time: Time.now,
            reliable: false,
            source: 'system',
            system_time: Time.now
          }
        end
        
        # Валідація системного часу
        # @return [Hash] { valid: Boolean, ntp_time: Time, diff_seconds: Integer, error: String }
        def self.validate_system_time
          begin
            ntp_result = get_real_time
            ntp_time = ntp_result[:time]
            system_time = Time.now
            
            # Розрахунок різниці
            diff_seconds = (ntp_time - system_time).abs
            
            if ntp_result[:reliable]
              if diff_seconds <= MAX_TIME_DIFF_SECONDS
                {
                  valid: true,
                  ntp_time: ntp_time,
                  diff_seconds: diff_seconds,
                  verified: true
                }
              else
                {
                  valid: false,
                  ntp_time: ntp_time,
                  diff_seconds: diff_seconds,
                  error: "Системний час відрізняється на #{diff_seconds} секунд (максимум #{MAX_TIME_DIFF_SECONDS})",
                  verified: true
                }
              end
            else
              {
                valid: true,  # Якщо NTP недоступний - не блокуємо
                ntp_time: ntp_time,
                diff_seconds: diff_seconds,
                verified: false,
                warning: "NTP недоступний - використовується системний час"
              }
            end
            
          rescue => e
            Logger.error("Помилка валідації часу: #{e.message}", "TimeSync")
            {
              valid: true,  # При помилці не блокуємо
              ntp_time: Time.now,
              diff_seconds: 0,
              verified: false,
              error: e.message
            }
          end
        end
        
        # Отримати час з конкретного NTP сервера
        # @param server [String] NTP сервер
        # @return [Time] NTP час
        def self.fetch_ntp_time(server)
          Timeout.timeout(NTP_TIMEOUT) do
            # Простий NTP клієнт
            socket = UDPSocket.new
            socket.connect(server, 123)
            
            # NTP packet (48 bytes)
            ntp_packet = [0x1b] + [0] * 47
            socket.send(ntp_packet.pack('C*'), 0)
            
            # Отримуємо відповідь
            response = socket.recv(48)
            socket.close
            
            # Парсимо NTP timestamp (байт 40-43)
            timestamp = response[40, 4].unpack('N')[0]
            
            # Конвертуємо в Time (NTP epoch: 1900, Unix epoch: 1970)
            ntp_time = Time.at(timestamp - 2208988800)
            
            ntp_time
          end
        end
        
        # Очистити кеш (для тестування)
        def self.clear_cache
          @@ntp_cache = nil
          @@ntp_cache_timestamp = 0
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
    TimeValidator = System::Utils::TimeSync
  end
end

# === ТЕСТУВАННЯ ===
if __FILE__ == $0
  puts "🧪 Базове тестування Time Sync..."
  
  # Тест 1: Отримання NTP часу
  puts "\n📝 Тест 1: Отримання NTP часу..."
  ntp_result = ProGran3::System::Utils::TimeSync.get_real_time
  puts "   NTP Time: #{ntp_result[:time]}"
  puts "   Source: #{ntp_result[:source]}"
  puts "   Reliable: #{ntp_result[:reliable]}"
  
  # Тест 2: Валідація системного часу
  puts "\n📝 Тест 2: Валідація системного часу..."
  validation = ProGran3::System::Utils::TimeSync.validate_system_time
  puts "   Valid: #{validation[:valid]}"
  puts "   Diff: #{validation[:diff_seconds]} seconds"
  puts "   Verified: #{validation[:verified]}"
  
  # Тест 3: Cache consistency
  puts "\n📝 Тест 3: Cache consistency..."
  time1 = ProGran3::System::Utils::TimeSync.get_real_time
  sleep(1)
  time2 = ProGran3::System::Utils::TimeSync.get_real_time
  
  if time1[:time] == time2[:time]
    puts "   ✅ PASSED: Cache working"
  else
    puts "   ❌ FAILED: Cache not working"
  end
  
  puts "\n✅ Базове тестування завершено"
end
