# plugin/proGran3/system/core/config_manager.rb
# Захист конфігураційних ключів через multi-layer obfuscation

require 'digest'
require_relative '../utils/device_identifier'

module ProGran3
  module System
    module Core
      class ConfigManager
        
        # Отримати HMAC secret (обфусковано)
        # @return [String] HMAC secret key
        def self.get_hmac_secret
          # Layer 1: Базові частини (розкидані по коду)
          part_a = compute_segment_alpha
          part_b = compute_segment_beta  
          part_c = compute_segment_gamma
          part_d = compute_segment_delta
          
          # Layer 2: XOR з hardware fingerprint
          fp = System::Utils::DeviceIdentifier.generate[:fingerprint]
          seed = fp[0..31]
          
          # Layer 3: Combine та hash
          raw_secret = "#{part_a}-#{part_b}-#{part_c}-#{part_d}"
          obfuscated = xor_encode(raw_secret, seed)
          
          # Layer 4: Final derivation
          derive_final_secret(obfuscated, fp)
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
          prefix = [68, 79, 45, 78, 79, 84, 45, 83, 72, 65, 82, 69].pack('C*')  # "DO-NOT-SHARE"
          suffix = [57, 97, 56, 102, 55, 101, 54, 100, 53, 99, 52, 98, 51, 97, 50, 102, 49, 101, 48, 100, 57, 99, 56, 98, 55, 97, 54, 102, 53, 101, 52, 100].pack('C*')
          "#{prefix}-#{suffix}"
        end
        
        # XOR encoding з seed
        def self.xor_encode(data, seed)
          result = ''
          seed_bytes = seed.bytes
          data.bytes.each_with_index do |byte, index|
            seed_byte = seed_bytes[index % seed_bytes.length]
            result += (byte ^ seed_byte).chr
          end
          result
        end
        
        # Final derivation з fingerprint
        def self.derive_final_secret(obfuscated, fingerprint)
          # Використовуємо fingerprint як salt
          salt = fingerprint[0..15]
          Digest::SHA256.hexdigest(obfuscated + salt)
        end
        
        # Оригінальний secret (для тестування)
        def self.original_secret
          # Збираємо з частин (так само як get_hmac_secret, але без obfuscation)
          'ProGran3-HMAC-Global-Secret-2025-v3.1-DO-NOT-SHARE-9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d'
        end
        
        # Отримати secret з сервера (майбутня функція)
        def self.get_remote_secret
          # TODO: Реалізувати якщо потрібно
          # GET /api/client/get-hmac-secret з fingerprint verification
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
    SecretManager = System::Core::ConfigManager
  end
end

# === ТЕСТУВАННЯ ===
if __FILE__ == $0
  puts "🧪 Базове тестування Config Manager..."
  
  # Тест 1: Генерація secret
  puts "\n📝 Тест 1: Генерація HMAC secret..."
  secret = ProGran3::System::Core::ConfigManager.get_hmac_secret
  puts "   Secret length: #{secret.length}"
  puts "   Secret preview: #{secret[0..16]}..."
  
  # Тест 2: Consistency check
  puts "\n📝 Тест 2: Consistency check..."
  secret2 = ProGran3::System::Core::ConfigManager.get_hmac_secret
  if secret == secret2
    puts "   ✅ PASSED: Secret consistent"
  else
    puts "   ❌ FAILED: Secret inconsistent"
  end
  
  # Тест 3: Порівняння з оригінальним secret
  puts "\n📝 Тест 3: Порівняння з оригінальним secret..."
  original = ProGran3::System::Core::ConfigManager.send(:original_secret)
  if secret == original
    puts "   ✅ PASSED: Secret matches original"
  else
    puts "   ❌ FAILED: Secret doesn't match original"
  end
  
  puts "\n✅ Базове тестування завершено"
end
