# 🛠️ ПЛАН ВИРІШЕННЯ ВРАЗЛИВОСТЕЙ БЕЗПЕКИ

**Проект:** ProGran3 Security Enhancement  
**Дата:** 24 жовтня 2025  
**Статус:** В РОЗРОБЦІ  
**Пріоритет:** КРИТИЧНИЙ

---

## 🎯 ЗАГАЛЬНА СТРАТЕГІЯ

### **Підхід:**
1. **Швидкі виправлення** - усунути критичні ризики
2. **Системні зміни** - покращити архітектуру безпеки  
3. **Довгострокові покращення** - впровадити best practices

### **Принципи:**
- **Defense in Depth** - багаторівневий захист
- **Zero Trust** - не довіряти нікому
- **Security by Design** - безпека з самого початку
- **Continuous Monitoring** - постійний контроль

---

## 📅 ДЕТАЛЬНИЙ ПЛАН ВПРОВАДЖЕННЯ

### **ФАЗА 1: КРИТИЧНІ ВИПРАВЛЕННЯ (1-3 дні)**

#### **День 1: HMAC Secret Externalization** 🔴

**Завдання:**
- [ ] **1.1** Видалити захардкоджений secret з `config_manager.rb`
- [ ] **1.2** Додати environment variable `HMAC_SECRET_KEY` на сервері
- [ ] **1.3** Реалізувати динамічне завантаження secret
- [ ] **1.4** Додати fallback mechanism
- [ ] **1.5** Тестування нової системи

**Код зміни:**
```ruby
# plugin/proGran3/system/core/config_manager.rb
def self.get_hmac_secret
  # Спроба завантажити з сервера
  begin
    server_secret = fetch_secret_from_server
    return server_secret if server_secret && !server_secret.empty?
  rescue => e
    Logger.warn("Failed to fetch server secret: #{e.message}", "ConfigManager")
  end
  
  # Fallback на локальний (обфускований)
  get_local_fallback_secret
end

def self.fetch_secret_from_server
  require_relative '../network/network_client'
  
  response = ProGran3::System::Network::NetworkClient.get_secret
  return response[:secret] if response[:success]
  nil
end
```

**Серверні зміни:**
```typescript
// server/app/api/client/secret/route.ts
export const GET = withAuth(async ({ supabase, request }: ApiContext) => {
  const fingerprint = request.headers.get('X-Fingerprint');
  
  // Валідація fingerprint
  if (!validateFingerprint(fingerprint)) {
    return apiUnauthorized('Invalid fingerprint');
  }
  
  return apiSuccess({
    secret: process.env.HMAC_SECRET_KEY
  });
});
```

**Критерії завершення:**
- [ ] Secret не зберігається в коді
- [ ] Динамічне завантаження працює
- [ ] Fallback mechanism активний
- [ ] Тести пройдені успішно

---

#### **День 2: Enhanced Hardware Fingerprint** 🔴

**Завдання:**
- [ ] **2.1** Додати CPU ID зчитування
- [ ] **2.2** Включити Motherboard serial
- [ ] **2.3** Додати Windows Product ID
- [ ] **2.4** Впровадити BIOS version hash
- [ ] **2.5** Реалізувати multi-layer fingerprint

**Код зміни:**
```ruby
# plugin/proGran3/system/utils/device_identifier.rb
def self.generate_enhanced_fingerprint
  components = []
  
  # Machine GUID (існуючий)
  components << get_machine_guid
  
  # CPU Information
  components << get_cpu_id
  components << get_cpu_cores_count
  
  # Motherboard Information  
  components << get_motherboard_serial
  components << get_motherboard_manufacturer
  
  # Windows Information
  components << get_windows_product_id
  components << get_windows_edition
  
  # BIOS Information
  components << get_bios_version_hash
  components << get_bios_manufacturer
  
  # Network Information (MAC addresses)
  components << get_network_macs_hash
  
  # Hardware Hash
  components << get_hardware_hash
  
  # Final fingerprint
  raw_fingerprint = components.compact.join('-')
  Digest::SHA256.hexdigest(raw_fingerprint)
end

def self.get_cpu_id
  begin
    # WMI query для CPU ID
    result = `wmic cpu get ProcessorId /value`.strip
    processor_id = result.split("\n").find { |line| line.start_with?('ProcessorId=') }
    processor_id&.split('=')&.last || 'unknown'
  rescue => e
    Logger.warn("Failed to get CPU ID: #{e.message}", "DeviceIdentifier")
    'unknown'
  end
end

def self.get_motherboard_serial
  begin
    result = `wmic baseboard get SerialNumber /value`.strip
    serial = result.split("\n").find { |line| line.start_with?('SerialNumber=') }
    serial&.split('=')&.last || 'unknown'
  rescue => e
    Logger.warn("Failed to get motherboard serial: #{e.message}", "DeviceIdentifier")
    'unknown'
  end
end

def self.get_windows_product_id
  begin
    result = `wmic os get SerialNumber /value`.strip
    product_id = result.split("\n").find { |line| line.start_with?('SerialNumber=') }
    product_id&.split('=')&.last || 'unknown'
  rescue => e
    Logger.warn("Failed to get Windows Product ID: #{e.message}", "DeviceIdentifier")
    'unknown'
  end
end

def self.get_bios_version_hash
  begin
    result = `wmic bios get Version /value`.strip
    version = result.split("\n").find { |line| line.start_with?('Version=') }
    bios_version = version&.split('=')&.last || 'unknown'
    Digest::SHA256.hexdigest(bios_version)
  rescue => e
    Logger.warn("Failed to get BIOS version: #{e.message}", "DeviceIdentifier")
    'unknown'
  end
end
```

**Критерії завершення:**
- [ ] Fingerprint включає 8+ компонентів
- [ ] Складність підробки значно зросла
- [ ] Тести показують унікальність
- [ ] Performance impact < 100ms

---

#### **День 3: Server-side License Validation** 🔴

**Завдання:**
- [ ] **3.1** Реалізувати серверну валідацію при кожному запуску
- [ ] **3.2** Додати heartbeat з fingerprint verification
- [ ] **3.3** Впровадити device binding в базі даних
- [ ] **3.4** Додати anomaly detection
- [ ] **3.5** Реалізувати license revocation

**Код зміни:**
```ruby
# plugin/proGran3/system/core/session_manager.rb
def self.validate_license_with_server
  license_info = load_license_info
  return { valid: false, reason: 'no_license' } unless license_info
  
  # Серверна валідація
  response = ProGran3::System::Network::NetworkClient.validate_license(
    license_info[:license_key],
    license_info[:fingerprint]
  )
  
  if response[:success] && response[:valid]
    # Оновлюємо локальну інформацію
    update_local_license_info(response[:license])
    { valid: true, license: response[:license] }
  else
    # Ліцензія недійсна - видаляємо локальну
    ProGran3::System::Core::DataStorage.delete
    { valid: false, reason: response[:error] }
  end
end

def self.start_heartbeat_monitoring
  return if @heartbeat_timer
  
  @heartbeat_timer = UI.start_timer(300, true) do # кожні 5 хвилин
    send_heartbeat_to_server
  end
end

def self.send_heartbeat_to_server
  license_info = load_license_info
  return unless license_info
  
  response = ProGran3::System::Network::NetworkClient.heartbeat(
    license_info[:license_key],
    license_info[:fingerprint]
  )
  
  unless response[:success]
    Logger.warn("Heartbeat failed: #{response[:error]}", "SessionManager")
    # Можливо ліцензія відкликана
    validate_license_with_server
  end
end
```

**Серверні зміни:**
```typescript
// server/app/api/licenses/validate/route.ts
export const POST = withPublicApi(async ({ supabase, request }: ApiContext) => {
  const { license_key, system_fingerprint } = await validateBody(request, LicenseValidateSchema);
  
  // Перевірка ліцензії
  const { data: license } = await supabase
    .from('licenses')
    .select('*')
    .eq('license_key', license_key)
    .eq('status', 'active')
    .single();
    
  if (!license) {
    return apiError('License not found or inactive', 404);
  }
  
  // Перевірка fingerprint
  const { data: systemInfo } = await supabase
    .from('system_infos')
    .select('*')
    .eq('license_id', license.id)
    .eq('fingerprint_hash', system_fingerprint)
    .single();
    
  if (!systemInfo) {
    // Підозріла активність - логуємо
    await logSuspiciousActivity(license.id, system_fingerprint);
    return apiError('Invalid system fingerprint', 403);
  }
  
  // Перевірка терміну дії
  if (new Date(license.expires_at) < new Date()) {
    return apiError('License expired', 403);
  }
  
  // Оновлюємо last_seen
  await supabase
    .from('system_infos')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', systemInfo.id);
    
  return apiSuccess({
    valid: true,
    license: {
      id: license.id,
      status: license.status,
      expires_at: license.expires_at,
      days_remaining: Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }
  });
});
```

**Критерії завершення:**
- [ ] Серверна валідація працює
- [ ] Heartbeat monitoring активний
- [ ] Device binding реалізований
- [ ] Anomaly detection працює

---

### **ФАЗА 2: ВАЖЛИВІ ВИПРАВЛЕННЯ (1 тиждень)**

#### **День 4-5: API Authentication** 🟠

**Завдання:**
- [ ] **4.1** Впровадити JWT токени для API
- [ ] **4.2** Додати device-based authentication
- [ ] **4.3** Реалізувати token refresh mechanism
- [ ] **4.4** Додати API key rotation
- [ ] **4.5** Впровадити session management

**Код зміни:**
```typescript
// server/lib/auth.ts
export function generateDeviceToken(deviceId: string, licenseId: string): string {
  const payload = {
    deviceId,
    licenseId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 години
    type: 'device'
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET!);
}

export function validateDeviceToken(token: string): { valid: boolean; deviceId?: string; licenseId?: string } {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (decoded.type !== 'device') {
      return { valid: false };
    }
    
    return {
      valid: true,
      deviceId: decoded.deviceId,
      licenseId: decoded.licenseId
    };
  } catch (error) {
    return { valid: false };
  }
}
```

**Критерії завершення:**
- [ ] JWT токени працюють
- [ ] Device authentication реалізований
- [ ] Token refresh працює
- [ ] API key rotation активний

---

#### **День 6-7: Improved Rate Limiting** 🟠

**Завдання:**
- [ ] **6.1** Додати device-based rate limiting
- [ ] **6.2** Впровадити behavioral analysis
- [ ] **6.3** Додати CAPTCHA для підозрілої активності
- [ ] **6.4** Реалізувати adaptive rate limiting
- [ ] **6.5** Додати threat detection

**Код зміни:**
```typescript
// server/lib/rate-limit.ts
export async function checkDeviceRateLimit(
  deviceId: string, 
  action: string
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  
  // Device-based rate limiting
  const deviceKey = `device:${deviceId}:${action}`;
  const deviceLimit = await checkRateLimit(deviceKey, 'device');
  
  if (!deviceLimit.allowed) {
    return {
      allowed: false,
      remaining: 0,
      reset: deviceLimit.reset
    };
  }
  
  // Behavioral analysis
  const behaviorScore = await analyzeBehavior(deviceId);
  if (behaviorScore > 0.8) { // Підозріла активність
    return {
      allowed: false,
      remaining: 0,
      reset: Date.now() + (60 * 60 * 1000) // 1 година блокування
    };
  }
  
  return {
    allowed: true,
    remaining: deviceLimit.remaining,
    reset: deviceLimit.reset
  };
}

async function analyzeBehavior(deviceId: string): Promise<number> {
  // Аналіз поведінки:
  // - Частота запитів
  // - Патерни використання
  // - Географічне розташування
  // - User Agent аналіз
  
  const recentRequests = await getRecentRequests(deviceId, 24 * 60 * 60 * 1000); // 24 години
  
  let suspiciousScore = 0;
  
  // Перевірка частоти
  if (recentRequests.length > 1000) {
    suspiciousScore += 0.3;
  }
  
  // Перевірка патернів
  const timePatterns = analyzeTimePatterns(recentRequests);
  if (timePatterns.isRobotic) {
    suspiciousScore += 0.4;
  }
  
  // Перевірка географії
  const locations = analyzeLocations(recentRequests);
  if (locations.count > 5) { // Занадто багато локацій
    suspiciousScore += 0.3;
  }
  
  return Math.min(suspiciousScore, 1.0);
}
```

**Критерії завершення:**
- [ ] Device-based rate limiting працює
- [ ] Behavioral analysis реалізований
- [ ] CAPTCHA для підозрілої активності
- [ ] Adaptive rate limiting активний

---

### **ФАЗА 3: ПОКРАЩЕННЯ БЕЗПЕКИ (2-4 тижні)**

#### **Тиждень 3: Code Obfuscation** 🟡

**Завдання:**
- [ ] **3.1** Впровадити справжню обфускацію коду
- [ ] **3.2** Додати anti-debugging захист
- [ ] **3.3** Реалізувати runtime obfuscation
- [ ] **3.4** Додати integrity checking
- [ ] **3.5** Впровадити code signing

**Код зміни:**
```ruby
# plugin/proGran3/system/security/obfuscator.rb
module ProGran3
  module System
    module Security
      class CodeObfuscator
        
        def self.obfuscate_ruby_code(source_code)
          # 1. Видалення коментарів
          obfuscated = remove_comments(source_code)
          
          # 2. Мінімізація пробілів
          obfuscated = minimize_whitespace(obfuscated)
          
          # 3. Обфускація змінних
          obfuscated = obfuscate_variables(obfuscated)
          
          # 4. Обфускація рядків
          obfuscated = obfuscate_strings(obfuscated)
          
          # 5. Додавання junk code
          obfuscated = add_junk_code(obfuscated)
          
          # 6. Control flow obfuscation
          obfuscated = obfuscate_control_flow(obfuscated)
          
          obfuscated
        end
        
        def self.add_anti_debugging
          # Перевірка на debugger
          if defined?(Debugger) || defined?(Byebug)
            raise SecurityError, "Debugging detected"
          end
          
          # Перевірка на VM
          if vm_detected?
            raise SecurityError, "Virtual machine detected"
          end
          
          # Перевірка на sandbox
          if sandbox_detected?
            raise SecurityError, "Sandbox environment detected"
          end
        end
        
        def self.add_integrity_checking
          # Перевірка цілісності файлів
          expected_hashes = load_expected_hashes
          current_hashes = calculate_file_hashes
          
          expected_hashes.each do |file, expected_hash|
            current_hash = current_hashes[file]
            if current_hash != expected_hash
              raise SecurityError, "File integrity violation: #{file}"
            end
          end
        end
        
      end
    end
  end
end
```

**Критерії завершення:**
- [ ] Справжня обфускація працює
- [ ] Anti-debugging захист активний
- [ ] Runtime obfuscation реалізований
- [ ] Integrity checking працює

---

#### **Тиждень 4: Network Security** 🟡

**Завдання:**
- [ ] **4.1** Впровадити SSL pinning
- [ ] **4.2** Додати certificate transparency
- [ ] **4.3** Реалізувати secure communication protocol
- [ ] **4.4** Додати network anomaly detection
- [ ] **4.5** Впровадити traffic encryption

**Код зміни:**
```ruby
# plugin/proGran3/system/network/secure_client.rb
module ProGran3
  module System
    module Network
      class SecureClient
        
        # SSL Pinning
        PINNED_CERTIFICATES = [
          'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
          'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB='
        ].freeze
        
        def self.verify_ssl_certificate(hostname, certificate)
          # Перевірка pinned certificates
          cert_hash = calculate_certificate_hash(certificate)
          
          unless PINNED_CERTIFICATES.include?(cert_hash)
            raise SecurityError, "Certificate pinning violation"
          end
          
          # Перевірка certificate transparency
          unless verify_certificate_transparency(certificate)
            raise SecurityError, "Certificate transparency violation"
          end
          
          true
        end
        
        def self.encrypt_communication(data, session_key)
          # AES-256-GCM encryption
          cipher = OpenSSL::Cipher.new('AES-256-GCM')
          cipher.encrypt
          cipher.key = session_key
          
          iv = cipher.random_iv
          cipher.iv = iv
          
          encrypted = cipher.update(data) + cipher.final
          auth_tag = cipher.auth_tag
          
          {
            encrypted: Base64.strict_encode64(encrypted),
            iv: Base64.strict_encode64(iv),
            auth_tag: Base64.strict_encode64(auth_tag)
          }
        end
        
        def self.detect_network_anomalies(request_data)
          # Аналіз network patterns
          anomalies = []
          
          # Перевірка timing attacks
          if request_data[:timing] < 10 # Занадто швидко
            anomalies << :timing_attack
          end
          
          # Перевірка packet size
          if request_data[:size] > 1024 * 1024 # Занадто великий
            anomalies << :oversized_packet
          end
          
          # Перевірка frequency
          if request_data[:frequency] > 100 # Занадто часто
            anomalies << :frequency_attack
          end
          
          anomalies
        end
        
      end
    end
  end
end
```

**Критерії завершення:**
- [ ] SSL pinning працює
- [ ] Certificate transparency реалізований
- [ ] Secure communication protocol активний
- [ ] Network anomaly detection працює

---

## 📊 МЕТРИКИ УСПІХУ

### **Критичні метрики:**
- [ ] **CVSS Score:** < 4.0 для всіх вразливостей
- [ ] **Authentication:** 100% endpoints захищені
- [ ] **Encryption:** AES-256 для всіх даних
- [ ] **Monitoring:** Real-time threat detection

### **KPI безпеки:**
- [ ] **Security Score:** 8/10 (зараз 3/10)
- [ ] **Penetration Testing:** Пройдено успішно
- [ ] **Code Review:** Без критичних зауважень
- [ ] **Compliance:** Відповідність стандартам

### **Технічні метрики:**
- [ ] **Performance Impact:** < 5% зниження швидкості
- [ ] **Memory Usage:** < 10% збільшення
- [ ] **Network Overhead:** < 2% збільшення трафіку
- [ ] **User Experience:** Без помітних змін

---

## 🚨 КОНТРОЛЬНІ ТОЧКИ

### **Щоденні перевірки:**
- [ ] Всі критичні вразливості усунені
- [ ] Тести безпеки пройдені
- [ ] Performance метрики в нормі
- [ ] Логи без помилок

### **Тижневі перевірки:**
- [ ] Penetration testing
- [ ] Code review
- [ ] Security audit
- [ ] Compliance check

### **Місячні перевірки:**
- [ ] Повний security audit
- [ ] Threat modeling
- [ ] Incident response drill
- [ ] Security training

---

## 📞 ЕСКАЛАЦІЯ

### **Рівень 1: Розробники**
- Критичні вразливості
- Помилки в коді
- Performance issues

### **Рівень 2: Security Team**
- Security incidents
- Penetration testing failures
- Compliance violations

### **Рівень 3: Management**
- Major security breaches
- Legal issues
- Business impact

---

**Документ підготовлено:** Security Team  
**Дата:** 24 жовтня 2025  
**Версія:** 1.0  
**Статус:** APPROVED
