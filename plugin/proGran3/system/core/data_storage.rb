# plugin/proGran3/system/core/data_storage.rb
# Система зберігання даних з шифруванням

require 'openssl'
require 'base64'
require 'json'
require 'fileutils'

module ProGran3
  module System
    module Core
      class DataStorage
      
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
        
        # Додаємо метадані (включаючи версію fingerprint)
        data_to_save = license_data.merge({
          format_version: FORMAT_VERSION,
          fingerprint_version: '3.0',  # v3.0: Machine GUID + flexible validation
          saved_at: Time.now.iso8601
        })
        
        # Шифруємо дані
        encrypted = encrypt_data(data_to_save)
        
        # Створюємо директорію якщо не існує
        FileUtils.mkdir_p(LICENSE_DIR) unless Dir.exist?(LICENSE_DIR)
        
        # Видаляємо старий файл якщо існує (для уникнення Permission denied)
        if File.exist?(LICENSE_FILE)
          # Знімаємо read-only перед перезаписом (БЕЗ консольного вікна)
          remove_readonly_attribute(LICENSE_FILE)
          File.delete(LICENSE_FILE)
        end
        
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
        # v3.0: Очищаємо старі backup файли при кожному завантаженні
        cleanup_old_backups
        
        unless File.exist?(LICENSE_FILE)
          # Файл ліцензії не знайдено - без логування
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
        
        # МІГРАЦІЯ: Перевіряємо версію fingerprint
        if needs_fingerprint_migration?(decrypted)
          fp_version = decrypted[:fingerprint_version] || '1.0'
          puts "🔄 Виявлено стару версію fingerprint (v#{fp_version})"
          puts "📝 Оновлення до v3.0 - потрібна повторна активація ліцензії"
          migrate_old_fingerprint
          return nil
        end
        
        # Ліцензію завантажено - без логування
        decrypted
        
      rescue OpenSSL::Cipher::CipherError => e
        puts "❌ Помилка розшифрування (можливо файл пошкоджено або скопійовано з іншого ПК)"
        puts "   #{e.message}"
        puts "🗑️ Видаляємо пошкоджений файл ліцензії..."
        
        # Створюємо backup перед видаленням
        begin
          backup_file = LICENSE_FILE + '.corrupted.backup'
          FileUtils.cp(LICENSE_FILE, backup_file) if File.exist?(LICENSE_FILE)
          puts "💾 Backup створено: #{backup_file}"
        rescue => backup_error
          puts "⚠️ Не вдалося створити backup: #{backup_error.message}"
        end
        
        # Видаляємо пошкоджений файл
        delete
        
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
          # Знімаємо read-only атрибут якщо є (БЕЗ консольного вікна)
          remove_readonly_attribute(LICENSE_FILE)
          
          File.delete(LICENSE_FILE)
          puts "✅ Ліцензію видалено"
          true
        else
          # Файл ліцензії не знайдено - без логування
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
      
      # Перевіряє чи потрібна міграція fingerprint
      # @param license_data [Hash] Дані ліцензії
      # @return [Boolean]
      def self.needs_fingerprint_migration?(license_data)
        # Якщо немає fingerprint_version або версія < 3.0 - потрібна міграція
        fp_version = license_data[:fingerprint_version]
        return true unless fp_version
        
        # Порівнюємо версії (1.0, 2.0 < 3.0)
        fp_version.to_f < 3.0
      end
      
      # Мігрує стару ліцензію (видаляє її і створює backup)
      def self.migrate_old_fingerprint
        begin
          # Створюємо backup старої ліцензії
          backup_file = LICENSE_FILE + '.v1.backup'
          
          if File.exist?(LICENSE_FILE)
            FileUtils.cp(LICENSE_FILE, backup_file)
            puts "💾 Створено backup старої ліцензії: #{backup_file}"
          end
          
          # Видаляємо стару ліцензію
          delete
          
          puts "✅ Міграція завершена. Активуйте ліцензію заново."
          puts "ℹ️  Backup буде автоматично видалено через 7 днів"
          
          true
        rescue => e
          puts "❌ Помилка міграції: #{e.message}"
          false
        end
      end
      
      # Очищає старі backup файли (v3.0: безпека)
      # Видаляє backup старші за 7 днів
      def self.cleanup_old_backups
        return unless Dir.exist?(LICENSE_DIR)
        
        begin
          # Знаходимо всі backup файли
          backup_pattern = File.join(LICENSE_DIR, '*.backup')
          backup_files = Dir.glob(backup_pattern)
          
          return if backup_files.empty?
          
          cutoff_time = Time.now - (7 * 86400)  # 7 днів назад
          deleted_count = 0
          
          backup_files.each do |backup_file|
            # Перевіряємо вік файлу
            if File.mtime(backup_file) < cutoff_time
              remove_readonly_attribute(backup_file)
              File.delete(backup_file)
              deleted_count += 1
            end
          end
          
          puts "🧹 Видалено старих backup файлів: #{deleted_count}" if deleted_count > 0
          
        rescue => e
          # Помилки cleanup не критичні - ігноруємо
        end
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
        require_relative '../utils/device_identifier'
        
        # Отримуємо fingerprint поточної системи
        fp = ProGran3::System::Utils::DeviceIdentifier.generate
        
        # Використовуємо PBKDF2 для генерації ключа
        salt = 'ProGran3-License-Salt-v1.0'
        iterations = 100000  # v3.0: збільшено з 10000 до 100000 (OWASP 2023)
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
      # Знімає read-only атрибут з файлу (БЕЗ консольного вікна)
      def self.remove_readonly_attribute(file_path)
        return unless File.exist?(file_path)
        
        begin
          # Робимо файл writable (знімаємо read-only)
          File.chmod(0666, file_path)
        rescue => e
          # Ігноруємо помилки (не критично)
        end
      end
      
      def self.hide_file_windows
        begin
          # Встановлюємо атрибути БЕЗ консольного вікна
          # Використовуємо просто File.chmod (приховання не критично)
          File.chmod(0600, LICENSE_FILE)
        rescue => e
          # Ігноруємо помилки приховування (не критично)
        end
      end
    end
  end
end

# === ТЕСТУВАННЯ ===
end


