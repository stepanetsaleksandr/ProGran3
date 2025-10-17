# plugin/proGran3/security/hardware_fingerprint.rb
# Генерація унікального відбитку апаратного забезпечення для прив'язки ліцензії

require 'digest'
require 'socket'

module ProGran3
  module Security
    class HardwareFingerprint
      
      # Генерує унікальний fingerprint для цього комп'ютера
      # @return [Hash] { fingerprint: String, components: Hash, timestamp: Integer }
      def self.generate
        components = collect_hardware_components
        fingerprint_string = generate_fingerprint_string(components)
        
        {
          fingerprint: fingerprint_string,
          components: components,
          timestamp: Time.now.to_i,
          version: '1.0'
        }
      end
      
      # Перевірка чи fingerprint відповідає поточній системі
      # @param stored_fingerprint [String] Збережений fingerprint
      # @return [Boolean] true якщо збігається
      def self.matches?(stored_fingerprint)
        current = generate
        current[:fingerprint] == stored_fingerprint
      end
      
      private
      
      # Збирає компоненти апаратного забезпечення
      def self.collect_hardware_components
        components = {}
        
        # Визначаємо платформу
        is_windows = RUBY_PLATFORM.include?('mingw') || RUBY_PLATFORM.include?('mswin')
        
        if is_windows
          components[:motherboard] = get_motherboard_serial_windows
          components[:cpu] = get_cpu_id_windows
          components[:mac] = get_primary_mac_windows
          components[:disk] = get_disk_serial_windows
        else
          # Fallback для інших ОС
          components[:motherboard] = 'unix_system'
          components[:cpu] = 'unix_cpu'
          components[:mac] = get_mac_address_unix
          components[:disk] = 'unix_disk'
        end
        
        # Додаткові ідентифікатори (менш стабільні, але корисні)
        components[:hostname] = get_hostname
        components[:platform] = RUBY_PLATFORM
        
        components
      end
      
      # Генерує SHA256 hash з компонентів
      def self.generate_fingerprint_string(components)
        # Сортуємо ключі для консистентності
        data_string = components.sort.to_h.to_json
        Digest::SHA256.hexdigest(data_string)
      end
      
      # === Windows specific methods ===
      
      def self.get_motherboard_serial_windows
        begin
          result = `wmic baseboard get serialnumber /value 2>nul`.encode('UTF-8', invalid: :replace, undef: :replace)
          serial = result.scan(/SerialNumber=(.+)/).flatten.first&.strip
          
          # Фільтруємо дефолтні значення від виробників
          if serial && !serial.empty? && 
             serial != 'To be filled by O.E.M.' && 
             serial != 'Default string' &&
             serial != 'System Serial Number'
            return serial
          end
        rescue => e
          puts "⚠️ Помилка отримання motherboard serial: #{e.message}"
        end
        
        'unknown_mb'
      end
      
      def self.get_cpu_id_windows
        begin
          result = `wmic cpu get processorid /value 2>nul`.encode('UTF-8', invalid: :replace, undef: :replace)
          cpu_id = result.scan(/ProcessorId=(.+)/).flatten.first&.strip
          
          return cpu_id if cpu_id && !cpu_id.empty?
        rescue => e
          puts "⚠️ Помилка отримання CPU ID: #{e.message}"
        end
        
        'unknown_cpu'
      end
      
      def self.get_primary_mac_windows
        begin
          result = `getmac /v /fo csv 2>nul`.encode('UTF-8', invalid: :replace, undef: :replace)
          
          # Витягуємо всі MAC адреси
          macs = result.scan(/"([A-F0-9]{2}-[A-F0-9]{2}-[A-F0-9]{2}-[A-F0-9]{2}-[A-F0-9]{2}-[A-F0-9]{2})"/).flatten
          
          # Фільтруємо віртуальні адаптери
          physical_macs = macs.reject { |mac| is_virtual_mac?(mac) }
          
          # Повертаємо перший фізичний MAC
          return physical_macs.first if physical_macs.any?
        rescue => e
          puts "⚠️ Помилка отримання MAC адреси: #{e.message}"
        end
        
        'unknown_mac'
      end
      
      def self.get_disk_serial_windows
        begin
          result = `wmic diskdrive get serialnumber /value 2>nul`.encode('UTF-8', invalid: :replace, undef: :replace)
          serials = result.scan(/SerialNumber=(.+)/).flatten.map(&:strip)
          
          # Беремо перший непустий serial
          serial = serials.find { |s| s && !s.empty? }
          
          return serial if serial
        rescue => e
          puts "⚠️ Помилка отримання disk serial: #{e.message}"
        end
        
        'unknown_disk'
      end
      
      # Перевірка чи MAC адреса віртуальна
      def self.is_virtual_mac?(mac)
        virtual_prefixes = [
          '00-05-69', '00-0C-29', '00-1C-14', '00-50-56', # VMware
          '08-00-27', '0A-00-27',                         # VirtualBox
          '00-15-5D',                                      # Hyper-V
          '00-16-3E',                                      # Xen
          '00-FF-'                                         # Microsoft Loopback
        ]
        
        mac_upper = mac.upcase
        virtual_prefixes.any? { |prefix| mac_upper.start_with?(prefix) }
      end
      
      # === Unix/Mac specific methods ===
      
      def self.get_mac_address_unix
        begin
          # Спробувати ifconfig або ip
          result = `ifconfig 2>/dev/null || ip addr 2>/dev/null`
          macs = result.scan(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/)
          return macs.first.join if macs.any?
        rescue => e
          puts "⚠️ Помилка отримання MAC (Unix): #{e.message}"
        end
        
        'unknown_mac_unix'
      end
      
      # === Common methods ===
      
      def self.get_hostname
        begin
          Socket.gethostname.downcase
        rescue => e
          puts "⚠️ Помилка отримання hostname: #{e.message}"
          'unknown_host'
        end
      end
      
      # === Utility methods ===
      
      # Вивести детальну інформацію про fingerprint (для дебагу)
      def self.debug_info
        fp_data = generate
        
        puts "\n" + "="*60
        puts "🔍 Hardware Fingerprint Debug Info"
        puts "="*60
        
        puts "\n📋 Компоненти:"
        fp_data[:components].each do |key, value|
          puts "  #{key.to_s.ljust(15)}: #{value}"
        end
        
        puts "\n🔐 Fingerprint:"
        puts "  #{fp_data[:fingerprint]}"
        
        puts "\n⏰ Timestamp:"
        puts "  #{Time.at(fp_data[:timestamp])}"
        
        puts "\n📊 Версія:"
        puts "  #{fp_data[:version]}"
        
        puts "="*60 + "\n"
        
        fp_data
      end
      
      # Експорт для збереження
      def self.to_json
        require 'json'
        generate.to_json
      end
    end
  end
end

# === ТЕСТУВАННЯ (розкоментуйте для тесту) ===
if __FILE__ == $0
  puts "🧪 Тестування Hardware Fingerprint..."
  
  # Генерація fingerprint
  fp = ProGran3::Security::HardwareFingerprint.generate
  
  puts "\n✅ Fingerprint згенеровано:"
  puts "   #{fp[:fingerprint]}"
  
  puts "\n📋 Компоненти:"
  fp[:components].each do |key, value|
    puts "   #{key}: #{value}"
  end
  
  # Тест співпадіння
  puts "\n🔍 Тест співпадіння..."
  matches = ProGran3::Security::HardwareFingerprint.matches?(fp[:fingerprint])
  puts "   #{matches ? '✅ ЗБІГАЄТЬСЯ' : '❌ НЕ ЗБІГАЄТЬСЯ'}"
  
  # Debug info
  puts "\n🐛 Debug інформація:"
  ProGran3::Security::HardwareFingerprint.debug_info
end


