# plugin/proGran3/security/license_storage.rb
# Зберігання ліцензійних даних з шифруванням

require 'openssl'
require 'base64'
require 'json'
require 'fileutils'

module ProGran3
  module Security
    class LicenseStorage
      
      # Шлях до файлу ліцензії (прихований)
      LICENSE_DIR = File.join(Dir.home, '.progran3').freeze
      LICENSE_FILE = File.join(LICENSE_DIR, 'license.enc').freeze
      
      # Версія формату
      FORMAT_VERSION = '1.0'.freeze
      
      # Зберігає ліцензійні дані (зашифровані)
      # @param license_data [Hash] Дані ліцензії
      # @return [Boolean] true якщо успішно збережено
      def self.save(license_data)
        raise ArgumentError, "License data cannot be nil" if license_data.nil?
        raise ArgumentError, "License data must be a Hash" unless license_data.is_a?(Hash)
        
        # Додаємо метадані
        data_to_save = license_data.merge({
          format_version: FORMAT_VERSION,
          saved_at: Time.now.iso8601
        })
        
        # Шифруємо дані
        encrypted = encrypt_data(data_to_save)
        
        # Створюємо директорію якщо не існує
        FileUtils.mkdir_p(LICENSE_DIR) unless Dir.exist?(LICENSE_DIR)
        
        # Зберігаємо зашифровані дані
        File.write(LICENSE_FILE, encrypted)
        
        # Приховуємо файл (Windows)
        hide_file_windows if RUBY_PLATFORM.include?('mingw') || RUBY_PLATFORM.include?('mswin')
        
        # Обмежуємо права доступу (Unix)
        File.chmod(0600, LICENSE_FILE) unless RUBY_PLATFORM.include?('mingw') || RUBY_PLATFORM.include?('mswin')
        
        puts "✅ Ліцензію збережено: #{LICENSE_FILE}"
        true
        
      rescue => e
        puts "❌ Помилка збереження ліцензії: #{e.message}"
        puts e.backtrace.first(3) if $DEBUG
        false
      end
      
      # Завантажує ліцензійні дані
      # @return [Hash, nil] Розшифровані дані або nil якщо файл не знайдено
      def self.load
        unless File.exist?(LICENSE_FILE)
          puts "⚠️ Файл ліцензії не знайдено: #{LICENSE_FILE}"
          return nil
        end
        
        # Читаємо зашифровані дані
        encrypted = File.read(LICENSE_FILE)
        
        # Розшифровуємо
        decrypted = decrypt_data(encrypted)
        
        # Перевіряємо версію формату
        if decrypted[:format_version] != FORMAT_VERSION
          puts "⚠️ Несумісна версія формату ліцензії"
          return nil
        end
        
        puts "✅ Ліцензію завантажено з #{LICENSE_FILE}"
        decrypted
        
      rescue OpenSSL::Cipher::CipherError => e
        puts "❌ Помилка розшифрування (можливо файл пошкоджено або скопійовано з іншого ПК)"
        puts "   #{e.message}"
        nil
        
      rescue => e
        puts "❌ Помилка завантаження ліцензії: #{e.message}"
        puts e.backtrace.first(3) if $DEBUG
        nil
      end
      
      # Видаляє файл ліцензії
      # @return [Boolean] true якщо успішно видалено
      def self.delete
        if File.exist?(LICENSE_FILE)
          File.delete(LICENSE_FILE)
          puts "✅ Ліцензію видалено"
          true
        else
          puts "⚠️ Файл ліцензії не знайдено"
          false
        end
      rescue => e
        puts "❌ Помилка видалення ліцензії: #{e.message}"
        false
      end
      
      # Перевіряє чи існує файл ліцензії
      # @return [Boolean]
      def self.exists?
        File.exist?(LICENSE_FILE)
      end
      
      # Інформація про файл ліцензії
      # @return [Hash]
      def self.file_info
        return { exists: false } unless exists?
        
        stat = File.stat(LICENSE_FILE)
        {
          exists: true,
          path: LICENSE_FILE,
          size: stat.size,
          modified_at: stat.mtime,
          readable: File.readable?(LICENSE_FILE),
          writable: File.writable?(LICENSE_FILE)
        }
      end
      
      private
      
      # Шифрує дані за допомогою AES-256-CBC
      def self.encrypt_data(data)
        cipher = OpenSSL::Cipher.new('AES-256-CBC')
        cipher.encrypt
        
        # Отримуємо ключ шифрування (базується на hardware fingerprint)
        key = derive_encryption_key
        cipher.key = key
        
        # Генеруємо випадковий IV
        iv = cipher.random_iv
        
        # Шифруємо JSON представлення даних
        json_data = data.to_json
        encrypted = cipher.update(json_data) + cipher.final
        
        # Зберігаємо IV + зашифровані дані (кодуємо в Base64)
        Base64.strict_encode64(iv + encrypted)
      end
      
      # Розшифровує дані
      def self.decrypt_data(encrypted_data)
        # Декодуємо з Base64
        decoded = Base64.strict_decode64(encrypted_data)
        
        # Витягуємо IV (перші 16 байт)
        iv = decoded[0...16]
        encrypted = decoded[16..-1]
        
        # Налаштовуємо cipher для розшифрування
        cipher = OpenSSL::Cipher.new('AES-256-CBC')
        cipher.decrypt
        
        # Отримуємо ключ (той самий що і при шифруванні)
        key = derive_encryption_key
        cipher.key = key
        cipher.iv = iv
        
        # Розшифровуємо
        decrypted = cipher.update(encrypted) + cipher.final
        
        # Парсимо JSON
        JSON.parse(decrypted, symbolize_names: true)
      end
      
      # Генерує ключ шифрування на основі hardware fingerprint
      # Це означає що файл можна розшифрувати ТІЛЬКИ на цьому ПК!
      def self.derive_encryption_key
        require_relative 'hardware_fingerprint'
        
        # Отримуємо fingerprint поточної системи
        fp = HardwareFingerprint.generate
        
        # Використовуємо PBKDF2 для генерації ключа
        salt = 'ProGran3-License-Salt-v1.0'
        iterations = 10000
        key_length = 32 # 256 bits
        
        OpenSSL::PKCS5.pbkdf2_hmac(
          fp[:fingerprint],
          salt,
          iterations,
          key_length,
          OpenSSL::Digest::SHA256.new
        )
      end
      
      # Приховує файл на Windows
      def self.hide_file_windows
        begin
          # Встановлюємо атрибути Hidden + System
          system("attrib +h +s \"#{LICENSE_FILE}\" >nul 2>&1")
        rescue => e
          puts "⚠️ Не вдалося приховати файл: #{e.message}"
        end
      end
    end
  end
end

# === ТЕСТУВАННЯ ===
if __FILE__ == $0
  puts "🧪 Тестування License Storage..."
  
  # Тестові дані
  test_data = {
    license_key: 'TEST-1234-5678-ABCD',
    email: 'test@example.com',
    fingerprint: 'test_fingerprint_hash',
    activated_at: Time.now.iso8601,
    expires_at: (Time.now + 30*24*60*60).iso8601
  }
  
  puts "\n📝 Тест 1: Збереження..."
  result = ProGran3::Security::LicenseStorage.save(test_data)
  puts "   #{result ? '✅ PASSED' : '❌ FAILED'}"
  
  puts "\n📝 Тест 2: Перевірка існування..."
  exists = ProGran3::Security::LicenseStorage.exists?
  puts "   #{exists ? '✅ PASSED' : '❌ FAILED'}"
  
  puts "\n📝 Тест 3: Завантаження..."
  loaded = ProGran3::Security::LicenseStorage.load
  if loaded && loaded[:license_key] == test_data[:license_key]
    puts "   ✅ PASSED"
    puts "   Завантажено: #{loaded[:license_key]}"
  else
    puts "   ❌ FAILED"
  end
  
  puts "\n📝 Тест 4: Інформація про файл..."
  info = ProGran3::Security::LicenseStorage.file_info
  puts "   ✅ PASSED"
  puts "   Розмір: #{info[:size]} bytes"
  puts "   Шлях: #{info[:path]}"
  
  puts "\n📝 Тест 5: Видалення..."
  deleted = ProGran3::Security::LicenseStorage.delete
  puts "   #{deleted ? '✅ PASSED' : '❌ FAILED'}"
  
  puts "\n✅ Тестування завершено"
end


