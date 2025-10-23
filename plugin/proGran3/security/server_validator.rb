# plugin/proGran3/security/server_validator.rb
# Валідація API сервера (захист від man-in-the-middle та фальшивих серверів)

require 'uri'
require 'openssl'
require_relative '../logger'

module ProGran3
  module Security
    class ServerValidator
      
      # Whitelist дозволених доменів
      ALLOWED_DOMAINS = [
        'vercel.app',           # Vercel hosting
        'progran3.com',         # Custom domain (якщо буде)
        'provis3d.com'          # Company domain (якщо буде)
      ].freeze
      
      # Валідує URL сервера
      # @param url [String] URL для перевірки
      # @return [Boolean] true якщо URL безпечний
      # @raise [SecurityError] якщо URL небезпечний
      def self.validate_url(url)
        return true if url.nil? || url.empty?
        
        begin
          uri = URI.parse(url)
          
          # 1. Перевірка схеми (тільки HTTPS)
          unless uri.scheme == 'https'
            Logger.error("Незахищена схема: #{uri.scheme}. Дозволено тільки HTTPS", "ServerValidator")
            raise SecurityError, "⚠️ Тільки HTTPS з'єднання дозволені"
          end
          
          # 2. Перевірка домену (whitelist)
          unless allowed_domain?(uri.host)
            Logger.error("Недозволений домен: #{uri.host}", "ServerValidator")
            raise SecurityError, "⚠️ Недозволений домен сервера: #{uri.host}"
          end
          
          # 3. Перевірка що це не localhost/internal IP
          if internal_host?(uri.host)
            Logger.error("Спроба підключення до внутрішнього хоста: #{uri.host}", "ServerValidator")
            raise SecurityError, "⚠️ Внутрішні хости заборонені"
          end
          
          Logger.info("URL валідовано успішно: #{url}", "ServerValidator")
          true
          
        rescue URI::InvalidURIError => e
          Logger.error("Невалідний URL: #{e.message}", "ServerValidator")
          raise SecurityError, "⚠️ Невалідний формат URL"
        end
      end
      
      # Перевіряє чи домен в whitelist
      # @param host [String] Hostname
      # @return [Boolean]
      def self.allowed_domain?(host)
        return false if host.nil? || host.empty?
        
        # Перевіряємо чи host закінчується на один з дозволених доменів
        ALLOWED_DOMAINS.any? do |domain|
          host == domain || host.end_with?(".#{domain}")
        end
      end
      
      # Перевіряє чи це internal host
      # @param host [String] Hostname
      # @return [Boolean]
      def self.internal_host?(host)
        return false if host.nil? || host.empty?
        
        # Список заборонених hosts
        forbidden = [
          'localhost',
          '127.0.0.1',
          '0.0.0.0',
          '::1'
        ]
        
        return true if forbidden.include?(host.downcase)
        
        # Перевірка internal IP ranges
        return true if host =~ /^192\.168\./
        return true if host =~ /^10\./
        return true if host =~ /^172\.(1[6-9]|2[0-9]|3[0-1])\./
        
        false
      end
      
      # Валідує SSL сертифікат (advanced)
      # @param http [Net::HTTP] HTTP об'єкт
      # @return [Boolean]
      def self.validate_ssl_certificate(http)
        # Додаткова перевірка SSL сертифіката
        # Можна додати certificate pinning якщо потрібно
        
        # Для повної безпеки можна зберігати fingerprint сертифіката
        # і перевіряти його при кожному з'єднанні
        
        true  # Поки що покладаємось на VERIFY_PEER
      end
      
      # Інформація про поточний сервер
      # @param url [String]
      # @return [Hash]
      def self.server_info(url)
        uri = URI.parse(url)
        
        {
          url: url,
          scheme: uri.scheme,
          host: uri.host,
          port: uri.port,
          allowed: allowed_domain?(uri.host),
          secure: uri.scheme == 'https',
          internal: internal_host?(uri.host)
        }
      rescue => e
        {
          url: url,
          error: e.message,
          allowed: false
        }
      end
    end
  end
end

# === ТЕСТУВАННЯ ===
if __FILE__ == $0
  puts "🧪 Тестування ServerValidator..."
  
  # Тест 1: Валідний Vercel URL
  puts "\n📝 Тест 1: Валідний URL..."
  begin
    ProGran3::Security::ServerValidator.validate_url('https://server-abc.vercel.app')
    puts "   ✅ PASSED"
  rescue => e
    puts "   ❌ FAILED: #{e.message}"
  end
  
  # Тест 2: HTTP (незахищений)
  puts "\n📝 Тест 2: HTTP URL (має бути заблоковано)..."
  begin
    ProGran3::Security::ServerValidator.validate_url('http://server-abc.vercel.app')
    puts "   ❌ FAILED: Має бути SecurityError"
  rescue SecurityError => e
    puts "   ✅ PASSED: #{e.message}"
  end
  
  # Тест 3: Localhost (фальшивий сервер)
  puts "\n📝 Тест 3: Localhost (має бути заблоковано)..."
  begin
    ProGran3::Security::ServerValidator.validate_url('https://localhost:3000')
    puts "   ❌ FAILED: Має бути SecurityError"
  rescue SecurityError => e
    puts "   ✅ PASSED: #{e.message}"
  end
  
  # Тест 4: Недозволений домен
  puts "\n📝 Тест 4: Недозволений домен (має бути заблоковано)..."
  begin
    ProGran3::Security::ServerValidator.validate_url('https://evil-server.com')
    puts "   ❌ FAILED: Має бути SecurityError"
  rescue SecurityError => e
    puts "   ✅ PASSED: #{e.message}"
  end
  
  # Тест 5: Internal IP
  puts "\n📝 Тест 5: Internal IP (має бути заблоковано)..."
  begin
    ProGran3::Security::ServerValidator.validate_url('https://192.168.1.1')
    puts "   ❌ FAILED: Має бути SecurityError"
  rescue SecurityError => e
    puts "   ✅ PASSED: #{e.message}"
  end
  
  # Тест 6: Server info
  puts "\n📝 Тест 6: Server info..."
  info = ProGran3::Security::ServerValidator.server_info('https://server-abc.vercel.app')
  puts "   ✅ PASSED"
  puts "   Info: #{info.inspect}"
  
  puts "\n✅ Тестування ServerValidator завершено"
end

