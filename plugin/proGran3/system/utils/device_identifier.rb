# plugin/proGran3/system/utils/device_identifier.rb
# Генерація унікального ідентифікатора пристрою для прив'язки сесії

require 'digest'
require 'socket'
require 'json'

module ProGran3
  module System
    module Utils
      class DeviceIdentifier
        
        # v3.1: Кеш для захисту від DoS (занадто часті генерації)
        @@fingerprint_cache = nil
        @@cache_timestamp = 0
        CACHE_TTL = 3600  # 1 година
        
        # Генерує унікальний ідентифікатор для цього пристрою
        # @return [Hash] { fingerprint: String, components: Hash, timestamp: Integer }
        def self.generate
          # v3.1: Повертаємо з кешу якщо свіжий (DoS protection)
          now = Time.now.to_i
          
          if @@fingerprint_cache && (now - @@cache_timestamp) < CACHE_TTL
            return @@fingerprint_cache
          end
          
          # Генеруємо новий ідентифікатор
          components = collect_hardware_components
          fingerprint_string = generate_fingerprint_string(components)
          
          result = {
            fingerprint: fingerprint_string,
            components: components,
            timestamp: now,
            version: '3.0'  # v3.0: Machine GUID + flexible validation
          }
          
          # Зберігаємо в кеш
          @@fingerprint_cache = result
          @@cache_timestamp = now
          
          result
        end
        
        # Перевірка чи ідентифікатор відповідає поточній системі
        # @param stored_fingerprint [String] Збережений ідентифікатор
        # @return [Boolean] true якщо збігається
        def self.matches?(stored_fingerprint)
          current = generate
          current[:fingerprint] == stored_fingerprint
        end
        
        # v3.0: Flexible validation - перевіряє чи достатньо компонентів збігається
        # @param stored_components [Hash] Збережені компоненти
        # @param current_components [Hash] Поточні компоненти
        # @return [Boolean] true якщо мінімум 3 з 4 компонентів збігаються
        def self.validate_flexible(stored_components, current_components)
          return false unless stored_components && current_components
          
          matches = 0
          total_components = 0
          
          # Перевіряємо кожен компонент
          stored_components.each do |key, stored_value|
            current_value = current_components[key]
            total_components += 1
            
            if stored_value && current_value && stored_value == current_value
              matches += 1
            end
          end
          
          # Потрібно мінімум 3 з 4 компонентів (75%)
          matches >= 3 && total_components >= 3
        end
        
        # Збирає компоненти апаратного забезпечення
        # @return [Hash] { machine_guid: String, cpu_id: String, motherboard: String, mac_address: String }
        def self.collect_hardware_components
          components = {}
          
          begin
            # 1. Machine GUID (Windows) - найважливіший компонент
            components[:machine_guid] = get_machine_guid
            
            # 2. CPU ID
            components[:cpu_id] = get_cpu_id
            
            # 3. Motherboard serial
            components[:motherboard] = get_motherboard_serial
            
            # 4. MAC address (перший активний)
            components[:mac_address] = get_mac_address
            
          rescue => e
            puts "⚠️ Помилка збору компонентів: #{e.message}"
          end
          
          components
        end
        
        # Генерує fingerprint string з компонентів
        # @param components [Hash]
        # @return [String] SHA256 hash
        def self.generate_fingerprint_string(components)
          # Сортуємо компоненти для консистентності
          sorted_components = components.sort.to_h
          
          # Створюємо рядок для хешування
          fingerprint_data = sorted_components.map { |k, v| "#{k}:#{v}" }.join('|')
          
          # Генеруємо SHA256 hash
          Digest::SHA256.hexdigest(fingerprint_data)
        end
        
        # Отримує Machine GUID (Windows)
        # @return [String, nil]
        def self.get_machine_guid
          return nil unless RUBY_PLATFORM =~ /mswin|mingw|cygwin/
          
          begin
            # Читаємо з реєстру Windows
            guid = `reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid 2>nul`.strip
            
            if guid && guid.include?('MachineGuid')
              # Витягуємо GUID з виводу
              guid_match = guid.match(/REG_SZ\s+(.+)/)
              return guid_match[1].strip if guid_match
            end
            
            nil
          rescue
            nil
          end
        end
        
        # Отримує CPU ID
        # @return [String, nil]
        def self.get_cpu_id
          begin
            if RUBY_PLATFORM =~ /mswin|mingw|cygwin/
              # Windows: wmic
              cpu_id = `wmic cpu get ProcessorId /value 2>nul`.strip
              cpu_match = cpu_id.match(/ProcessorId=(.+)/)
              return cpu_match[1].strip if cpu_match
            elsif RUBY_PLATFORM =~ /linux/
              # Linux: /proc/cpuinfo
              cpu_info = File.read('/proc/cpuinfo')
              cpu_match = cpu_info.match(/cpu serial\s*:\s*(.+)/i)
              return cpu_match[1].strip if cpu_match
            end
            
            nil
          rescue
            nil
          end
        end
        
        # Отримує serial материнської плати
        # @return [String, nil]
        def self.get_motherboard_serial
          begin
            if RUBY_PLATFORM =~ /mswin|mingw|cygwin/
              # Windows: wmic
              serial = `wmic baseboard get serialnumber /value 2>nul`.strip
              serial_match = serial.match(/SerialNumber=(.+)/)
              return serial_match[1].strip if serial_match
            elsif RUBY_PLATFORM =~ /linux/
              # Linux: dmidecode
              serial = `dmidecode -s baseboard-serial-number 2>/dev/null`.strip
              return serial unless serial.empty?
            end
            
            nil
          rescue
            nil
          end
        end
        
        # Отримує MAC address першого активного мережевого інтерфейсу
        # @return [String, nil]
        def self.get_mac_address
          begin
            # Отримуємо всі мережеві інтерфейси
            interfaces = Socket.getifaddrs
            
            # Шукаємо перший активний інтерфейс з MAC
            interfaces.each do |interface|
              next unless interface.addr
              next if interface.addr.ipv4_loopback? || interface.addr.ipv6_loopback?
              
              # Отримуємо MAC address
              mac = interface.addr.mac_address
              return mac if mac && mac != '00:00:00:00:00:00'
            end
            
            nil
          rescue
            nil
          end
        end
        
        # Debug інформація про компоненти
        # @return [Hash]
        def self.debug_info
          components = collect_hardware_components
          
          puts "\n🔍 Debug інформація про компоненти:"
          puts "   Machine GUID: #{components[:machine_guid] ? '✅' : '❌'}"
          puts "   CPU ID: #{components[:cpu_id] ? '✅' : '❌'}"
          puts "   Motherboard: #{components[:motherboard] ? '✅' : '❌'}"
          puts "   MAC Address: #{components[:mac_address] ? '✅' : '❌'}"
          
          components
        end
        
        # Очищує кеш (для тестування)
        def self.clear_cache
          @@fingerprint_cache = nil
          @@cache_timestamp = 0
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
    HardwareFingerprint = System::Utils::DeviceIdentifier
  end
end

# === ТЕСТУВАННЯ ===
if __FILE__ == $0
  puts "🧪 Базове тестування Device Identifier..."
  
  # Тест 1: Генерація ідентифікатора
  puts "\n📝 Тест 1: Генерація ідентифікатора..."
  fp = ProGran3::System::Utils::DeviceIdentifier.generate
  
  puts "   Fingerprint: #{fp[:fingerprint][0..16]}..."
  puts "   Version: #{fp[:version]}"
  puts "   Components: #{fp[:components].keys.join(', ')}"
  
  # Тест 2: Перевірка збігу
  puts "\n📝 Тест 2: Перевірка збігу..."
  matches = ProGran3::System::Utils::DeviceIdentifier.matches?(fp[:fingerprint])
  puts "   #{matches ? '✅ ЗБІГАЄТЬСЯ' : '❌ НЕ ЗБІГАЄТЬСЯ'}"
  
  # Тест 3: Flexible validation
  puts "\n📝 Тест 3: Flexible validation..."
  current_components = fp[:components]
  stored_components = current_components.dup
  
  # Симулюємо зміну одного компонента
  stored_components[:mac_address] = 'different_mac'
  
  flexible_valid = ProGran3::System::Utils::DeviceIdentifier.validate_flexible(
    stored_components, current_components
  )
  puts "   #{flexible_valid ? '✅ FLEXIBLE VALID' : '❌ FLEXIBLE INVALID'}"
  
  # Тест 4: Debug інформація
  puts "\n📝 Тест 4: Debug інформація..."
  ProGran3::System::Utils::DeviceIdentifier.debug_info
  
  puts "\n✅ Базове тестування завершено"
end
