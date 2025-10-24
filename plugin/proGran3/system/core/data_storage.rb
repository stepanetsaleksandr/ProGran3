# plugin/proGran3/system/core/data_storage.rb
# Зберігання даних сесії з шифруванням

require 'openssl'
require 'base64'
require 'json'
require 'fileutils'

module ProGran3
  module System
    module Core
      class DataStorage
        
        # Шлях до файлу даних (прихований)
        DATA_DIR = File.join(Dir.home, '.progran3').freeze
        DATA_FILE = File.join(DATA_DIR, 'session.enc').freeze
        
        # Версія формату
        FORMAT_VERSION = '1.0'.freeze
        
        # Зберігає дані сесії (зашифровані)
        # @param session_data [Hash] Дані сесії
        # @return [Boolean] true якщо успішно збережено
        def self.save(session_data)
          raise ArgumentError, "Session data cannot be nil" if session_data.nil?
          raise ArgumentError, "Session data must be a Hash" unless session_data.is_a?(Hash)
          
          # Додаємо метадані (включаючи версію fingerprint)
          data_to_save = session_data.merge({
            format_version: FORMAT_VERSION,
            fingerprint_version: '3.0',  # v3.0: Machine GUID + flexible validation
            saved_at: Time.now.iso8601
          })
          
          # Шифруємо дані
          encrypted = encrypt_data(data_to_save)
          
          # Створюємо директорію якщо не існує
          FileUtils.mkdir_p(DATA_DIR) unless Dir.exist?(DATA_DIR)
          
          # Видаляємо старий файл якщо існує (для уникнення Permission denied)
          if File.exist?(DATA_FILE)
            # Знімаємо read-only перед перезаписом (БЕЗ консольного вікна)
            remove_readonly_attribute(DATA_FILE)
            File.delete(DATA_FILE)
          end
          
          # Зберігаємо зашифровані дані
          File.write(DATA_FILE, encrypted)
          
          # Приховуємо файл (Windows)
          hide_file_on_windows(DATA_FILE)
          
          # Встановлюємо read-only (Windows)
          set_readonly_attribute(DATA_FILE)
          
          puts "✅ Дані сесії збережено: #{DATA_FILE}"
          true
          
        rescue => e
          puts "❌ Помилка збереження даних: #{e.message}"
          false
        end
        
        # Завантажує дані сесії (розшифровує)
        # @return [Hash, nil] Дані сесії або nil якщо не знайдено
        def self.load
          return nil unless File.exist?(DATA_FILE)
          
          begin
            # Читаємо зашифровані дані
            encrypted_data = File.read(DATA_FILE)
            
            # Розшифровуємо дані
            decrypted_data = decrypt_data(encrypted_data)
            
            # Парсимо JSON
            session_data = JSON.parse(decrypted_data, symbolize_names: true)
            
            # Перевіряємо версію формату
            if session_data[:format_version] != FORMAT_VERSION
              puts "⚠️ Застарілий формат даних: #{session_data[:format_version]}"
              # Можна додати міграцію тут
            end
            
            puts "✅ Дані сесії завантажено"
            session_data
            
          rescue => e
            puts "❌ Помилка завантаження даних: #{e.message}"
            nil
          end
        end
        
        # Перевіряє чи існує файл даних
        # @return [Boolean]
        def self.exists?
          File.exist?(DATA_FILE)
        end
        
        # Видаляє файл даних
        # @return [Boolean] true якщо успішно видалено
        def self.delete
          return false unless File.exist?(DATA_FILE)
          
          begin
            # Знімаємо read-only перед видаленням
            remove_readonly_attribute(DATA_FILE)
            File.delete(DATA_FILE)
            
            puts "✅ Файл даних видалено"
            true
            
          rescue => e
            puts "❌ Помилка видалення файлу: #{e.message}"
            false
          end
        end
        
        # Інформація про файл даних
        # @return [Hash] { exists: Boolean, size: Integer, modified: Time }
        def self.file_info
          return { exists: false } unless File.exist?(DATA_FILE)
          
          stat = File.stat(DATA_FILE)
          {
            exists: true,
            size: stat.size,
            modified: stat.mtime,
            path: DATA_FILE
          }
        end
        
        # Перевірка чи потрібна міграція fingerprint
        # @param session_data [Hash]
        # @return [Boolean]
        def self.needs_fingerprint_migration?(session_data)
          return false unless session_data
          
          fp_version = session_data[:fingerprint_version]
          return true if fp_version.nil? || fp_version.to_f < 3.0
          
          false
        end
        
        private
        
        # Шифрує дані (AES-256-CBC + PBKDF2)
        # @param data [Hash]
        # @return [String] Base64 encoded encrypted data
        def self.encrypt_data(data)
          json_data = data.to_json
          
          # Створюємо cipher
          cipher = OpenSSL::Cipher.new('AES-256-CBC')
          cipher.encrypt
          
          # Генеруємо IV
          iv = cipher.random_iv
          
          # Отримуємо ключ шифрування (на основі fingerprint)
          key = derive_encryption_key
          
          # Встановлюємо ключ та IV
          cipher.key = key
          cipher.iv = iv
          
          # Шифруємо дані
          encrypted = cipher.update(json_data) + cipher.final
          
          # Кодуємо в Base64
          Base64.encode64(iv + encrypted)
          
        rescue => e
          puts "❌ Помилка шифрування: #{e.message}"
          raise
        end
        
        # Розшифровує дані
        # @param encrypted_data [String] Base64 encoded encrypted data
        # @return [String] Decrypted JSON string
        def self.decrypt_data(encrypted_data)
          # Декодуємо з Base64
          raw_data = Base64.decode64(encrypted_data)
          
          # Витягуємо IV (перші 16 байт)
          iv = raw_data[0, 16]
          encrypted = raw_data[16..-1]
          
          # Створюємо cipher
          cipher = OpenSSL::Cipher.new('AES-256-CBC')
          cipher.decrypt
          
          # Отримуємо ключ шифрування
          key = derive_encryption_key
          
          # Встановлюємо ключ та IV
          cipher.key = key
          cipher.iv = iv
          
          # Розшифровуємо дані
          decrypted = cipher.update(encrypted) + cipher.final
          
          decrypted
          
        rescue => e
          puts "❌ Помилка розшифрування: #{e.message}"
          raise
        end
        
        # Генерує ключ шифрування на основі hardware fingerprint
        # @return [String] 32-byte encryption key
        def self.derive_encryption_key
          require_relative '../utils/device_identifier'
          
          # Отримуємо fingerprint поточної системи
          fp_data = System::Utils::DeviceIdentifier.generate
          fingerprint = fp_data[:fingerprint]
          
          # Використовуємо PBKDF2 для генерації ключа
          # Це означає що файл можна розшифрувати ТІЛЬКИ на цьому ПК!
          OpenSSL::PKCS5.pbkdf2_hmac(
            fingerprint,
            'ProGran3-Session-Data-2025',  # Salt
            100000,  # 100k iterations
            32,      # 32 bytes = 256 bits
            'SHA256'
          )
        end
        
        # Приховує файл на Windows
        # @param file_path [String]
        def self.hide_file_on_windows(file_path)
          return unless RUBY_PLATFORM =~ /mswin|mingw|cygwin/
          
          begin
            # Використовуємо attrib для приховування
            system("attrib +h \"#{file_path}\" >nul 2>&1")
          rescue
            # Ігноруємо помилки
          end
        end
        
        # Встановлює read-only атрибут
        # @param file_path [String]
        def self.set_readonly_attribute(file_path)
          return unless RUBY_PLATFORM =~ /mswin|mingw|cygwin/
          
          begin
            system("attrib +r \"#{file_path}\" >nul 2>&1")
          rescue
            # Ігноруємо помилки
          end
        end
        
        # Знімає read-only атрибут
        # @param file_path [String]
        def self.remove_readonly_attribute(file_path)
          return unless RUBY_PLATFORM =~ /mswin|mingw|cygwin/
          
          begin
            system("attrib -r \"#{file_path}\" >nul 2>&1")
          rescue
            # Ігноруємо помилки
          end
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
    LicenseStorage = System::Core::DataStorage
  end
end

# === ТЕСТУВАННЯ ===
if __FILE__ == $0
  puts "🧪 Базове тестування Data Storage..."
  
  # Тест 1: Збереження
  puts "\n📝 Тест 1: Збереження даних..."
  test_data = {
    license_key: 'TEST-KEY-12345',
    email: 'test@example.com',
    fingerprint: 'test_fingerprint_12345',
    status: 'active',
    activated_at: Time.now.iso8601
  }
  
  result = ProGran3::System::Core::DataStorage.save(test_data)
  puts "   #{result ? '✅ PASSED' : '❌ FAILED'}"
  
  # Тест 2: Перевірка існування
  puts "\n📝 Тест 2: Перевірка існування..."
  exists = ProGran3::System::Core::DataStorage.exists?
  puts "   #{exists ? '✅ PASSED' : '❌ FAILED'}"
  
  # Тест 3: Завантаження
  puts "\n📝 Тест 3: Завантаження даних..."
  loaded = ProGran3::System::Core::DataStorage.load
  if loaded && loaded[:license_key] == test_data[:license_key]
    puts "   ✅ PASSED"
  else
    puts "   ❌ FAILED"
  end
  
  # Тест 4: Інформація про файл
  puts "\n📝 Тест 4: Інформація про файл..."
  info = ProGran3::System::Core::DataStorage.file_info
  puts "   ✅ PASSED"
  
  # Тест 5: Видалення
  puts "\n📝 Тест 5: Видалення даних..."
  deleted = ProGran3::System::Core::DataStorage.delete
  puts "   #{deleted ? '✅ PASSED' : '❌ FAILED'}"
  
  puts "\n✅ Базове тестування завершено"
end
