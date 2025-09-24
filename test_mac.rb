# Тест збору MAC адреси
def get_mac_address
  begin
    puts "🔍 Тестування збору MAC адреси..."
    puts "Платформа: #{RUBY_PLATFORM}"
    
    if RUBY_PLATFORM =~ /mswin|mingw|cygwin/
      puts "🪟 Windows платформа виявлена"
      result = `getmac /fo csv /nh 2>nul`.split("\n").first
      puts "Результат getmac: #{result.inspect}"
      
      if result && result.include?(",")
        mac = result.split(",")[0].strip.gsub(/[^0-9A-Fa-f]/, '')
        puts "Очищена MAC: #{mac.inspect}"
        formatted_mac = mac.scan(/.{2}/).join(':').upcase if mac.length == 12
        puts "Форматована MAC: #{formatted_mac.inspect}"
        return formatted_mac
      end
    elsif RUBY_PLATFORM =~ /darwin/
      puts "🍎 macOS платформа виявлена"
      result = `ifconfig en0 | grep ether 2>/dev/null`.strip
      puts "Результат ifconfig: #{result.inspect}"
      
      if result =~ /ether\s+([0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})/
        return $1.upcase
      end
    else
      puts "🐧 Linux платформа виявлена"
      result = `cat /sys/class/net/eth0/address 2>/dev/null`.strip
      puts "Результат cat: #{result.inspect}"
      return result.upcase if result.match(/^[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}$/)
    end
  rescue => e
    puts "❌ Помилка отримання MAC адреси: #{e.message}"
  end
  
  puts "⚠️ MAC адреса не знайдена"
  nil
end

# Тестуємо функцію
mac = get_mac_address
puts "🎯 Результат: #{mac.inspect}"
