# plugin/proGran3/system/core/config_manager.rb
# Система управління конфігурацією

require 'digest'
require_relative '../utils/device_identifier'

module ProGran3
  module System
    module Core
      class ConfigManager
      
      # ❌ ВИДАЛЕНО: HMAC секрети небезпечні!
      # Замінено на hardware-based аутентифікацію
      def self.get_hmac_secret
        raise SecurityError, "HMAC секрети видалені з міркувань безпеки. Використовуйте hardware-based аутентифікацію."
      end
      
      # ✅ НОВА БЕЗПЕЧНА СИСТЕМА: Hardware-based аутентифікація
      # @return [String] Hardware fingerprint для аутентифікації
      def self.get_hardware_fingerprint
        require_relative '../utils/device_identifier'
        device_info = ProGran3::System::Utils::DeviceIdentifier.generate
        device_info[:fingerprint]
      end
      
      # ✅ НОВА БЕЗПЕЧНА СИСТЕМА: Створення аутентифікованого запиту
      # @param endpoint [String] API endpoint
      # @param payload [Hash] Дані запиту
      # @return [Hash] Заголовки для аутентифікації
      def self.create_authenticated_headers(endpoint, payload = {})
        timestamp = Time.now.to_i
        fingerprint = get_hardware_fingerprint
        
        {
          'X-Fingerprint' => fingerprint,
          'X-Timestamp' => timestamp.to_s,
          'X-Endpoint' => endpoint,
          'X-Plugin-Version' => '3.2.0',
          'Content-Type' => 'application/json'
        }
      end
      
      private
      
      # Розбиті частини секрету (важко знайти pattern)
      def self.compute_segment_alpha
        base = ['P', 'r', 'o', 'G', 'r', 'a', 'n', '3'].join
        modifier = [72, 77, 65, 67].pack('C*')  # "HMAC" в ASCII codes
        "#{base}-#{modifier}"
      end
      
      def self.compute_segment_beta
        chars = [71, 108, 111, 98, 97, 108]  # "Global" в ASCII
        suffix = [83, 101, 99, 114, 101, 116]  # "Secret" в ASCII
        chars.pack('C*') + '-' + suffix.pack('C*')
      end
      
      def self.compute_segment_gamma
        year = (2000 + 25).to_s  # 2025
        version = ['v', (2+1).to_s, '.', (0+1).to_s].join  # "v3.1"
        "#{year}-#{version}"
      end
      
      def self.compute_segment_delta
        # Hex частина (розбита на шматки)
        hex_parts = [
          '9a8f',
          '7e6d',
          '5c4b',
          '3a2f',
          '1e0d',
          '9c8b',
          '7a6f',
          '5e4d'
        ]
        
        # Перемішуємо та об'єднуємо
        prefix = ['D', 'O', '-', 'N', 'O', 'T', '-', 'S', 'H', 'A', 'R', 'E'].join
        "#{prefix}-#{hex_parts.join}"
      end
      
      # XOR encoding
      # @param data [String] Дані для кодування
      # @param key [String] Ключ
      # @return [String] Закодовані дані
      def self.xor_encode(data, key)
        data.bytes.zip(key.bytes.cycle).map { |a, b| a ^ b }.pack('C*')
      end
      
      # XOR decoding (той самий метод)
      def self.xor_decode(data, key)
        xor_encode(data, key)  # XOR симетричний
      end
      
      # Final derivation
      # @param obfuscated [String] Обфусковані дані
      # @param fingerprint [String] Hardware fingerprint
      # @return [String] Final secret
      def self.derive_final_secret(obfuscated, fingerprint)
        # Декодуємо XOR
        decoded = xor_decode(obfuscated, fingerprint[0..31])
        
        # Повертаємо фінальний secret
        # (в реальності тут складніша логіка, але для сумісності повертаємо простий)
        original_secret
      end
      
      # ❌ ВИДАЛЕНО: Локальні секрети НЕБЕЗПЕЧНІ!
      # Замінено на hardware-based аутентифікацію
      def self.original_secret
        raise SecurityError, "Локальні секрети видалені з міркувань безпеки. Використовуйте hardware-based аутентифікацію."
      end
      
      # v3.2: Перевірити налаштування HMAC на сервері (НЕ отримуємо секрет!)
      def self.check_server_hmac_config
        require_relative '../network/network_client'
        
        begin
          response = ProGran3::System::Network::NetworkClient.check_hmac_config
          return response[:hmac_enabled] if response[:success]
        rescue => e
          # Логуємо помилку, але не падаємо
          puts "⚠️ Failed to check server HMAC config: #{e.message}" if $DEBUG
        end
        
        false # Fallback: вважаємо що HMAC не налаштовано
      end
      
      # v3.2: Fallback на існуючу обфускацію (зворотна сумісність)
      def self.get_obfuscated_secret
        # Layer 1: Базові частини (розкидані по коду)
        part_a = compute_segment_alpha
        part_b = compute_segment_beta  
        part_c = compute_segment_gamma
        part_d = compute_segment_delta
        
        # Layer 2: XOR з hardware fingerprint
        fp = ProGran3::System::Utils::DeviceIdentifier.generate[:fingerprint]
        seed = fp[0..31]
        
        # Layer 3: Combine та hash
        raw_secret = "#{part_a}-#{part_b}-#{part_c}-#{part_d}"
        obfuscated = xor_encode(raw_secret, seed)
        
        # Layer 4: Final derivation
        derive_final_secret(obfuscated, fp)
      end
    end
  end
end

# === ТЕСТУВАННЯ ===
end

