# plugin/proGran3/system/utils/device_identifier.rb
# Система ідентифікації пристрою

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
      
      # Генерує унікальний fingerprint для цього комп'ютера
      # @return [Hash] { fingerprint: String, components: Hash, timestamp: Integer }
      def self.generate
        # v3.1: Повертаємо з кешу якщо свіжий (DoS protection)
        now = Time.now.to_i
        
        if @@fingerprint_cache && (now - @@cache_timestamp) < CACHE_TTL
          return @@fingerprint_cache
        end
        
        # Генеруємо новий fingerprint
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
      
      # Перевірка чи fingerprint відповідає поточній системі
      # @param stored_fingerprint [String] Збережений fingerprint
      # @return [Boolean] true якщо збігається
      def self.matches?(stored_fingerprint)
        current = generate
        current[:fingerprint] == stored_fingerprint
      end
      
      # Flexible validation: перевіряє чи достатньо компонентів збігається
      # @param stored_components [Hash] Збережені компоненти
      # @param current_components [Hash] Поточні компоненти
      # @return [Boolean] true якщо мінімум 3 з 4 критичних компонентів збігаються
      def self.validate_flexible(stored_components, current_components = nil)
        current_components ||= collect_hardware_components
        
        # === v3.1: Machine GUID ЗАВЖДИ має збігатися (не flexible!) ===
        # Це найстабільніший компонент - не можна змінити без переустановки Windows
        if stored_components[:machine_guid] && current_components[:machine_guid]
          return false if stored_components[:machine_guid] != current_components[:machine_guid]
        end
        
        # Інші критичні компоненти (flexible: 2 з 3)
        other_keys = [:volume_serial, :bios_serial, :mac_address]
        
        matches = 0
        valid_comparisons = 0  # Скільки компонентів можна порівняти
        
        other_keys.each do |key|
          stored_val = stored_components[key]
          current_val = current_components[key]
          
          # Пропускаємо якщо хоч один 'unknown'
          next if !stored_val || !current_val || 
                  stored_val.to_s.include?('unknown') || 
                  current_val.to_s.include?('unknown')
          
          valid_comparisons += 1
          matches += 1 if stored_val == current_val
        end
        
        # Якщо < 2 компонентів для порівняння - не можемо валідувати
        return false if valid_comparisons < 2
        
        # Мінімум 2 з 3 додаткових компонентів має збігатися
        matches >= 2
      end
      
      private
      
      # Збирає компоненти апаратного забезпечення (v3.0: апаратні + системні)
      def self.collect_hardware_components
        components = {}
        
        # Визначаємо платформу
        is_windows = RUBY_PLATFORM.include?('mingw') || RUBY_PLATFORM.include?('mswin')
        
        if is_windows
          # === РІВЕНЬ 1: КРИТИЧНІ (апаратні, дуже складно змінити) ===
          
          # Machine GUID - найстабільніший ідентифікатор Windows!
          components[:machine_guid] = get_machine_guid_windows
          
          # Volume Serial Number - серійний номер диску C:
          components[:volume_serial] = get_volume_serial_windows
          
          # === РІВЕНЬ 2: ВАЖЛИВІ (апаратні через WMI, якщо доступні) ===
          
          # BIOS Serial - серійний номер BIOS
          components[:bios_serial] = get_bios_serial_windows
          
          # MAC Address - фізична мережева карта
          components[:mac_address] = get_mac_address_windows
          
          # === РІВЕНЬ 3: ДОДАТКОВІ (ENV змінні, легко змінити) ===
          
          components[:computername] = ENV['COMPUTERNAME'] || 'unknown_computer'
          components[:username] = ENV['USERNAME'] || ENV['USER'] || 'unknown_user'
          components[:hostname] = get_hostname
          
        else
          # Unix/Mac: використовуємо доступні методи
          components[:hostname] = get_hostname
          components[:username] = ENV['USER'] || 'unknown_user'
          components[:computername] = get_hostname
          
          # Намагаємось отримати MAC на Unix
          components[:mac_address] = get_mac_address_unix
        end
        
        # ВИДАЛЕНО: platform і ruby_version (не є апаратними характеристиками)
        # Вони можуть змінюватися між SketchUp Ruby та системним Ruby
        
        components
      end
      
      # Генерує SHA256 hash з компонентів
      def self.generate_fingerprint_string(components)
        # Сортуємо ключі для консистентності
        data_string = components.sort.to_h.to_json
        Digest::SHA256.hexdigest(data_string)
      end
      
      # === Методи отримання даних БЕЗ зовнішніх команд ===
      
      # Отримує Machine GUID з Registry (Windows)
      # Це найстабільніший ідентифікатор - не змінюється навіть при переустановці Windows
      def self.get_machine_guid_windows
        begin
          require 'win32/registry'
          Win32::Registry::HKEY_LOCAL_MACHINE.open('SOFTWARE\\Microsoft\\Cryptography') do |reg|
            return reg['MachineGuid']
          end
        rescue LoadError, Win32::Registry::Error => e
          return 'unknown_machine_guid'
        end
      end
      
      # Отримує Volume Serial Number через Win32API (без консольних вікон!)
      def self.get_volume_serial_windows
        begin
          require 'fiddle'
          
          # Використовуємо Fiddle для виклику Windows API
          kernel32 = Fiddle.dlopen('kernel32.dll')
          get_volume_info = Fiddle::Function.new(
            kernel32['GetVolumeInformationA'],
            [Fiddle::TYPE_VOIDP, Fiddle::TYPE_VOIDP, Fiddle::TYPE_INT, 
             Fiddle::TYPE_VOIDP, Fiddle::TYPE_VOIDP, Fiddle::TYPE_VOIDP, 
             Fiddle::TYPE_VOIDP, Fiddle::TYPE_INT],
            Fiddle::TYPE_INT
          )
          
          # Правильне виділення пам'яті для DWORD (4 bytes)
          serial_ptr = Fiddle::Pointer.malloc(Fiddle::SIZEOF_INT, Fiddle::RUBY_FREE)
          root_path = Fiddle::Pointer['C:\\']
          
          result = get_volume_info.call(root_path, nil, 0, serial_ptr, nil, nil, nil, 0)
          
          if result != 0
            # Правильне читання DWORD з pointer
            serial_bytes = serial_ptr[0, 4]
            serial_number = serial_bytes.unpack1('L')  # unsigned long (DWORD)
            
            return serial_number.to_s(16).upcase if serial_number > 0
          end
          
          'unknown_volume_serial'
        rescue LoadError, NameError, Fiddle::DLError => e
          # Fiddle не доступний або помилка виклику
          'unknown_volume_serial'
        end
      end
      
      # Отримує BIOS Serial через WMI (без консольних вікон!)
      def self.get_bios_serial_windows
        begin
          require 'win32ole'
          
          wmi = WIN32OLE.connect("winmgmts://")
          bios_query = wmi.ExecQuery("SELECT SerialNumber FROM Win32_BIOS")
          
          # Список дефолтних/неунікальних серійних номерів BIOS
          invalid_serials = [
            'To be filled by O.E.M.',
            'System Serial Number',
            'Default string',
            'Not Specified',
            'Not Applicable',
            'None',
            'N/A',
            '0',
            '1',
            '123456789'
          ]
          
          bios_query.each do |bios|
            serial = bios.SerialNumber
            
            # Перевіряємо що serial не пустий і не дефолтний
            if serial && !serial.empty? && !invalid_serials.include?(serial.strip)
              return serial.strip
            end
          end
          
          'unknown_bios_serial'
        rescue LoadError, WIN32OLERuntimeError => e
          # WIN32OLE не доступний або помилка WMI
          'unknown_bios_serial'
        end
      end
      
      # Отримує MAC Address через WMI (без консольних вікон!)
      def self.get_mac_address_windows
        begin
          require 'win32ole'
          
          wmi = WIN32OLE.connect("winmgmts://")
          adapter_query = wmi.ExecQuery("SELECT MACAddress FROM Win32_NetworkAdapter WHERE PhysicalAdapter=True AND MACAddress IS NOT NULL")
          
          adapter_query.each do |adapter|
            mac = adapter.MACAddress
            return mac if mac && !mac.empty?
          end
          
          'unknown_mac_address'
        rescue LoadError, WIN32OLERuntimeError => e
          # WIN32OLE не доступний або помилка WMI
          'unknown_mac_address'
        end
      end
      
      # Отримує MAC Address на Unix/Mac
      def self.get_mac_address_unix
        begin
          # Пробуємо через ifconfig
          output = `ifconfig 2>/dev/null`.encode('UTF-8', invalid: :replace, undef: :replace)
          mac = output.scan(/([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}/).first
          return mac.join if mac
          
          'unknown_mac_address'
        rescue => e
          'unknown_mac_address'
        end
      end
      
      # Отримує hostname системи
      def self.get_hostname
        begin
          Socket.gethostname.downcase
        rescue => e
          'unknown_host'
        end
      end
      
      # === Utility методи для діагностики ===
      
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
end


