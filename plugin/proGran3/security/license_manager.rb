# plugin/proGran3/security/license_manager.rb
# Головний менеджер ліцензій - об'єднує всі модулі

require_relative 'hardware_fingerprint'
require_relative 'license_storage'
require_relative 'api_client'

module ProGran3
  module Security
    class LicenseManager
      
      # Grace period - скільки днів може працювати offline
      GRACE_PERIOD_DAYS = 7
      WARNING_PERIOD_DAYS = 3
      
      # Ініціалізація менеджера
      def initialize
        @fingerprint = nil
        @current_license = nil
      end
      
      # Активує ліцензію
      # @param email [String] Email користувача
      # @param license_key [String] Ключ ліцензії
      # @return [Hash] { success: Boolean, error: String, license: Hash }
      def activate_license(email, license_key)
        puts "\n🔐 Активація ліцензії..."
        
        # Генеруємо fingerprint
        fp_data = HardwareFingerprint.generate
        @fingerprint = fp_data[:fingerprint]
        
        puts "📋 Email: #{email}"
        puts "🔑 Key: #{license_key[0..8]}..."
        puts "🖥️ Fingerprint: #{@fingerprint[0..16]}..."
        
        # Викликаємо API для активації
        result = ApiClient.activate(email, license_key, @fingerprint)
        
        if result[:success]
          # Зберігаємо ліцензію локально
          license_data = {
            license_key: license_key,
            email: email,
            fingerprint: @fingerprint,
            status: result[:data][:status] || 'active',
            activated_at: Time.now.iso8601,
            last_validation: Time.now.iso8601,
            server_data: result[:data]
          }
          
          # Якщо є expires_at від сервера - використовуємо
          if result[:data] && result[:data][:expires_at]
            license_data[:expires_at] = result[:data][:expires_at]
          end
          
          saved = LicenseStorage.save(license_data)
          
          if saved
            @current_license = license_data
            puts "✅ Ліцензію активовано та збережено!"
            
            {
              success: true,
              license: license_data,
              message: 'Ліцензію успішно активовано'
            }
          else
            puts "⚠️ Ліцензію активовано на сервері, але не вдалося зберегти локально"
            {
              success: false,
              error: 'Не вдалося зберегти ліцензію локально'
            }
          end
        else
          puts "❌ Помилка активації: #{result[:error]}"
          result
        end
        
      rescue => e
        puts "❌ Exception при активації: #{e.message}"
        {
          success: false,
          error: "Помилка активації: #{e.message}"
        }
      end
      
      # Валідує ліцензію (головний метод)
      # @return [Hash] { valid: Boolean, license: Hash, warning: String, error: String }
      def validate_license
        puts "\n🔍 Валідація ліцензії..."
        
        # Генеруємо fingerprint
        fp_data = HardwareFingerprint.generate
        @fingerprint = fp_data[:fingerprint]
        
        # Завантажуємо локальну ліцензію
        license = LicenseStorage.load
        
        # Немає ліцензії
        unless license
          puts "❌ Ліцензія не знайдена"
          return {
            valid: false,
            error: 'no_license',
            message: 'Ліцензія не знайдена. Потрібна активація.'
          }
        end
        
        puts "📋 Знайдено ліцензію: #{license[:license_key][0..8]}..."
        
        # Перевірка fingerprint
        if license[:fingerprint] != @fingerprint
          puts "❌ Fingerprint не збігається!"
          puts "   Збережено: #{license[:fingerprint][0..16]}..."
          puts "   Поточний: #{@fingerprint[0..16]}..."
          
          return {
            valid: false,
            error: 'hardware_mismatch',
            message: 'Ліцензія прив\'язана до іншого комп\'ютера'
          }
        end
        
        puts "✅ Fingerprint збігається"
        
        # Перевірка expiration (якщо є)
        if license[:expires_at]
          expires_at = Time.parse(license[:expires_at])
          if expires_at < Time.now
            puts "❌ Ліцензія прострочена"
            
            return {
              valid: false,
              error: 'expired',
              message: 'Ліцензія прострочена'
            }
          end
          
          days_until_expiry = ((expires_at - Time.now) / 86400).to_i
          puts "⏰ Ліцензія дійсна ще #{days_until_expiry} днів"
        end
        
        # Перевірка grace period
        grace_result = check_grace_period(license)
        
        case grace_result[:action]
        when :block
          # Grace period вичерпано - вимагаємо online
          puts "🔴 Grace period вичерпано - потрібна online валідація"
          return validate_online_required(license)
          
        when :warn
          # Попередження але дозволяємо працювати
          puts "⚠️ Попередження: #{grace_result[:message]}"
          validate_online_background(license)
          
          @current_license = license
          return {
            valid: true,
            license: license,
            warning: grace_result[:message]
          }
          
        else
          # Все OK
          puts "✅ Grace period в нормі"
          validate_online_background(license)
          
          @current_license = license
          return {
            valid: true,
            license: license
          }
        end
        
      rescue => e
        puts "❌ Exception при валідації: #{e.message}"
        puts e.backtrace.first(3)
        
        {
          valid: false,
          error: 'validation_exception',
          message: e.message
        }
      end
      
      # Перевірка grace period
      # @param license [Hash]
      # @return [Hash] { action: Symbol, message: String, days_offline: Integer }
      def check_grace_period(license)
        last_validation = license[:last_validation] || license[:activated_at]
        
        unless last_validation
          # Немає інформації про валідацію - припускаємо що зараз
          return { action: :allow, message: 'OK' }
        end
        
        last_validation_time = Time.parse(last_validation)
        days_offline = ((Time.now - last_validation_time) / 86400.0).round(1)
        
        puts "📊 Днів без online валідації: #{days_offline}"
        
        if days_offline > GRACE_PERIOD_DAYS
          # Grace period вичерпано
          {
            action: :block,
            message: "Grace period вичерпано (#{days_offline.to_i} днів offline)",
            days_offline: days_offline.to_i
          }
        elsif days_offline > WARNING_PERIOD_DAYS
          # Попередження
          {
            action: :warn,
            message: "Рекомендуємо підключитись до інтернету (#{days_offline.to_i} днів offline)",
            days_offline: days_offline.to_i
          }
        else
          # Все OK
          {
            action: :allow,
            message: 'OK',
            days_offline: days_offline.to_i
          }
        end
      end
      
      # Валідація online (блокуюча - вимагає з'єднання)
      # @param license [Hash]
      # @return [Hash]
      def validate_online_required(license)
        puts "🌐 Виконується обов'язкова online валідація..."
        
        result = ApiClient.validate(license[:license_key], @fingerprint)
        
        if result[:success] && result[:data] && result[:data][:valid]
          # Оновлюємо last_validation
          license[:last_validation] = Time.now.iso8601
          
          # Оновлюємо server_data якщо є
          license[:server_data] = result[:data] if result[:data]
          
          LicenseStorage.delete # Видаляємо старий файл
          LicenseStorage.save(license)
          
          @current_license = license
          
          puts "✅ Online валідація успішна"
          {
            valid: true,
            license: license
          }
        elsif result[:offline]
          puts "❌ Сервер недоступний - неможливо валідувати"
          {
            valid: false,
            error: 'online_required',
            message: 'Необхідне підключення до інтернету для перевірки ліцензії'
          }
        else
          puts "❌ Ліцензія не валідна на сервері"
          {
            valid: false,
            error: 'invalid_on_server',
            message: result[:error] || 'Ліцензія більше не валідна'
          }
        end
      end
      
      # Валідація online в фоні (не блокує)
      # @param license [Hash]
      def validate_online_background(license)
        Thread.new do
          begin
            puts "🔄 Фонова online валідація..."
            
            result = ApiClient.validate(license[:license_key], @fingerprint)
            
            if result[:success] && result[:data] && result[:data][:valid]
              # Оновлюємо last_validation
              license[:last_validation] = Time.now.iso8601
              license[:server_data] = result[:data] if result[:data]
              
              LicenseStorage.delete
              LicenseStorage.save(license)
              
              puts "✅ Фонова валідація успішна"
            elsif !result[:offline]
              # Ліцензія більше не валідна на сервері
              puts "⚠️ ВАЖЛИВО: Ліцензія деактивована на сервері!"
              # Тут можна показати попередження користувачу
            else
              puts "ℹ️ Фонова валідація: сервер offline (нормально)"
            end
            
          rescue => e
            puts "⚠️ Помилка фонової валідації: #{e.message}"
          end
        end
      end
      
      # Деактивує ліцензію (видаляє локальний файл)
      # @return [Boolean]
      def deactivate_license
        puts "\n🗑️ Деактивація ліцензії..."
        
        if LicenseStorage.exists?
          deleted = LicenseStorage.delete
          @current_license = nil
          
          if deleted
            puts "✅ Ліцензію деактивовано"
            true
          else
            puts "❌ Не вдалося видалити ліцензію"
            false
          end
        else
          puts "⚠️ Ліцензія не знайдена"
          false
        end
      end
      
      # Отримує поточну ліцензію
      # @return [Hash, nil]
      def current_license
        @current_license || LicenseStorage.load
      end
      
      # Перевірка чи є активна ліцензія
      # @return [Boolean]
      def has_license?
        LicenseStorage.exists?
      end
      
      # Інформація про статус ліцензії
      # @return [Hash]
      def license_info
        license = current_license
        
        current_fp = HardwareFingerprint.generate[:fingerprint]
        
        return { 
          has_license: false,
          fingerprint: current_fp
        } unless license
        
        {
          has_license: true,
          license_key: license[:license_key],
          email: license[:email],
          status: license[:status],
          activated_at: license[:activated_at],
          expires_at: license[:expires_at],
          last_validation: license[:last_validation],
          fingerprint: current_fp,
          fingerprint_match: license[:fingerprint] == current_fp
        }
      end
    end
  end
end

# === ТЕСТУВАННЯ ===
if __FILE__ == $0
  puts "🧪 Базове тестування License Manager..."
  
  manager = ProGran3::Security::LicenseManager.new
  
  # Тест 1: Перевірка наявності ліцензії
  puts "\n📝 Тест 1: Перевірка наявності ліцензії..."
  has_license = manager.has_license?
  puts "   Has license: #{has_license}"
  
  # Тест 2: Валідація (якщо є ліцензія)
  if has_license
    puts "\n📝 Тест 2: Валідація існуючої ліцензії..."
    result = manager.validate_license
    puts "   Valid: #{result[:valid]}"
    puts "   Error: #{result[:error]}" if result[:error]
  end
  
  # Тест 3: Інформація про ліцензію
  puts "\n📝 Тест 3: Інформація про ліцензію..."
  info = manager.license_info
  puts "   #{info.inspect}"
  
  puts "\n✅ Базове тестування завершено"
  puts "   Детальні тести в TEST_STEP_4.rb"
end

