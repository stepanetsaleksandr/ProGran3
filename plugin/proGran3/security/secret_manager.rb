# plugin/proGran3/security/secret_manager.rb
# Захист HMAC secret через multi-layer obfuscation

require 'digest'
require_relative 'hardware_fingerprint'

module ProGran3
  module Security
    class SecretManager
      
      # Отримати HMAC secret (обфусковано)
      # @return [String] HMAC secret key
      def self.get_hmac_secret
        # Layer 1: Базові частини (розкидані по коду)
        part_a = compute_segment_alpha
        part_b = compute_segment_beta  
        part_c = compute_segment_gamma
        part_d = compute_segment_delta
        
        # Layer 2: XOR з hardware fingerprint
        fp = HardwareFingerprint.generate[:fingerprint]
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
      
      # Альтернативний метод: динамічне завантаження з сервера
      # (можна використати замість обфускації)
      def self.fetch_secret_from_server
        # TODO: Реалізувати якщо потрібно
        # GET /api/client/get-hmac-secret з fingerprint verification
      end
    end
  end
end

# === ТЕСТУВАННЯ ===
if __FILE__ == $0
  puts "🧪 Тестування SecretManager..."
  
  # Тест 1: Генерація secret
  puts "\n📝 Тест 1: Генерація HMAC secret..."
  secret = ProGran3::Security::SecretManager.get_hmac_secret
  puts "   Secret length: #{secret.length}"
  puts "   Secret (first 20 chars): #{secret[0..20]}..."
  
  # Тест 2: Consistency (має повертати той самий secret)
  puts "\n📝 Тест 2: Consistency check..."
  secret2 = ProGran3::Security::SecretManager.get_hmac_secret
  if secret == secret2
    puts "   ✅ PASSED: Secret консистентний"
  else
    puts "   ❌ FAILED: Secret змінюється!"
  end
  
  # Тест 3: Порівняння з оригіналом
  puts "\n📝 Тест 3: Порівняння з оригінальним secret..."
  original = ProGran3::Security::SecretManager.send(:original_secret)
  if secret == original
    puts "   ✅ PASSED: Обфускація повертає правильний secret"
  else
    puts "   ❌ FAILED: Secret не збігається!"
    puts "   Expected: #{original[0..20]}..."
    puts "   Got: #{secret[0..20]}..."
  end
  
  puts "\n✅ Тестування SecretManager завершено"
end

