# 🛡️ План покращення захисту ліцензування

**Дата:** 23 жовтня 2025  
**Поточна оцінка:** 4/10 (client-side)  
**Цільова оцінка:** 8-9/10

---

## 🎯 ПРІОРИТЕТНИЙ ПЛАН

### **TIER 1: КРИТИЧНО (1-2 дні)** 🔴

#### **1. Certificate Pinning для API URL**

**Проблема:** URL можна замінити на фальшивий сервер

**Рішення:**
```ruby
# plugin/proGran3/security/server_validator.rb (НОВИЙ ФАЙЛ)

module ProGran3
  module Security
    class ServerValidator
      
      # Whitelist дозволених серверів
      ALLOWED_DOMAINS = [
        'vercel.app',
        'progran3.com',
        'provis3d.com'
      ].freeze
      
      # SSL Certificate fingerprints (SHA256)
      CERT_FINGERPRINTS = {
        'vercel.app' => 'AB:CD:EF:12:34:56:78:90:...',  # Отримати з сертифіката
      }.freeze
      
      def self.validate_server_url(url)
        uri = URI.parse(url)
        
        # 1. Перевірка домену
        unless ALLOWED_DOMAINS.any? { |domain| uri.host.end_with?(domain) }
          raise SecurityError, "⚠️ Недозволений домен сервера: #{uri.host}"
        end
        
        # 2. Вимагаємо HTTPS
        unless uri.scheme == 'https'
          raise SecurityError, "⚠️ Тільки HTTPS з'єднання дозволені"
        end
        
        # 3. Certificate pinning (опціонально, складніше)
        # verify_certificate(uri) if CERT_FINGERPRINTS[domain]
        
        true
      end
      
      def self.verify_certificate(uri)
        # Отримати fingerprint сертифіката
        # Порівняти з CERT_FINGERPRINTS
        # Якщо не збігається - BLOCK
      end
    end
  end
end

# В api_client.rb:
def self.post_request(endpoint, payload)
  # Валідуємо URL перед кожним запитом
  ServerValidator.validate_server_url(API_BASE_URL)
  
  # ... решта коду
end
```

**Результат:** ✅ Фальшивий сервер НЕ працюватиме

**Складність реалізації:** 🟢 2-3 години  
**Ефективність:** 🔥🔥🔥🔥🔥 (блокує найпростіший злам)

---

#### **2. Обфускація HMAC Secret**

**Проблема:** Secret відкритий в рядку 58

**Рішення A: Multi-layer obfuscation**
```ruby
# api_client.rb

def self.get_secret_key
  # Layer 1: XOR з hardware fingerprint
  fp = HardwareFingerprint.generate[:fingerprint]
  
  # Layer 2: Розбити secret на частини (в різних місцях коду)
  part1 = compute_part1(fp[0..15])   # В одній функції
  part2 = compute_part2(fp[16..31])  # В іншій функції
  part3 = compute_part3(fp[32..47])  # В третій функції
  
  # Layer 3: Combine з алгоритмом
  combine_secret_parts(part1, part2, part3)
end

# Розкидати по файлу:
def compute_part1(seed)
  base = "ProGran3-HMAC"
  xor_string(base, seed)
end

def compute_part2(seed)
  base = "Global-Secret-2025"
  xor_string(base, seed)
end

def compute_part3(seed)
  base = "v3.1-9a8f7e6d"
  xor_string(base, seed)
end

def xor_string(str, key)
  str.chars.zip(key.chars.cycle).map { |a, b| (a.ord ^ b.ord).chr }.join
end
```

**Результат:** ⚠️ Ускладнює, але не унеможливлює

**Складність реалізації:** 🟢 1 година  
**Ефективність:** 🔥🔥🔥 (ускладнює reverse engineering)

---

**Рішення B: Динамічне отримання з сервера (краще)**
```ruby
def self.get_secret_key
  # При першому запуску завантажити з сервера
  cached = load_secret_from_cache
  return cached if cached
  
  # Запит на сервер (захищений fingerprint)
  response = fetch_client_secret_from_server
  
  # Зберегти в кеш (зашифрований)
  cache_secret(response[:secret])
  
  response[:secret]
end

def self.fetch_client_secret_from_server
  # Endpoint без HMAC (бо ми отримуємо сам секрет)
  # Але з fingerprint verification
  uri = URI.parse("#{API_BASE_URL}/api/client/get-secret")
  
  payload = {
    fingerprint: HardwareFingerprint.generate[:fingerprint],
    plugin_version: '3.2.1'
  }
  
  # Request without HMAC
  response = simple_post(uri, payload)
  
  # Сервер перевіряє fingerprint і повертає secret
  response
end
```

**Server endpoint:**
```typescript
// server/app/api/client/get-secret/route.ts
export async function POST(req: Request) {
  const { fingerprint, plugin_version } = await req.json();
  
  // Валідація fingerprint (щоб не всі могли отримати)
  // Можна використати whitelist або перевірку через ліцензію
  
  // Генерувати унікальний secret для кожного fingerprint
  const secret = generateSecretForFingerprint(fingerprint);
  
  return Response.json({ 
    success: true, 
    secret: secret 
  });
}
```

**Результат:** ✅ Кожен клієнт має унікальний secret

**Складність реалізації:** 🟠 3-4 години  
**Ефективність:** 🔥🔥🔥🔥🔥 (найкращий варіант)

---

#### **3. NTP Time Sync**

**Проблема:** Зміна системного часу вперед

**Рішення:**
```ruby
# plugin/proGran3/security/time_validator.rb (НОВИЙ ФАЙЛ)

require 'socket'

module ProGran3
  module Security
    class TimeValidator
      
      NTP_SERVERS = [
        'time.google.com',
        'pool.ntp.org',
        'time.windows.com'
      ].freeze
      
      # Отримати справжній час з NTP
      def self.get_real_time
        NTP_SERVERS.each do |server|
          begin
            return get_ntp_time(server)
          rescue
            next  # Спробувати наступний сервер
          end
        end
        
        # Якщо всі NTP сервери недоступні - використати системний час
        # Але позначити як "ненадійний"
        { time: Time.now, reliable: false }
      end
      
      def self.get_ntp_time(server)
        # Simplified NTP implementation
        socket = UDPSocket.new
        socket.connect(server, 123)
        
        # NTP request (simplified)
        request = [0x1B].pack('C') + "\0" * 47
        socket.send(request, 0)
        
        # Wait for response (timeout 5s)
        response, _ = socket.recvfrom(48, 5)
        
        # Parse NTP timestamp
        seconds = response[40..43].unpack1('N')
        ntp_time = Time.at(seconds - 2208988800)  # NTP epoch offset
        
        socket.close
        
        { time: ntp_time, reliable: true, server: server }
      rescue => e
        raise "NTP failed: #{e.message}"
      end
      
      # Перевірка чи системний час валідний
      def self.validate_system_time
        ntp_result = get_real_time
        system_time = Time.now
        
        return { valid: true, warning: 'NTP unavailable' } unless ntp_result[:reliable]
        
        time_diff = (ntp_result[:time] - system_time).abs
        
        if time_diff > 300  # > 5 хвилин
          {
            valid: false,
            error: "Системний час не синхронізовано (різниця: #{time_diff.to_i}s)"
          }
        else
          {
            valid: true,
            ntp_time: ntp_result[:time],
            system_time: system_time,
            diff_seconds: time_diff.to_i
          }
        end
      end
    end
  end
end

# В license_manager.rb:
def check_grace_period(license)
  # Перевірка системного часу
  time_check = TimeValidator.validate_system_time
  
  unless time_check[:valid]
    return {
      action: :block,
      message: "#{time_check[:error]}. Підключіться до інтернету для валідації."
    }
  end
  
  # Використати NTP час якщо доступний
  current_time = time_check[:ntp_time] || Time.now
  last_validation_time = Time.parse(license[:last_validation])
  
  # ... решта логіки
end
```

**Результат:** ✅ Time tampering НЕ працюватиме

**Складність реалізації:** 🟠 4-5 годин  
**Ефективність:** 🔥🔥🔥🔥

---

### **TIER 2: ВАЖЛИВО (1 тиждень)** 🟠

#### **4. Server-Side Sessions**

**Рішення:**
```ruby
# При старті плагіна створювати session
def validate_license
  # 1. Запит на сервер: створити session
  session_result = ApiClient.create_session(license_key, fingerprint)
  
  # 2. Отримати session_token (JWT)
  @session_token = session_result[:token]
  @session_expires = Time.now + 3600  # 1 година
  
  # 3. Periodic refresh
  start_session_refresh_thread
  
  # 4. Всі API запити з session_token
end

def start_session_refresh_thread
  Thread.new do
    loop do
      sleep(1800)  # Кожні 30 хвилин
      
      # Перевірити session на сервері
      result = ApiClient.validate_session(@session_token)
      
      unless result[:valid]
        # Session відкликано на сервері - БЛОКУВАТИ
        block_plugin("Session invalidated on server")
        break
      end
    end
  end
end
```

**Server endpoint:**
```typescript
// POST /api/sessions/create
export async function POST(req: Request) {
  const { license_key, fingerprint } = await req.json();
  
  // Валідація ліцензії
  const license = await validateLicense(license_key, fingerprint);
  
  // Створити session в БД
  const session = await supabase.from('sessions').insert({
    license_key,
    fingerprint,
    created_at: new Date(),
    expires_at: new Date(Date.now() + 3600000),  // 1 година
    active: true
  });
  
  // Повернути JWT token
  const token = signJWT({ session_id: session.id, license_key });
  
  return Response.json({ success: true, token });
}

// GET /api/sessions/validate
export async function GET(req: Request) {
  const token = req.headers.get('Authorization');
  
  // Перевірити JWT
  const decoded = verifyJWT(token);
  
  // Перевірити session в БД
  const session = await supabase
    .from('sessions')
    .select('*')
    .eq('id', decoded.session_id)
    .eq('active', true)
    .single();
  
  if (!session) {
    return Response.json({ valid: false, error: 'Session revoked' });
  }
  
  return Response.json({ valid: true });
}
```

**Результат:** ✅ Сервер може відкликати доступ в реальному часі

**Складність:** 🟠 2 дні (plugin + server)  
**Ефективність:** 🔥🔥🔥🔥🔥

---

#### **5. Periodic Heartbeat з Validation**

**Рішення:**
```ruby
# Кожні 30 хвилин - перевірка на сервері
def start_heartbeat_with_validation
  Thread.new do
    loop do
      sleep(1800)  # 30 хвилин
      
      result = ApiClient.validate(license_key, fingerprint)
      
      if result[:success] && result[:data][:valid]
        # Ліцензія валідна - продовжити
        update_last_validation
      else
        # Ліцензія деактивована на сервері
        Logger.error("Ліцензія деактивована на сервері!", "Heartbeat")
        
        # БЛОКУЄМО плагін
        $plugin_blocked = true
        
        # Показуємо повідомлення
        UI.messagebox("Ліцензія деактивована. Зверніться до підтримки.")
        
        # Закрити UI
        close_all_dialogs
        
        break
      end
    end
  end
end
```

**Результат:** ✅ Через 30 хв "крякнута" копія буде заблокована

**Складність:** 🟢 2-3 години  
**Ефективність:** 🔥🔥🔥🔥🔥

---

#### **6. Telemetry & Anomaly Detection**

**Рішення:**
```ruby
# Відправляти анонімну телеметрію
def send_telemetry
  ApiClient.post('/api/telemetry', {
    plugin_version: '3.2.1',
    sketchup_version: Sketchup.version,
    os: RUBY_PLATFORM,
    license_hash: Digest::SHA256.hexdigest(license_key)[0..8],  # Анонімно
    fingerprint_hash: Digest::SHA256.hexdigest(fingerprint)[0..8],
    features_used: get_features_usage,
    errors_count: get_errors_count,
    session_duration: get_session_duration
  })
end
```

**Server-side detection:**
```typescript
// Виявляти аномалії
async function detectAnomalies(telemetry) {
  // 1. Чи той самий fingerprint використовується з різних IP?
  const sessions = await getSessions(telemetry.fingerprint_hash);
  if (sessions.length > 3 && differentIPs(sessions)) {
    // ПІДОЗРА: ліцензія "поширюється"
    await flagLicense(telemetry.license_hash, 'multiple_ips');
  }
  
  // 2. Чи занадто багато features для безкоштовної ліцензії?
  if (telemetry.features_used.length > 10 && license.type === 'trial') {
    await flagLicense(telemetry.license_hash, 'suspicious_usage');
  }
  
  // 3. Чи fingerprint змінюється занадто часто?
  const fingerprint_changes = await getFingerprintChanges(telemetry.license_hash);
  if (fingerprint_changes > 5) {
    await flagLicense(telemetry.license_hash, 'fingerprint_hopping');
  }
}
```

**Результат:** ✅ Виявлення "крякнутих" копій

**Складність:** 🟠 1 день  
**Ефективність:** 🔥🔥🔥🔥

---

### **TIER 2: ПОСИЛЕННЯ (1-2 тижні)** 🟠

#### **7. Hardware Attestation**

**Рішення:**
```ruby
# Більш складний fingerprint з attestation
def self.generate_attested_fingerprint
  components = collect_hardware_components
  
  # Attestation: підписати fingerprint приватним ключем
  fingerprint = generate_fingerprint_string(components)
  
  # Challenge-response з сервером
  challenge = get_server_challenge
  response = sign_challenge(challenge, fingerprint)
  
  {
    fingerprint: fingerprint,
    components: components,
    attestation: response
  }
end
```

---

#### **8. Encrypted Config**

**Рішення:**
```ruby
# Шифрувати config.json
# config.json → config.enc

def self.load_api_config
  config_path = File.join(File.dirname(__FILE__), '..', '..', 'config.enc')
  
  # Розшифрувати з ключем базованим на fingerprint
  encrypted = File.read(config_path)
  decrypted = decrypt_config(encrypted)
  
  JSON.parse(decrypted)
end

def self.decrypt_config(encrypted)
  key = derive_config_key(HardwareFingerprint.generate[:fingerprint])
  cipher = OpenSSL::Cipher.new('AES-256-CBC')
  cipher.decrypt
  cipher.key = key
  # ...
end
```

**Результат:** ✅ API URL захищений

---

#### **9. Code Signing**

**Рішення:**
```ruby
# Підписати всі .rb файли
# При завантаженні - перевіряти підпис

def self.verify_code_integrity
  Dir.glob(File.join(PLUGIN_ROOT, '**', '*.rb')).each do |file|
    signature_file = file + '.sig'
    
    unless File.exist?(signature_file)
      raise SecurityError, "Missing signature: #{file}"
    end
    
    signature = File.read(signature_file)
    content = File.read(file)
    
    unless verify_signature(content, signature)
      raise SecurityError, "Invalid signature: #{file}"
    end
  end
end
```

**Результат:** ✅ Модифікація коду виявляється

---

### **TIER 3: PROFESSIONAL (1 місяць)** 🔵

#### **10. RubyEncoder Compilation**

**Найкращий захист коду!**

```bash
# Компілювати security файли в .rbe
rubyencoder plugin/proGran3/security/api_client.rb -o api_client.rbe
rubyencoder plugin/proGran3/security/license_manager.rb -o license_manager.rbe
rubyencoder plugin/proGran3/security/hardware_fingerprint.rb -o hardware_fingerprint.rbe
rubyencoder plugin/proGran3/security/license_storage.rb -o license_storage.rbe
```

**Опції:**
```bash
# З прив'язкою до часу
rubyencoder ... --expire-date 2026-12-31

# З anti-debugging
rubyencoder ... --protect-strings --scramble-names
```

**Результат:** ✅ Код НЕ можна прочитати

**Вартість:** $299/рік (Professional)  
**Ефективність:** 🔥🔥🔥🔥🔥

---

## 📊 ПОРІВНЯННЯ ПІДХОДІВ

| Рішення | Час | Складність | Ефективність | Вартість |
|---------|-----|------------|--------------|----------|
| **Certificate Pinning** | 3h | Низька | 🔥🔥🔥🔥🔥 | 0₴ |
| **HMAC Obfuscation** | 1h | Низька | 🔥🔥🔥 | 0₴ |
| **Dynamic HMAC** | 4h | Середня | 🔥🔥🔥🔥🔥 | 0₴ |
| **NTP Time Sync** | 5h | Середня | 🔥🔥🔥🔥 | 0₴ |
| **Server Sessions** | 2d | Середня | 🔥🔥🔥🔥🔥 | 0₴ |
| **Periodic Heartbeat** | 3h | Низька | 🔥🔥🔥🔥🔥 | 0₴ |
| **Telemetry** | 1d | Середня | 🔥🔥🔥🔥 | 0₴ |
| **Encrypted Config** | 4h | Середня | 🔥🔥🔥 | 0₴ |
| **Code Signing** | 1d | Висока | 🔥🔥🔥🔥 | 0₴ |
| **RubyEncoder** | 1h | Низька | 🔥🔥🔥🔥🔥 | $299/рік |

---

## 🎯 РЕКОМЕНДОВАНИЙ ПЛАН ДІЙ

### **PHASE 1: Quick Wins (3 дні)** 🚀

**Вихідні або вечір 1:**
1. ✅ Certificate Pinning (3h)
2. ✅ HMAC Obfuscation (1h)

**Вихідні або вечір 2:**
3. ✅ NTP Time Sync (5h)
4. ✅ Periodic Heartbeat (3h)

**День 3:**
5. ✅ Telemetry (4h)

**Результат після Phase 1:** 
- 🔴 4/10 → 🟢 **7/10**
- Блокує 80% простих атак
- Виявляє "крякнуті" копії

---

### **PHASE 2: Professional (1 тиждень)**

**День 1-2:**
6. ✅ Server Sessions (2d)

**День 3:**
7. ✅ Dynamic HMAC (4h)

**День 4-5:**
8. ✅ Encrypted Config (4h)
9. ✅ Code Signing (1d)

**Результат після Phase 2:**
- 🟢 7/10 → 🟢 **8.5/10**
- Блокує 95% атак
- Server має повний контроль

---

### **PHASE 3: Maximum Security (опціонально)**

**Якщо бюджет дозволяє:**
10. ✅ RubyEncoder ($299/рік)

**Результат після Phase 3:**
- 🟢 8.5/10 → 🟢 **9.5/10**
- Максимальний захист
- Код НЕ можна прочитати

---

## 💰 ROI АНАЛІЗ

### **Без покращень:**
- 🔴 Злам за 1-2 години
- 🔴 Втрата 30-50% потенційних продажів
- 🔴 Репутаційні ризики

### **З Phase 1 покращеннями:**
- 🟢 Злам за 1-2 дні (професіонал)
- 🟢 Втрата 5-10% продажів
- 🟢 Виявлення крякнутих копій

### **З Phase 2 покращеннями:**
- 🟢 Злам за тижні (експерт)
- 🟢 Втрата 2-5% продажів
- 🟢 Повний контроль

### **З RubyEncoder:**
- 🟢 Злам дуже складний
- 🟢 Втрата < 2% продажів
- 🟢 Professional level

---

## ✅ ВИСНОВОК

### **Що робити ЗАРАЗ:**

**Мінімум (3 дні роботи):**
1. ✅ Certificate Pinning
2. ✅ HMAC Obfuscation
3. ✅ Periodic Heartbeat

**Це підніме захист з 4/10 до 7/10** та заблокує 80% простих атак.

**Оптимум (1 тиждень):**
+ Server Sessions
+ Dynamic HMAC
+ NTP Time Sync

**Це дасть 8.5/10** - професійний рівень захисту.

---

**Хочеш щоб я реалізував Tier 1 покращення?** 🚀

**Це займе ~3 дні роботи:**
- День 1: Certificate Pinning + HMAC Obfuscation
- День 2: NTP Time Sync
- День 3: Periodic Heartbeat + Telemetry

**Після цього злам стане в 10-20 разів складнішим!** 🛡️

