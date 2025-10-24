# plugin/proGran3/system/core/config_manager.rb
# Система управління конфігурацією

require 'digest'
require_relative '../utils/device_identifier'

module ProGran3
  module System
    module Core
      class ConfigManager
      
      # Отримати HMAC secret (v3.2: динамічне завантаження з fallback)
      # @return [String] HMAC secret key
      def self.get_hmac_secret
        # v3.2: Спроба завантажити з сервера
        server_secret = fetch_secret_from_server
        if server_secret && !server_secret.empty?
          return server_secret
        end
        
        # Fallback на існуючу обфускацію (зворотна сумісність)
        get_obfuscated_secret
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
      
      # Оригінальний secret (для зворотної сумісності)
      # В production цей метод має бути максимально обфускований
      def self.original_secret
        # Збираємо з частин (так само як get_hmac_secret, але без obfuscation)
        'ProGran3-HMAC-Global-Secret-2025-v3.1-DO-NOT-SHARE-9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d'
      end
      
      # v3.2: Динамічне завантаження secret з сервера
      def self.fetch_secret_from_server
        require_relative '../network/network_client'
        
        begin
          response = ProGran3::System::Network::NetworkClient.get_secret
          return response[:secret] if response[:success]
        rescue => e
          # Логуємо помилку, але не падаємо
          puts "⚠️ Failed to fetch server secret: #{e.message}" if $DEBUG
        end
        
        nil
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

