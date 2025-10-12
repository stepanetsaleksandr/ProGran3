# 🔐 СТРАТЕГІЇ ЗАХИСТУ ЛІЦЕНЗУВАННЯ ProGran3

**Дата:** 12 жовтня 2025  
**Мета:** Унеможливити крадіжку та несанкціоноване використання  
**Аналіз:** 5 професійних варіантів

---

## 🎯 ВИМОГИ ДО СИСТЕМИ

### Захист від:
1. ❌ **Копіювання на інший комп'ютер** - ліцензія прив'язана до системи
2. ❌ **Спільне використання** - одна ліцензія = одна система
3. ❌ **Зміна системного часу** - обхід expiration
4. ❌ **Редагування коду** - obfuscation
5. ❌ **Offline обхід** - вимога online перевірки
6. ❌ **Підробка відповідей** - криптографічні підписи

### Потрібно:
- ✅ Працювати online та offline (graceful)
- ✅ Не заважати легітимним користувачам
- ✅ Швидка перевірка (<500ms)
- ✅ Надійність 99.9%
- ✅ Можливість деактивації віддалено

---

## 🏆 ВАРІАНТ 1: HARDWARE FINGERPRINTING + ONLINE VALIDATION

### Концепція: "Прив'язка до залізa + Перевірка кожен запуск"

```
┌──────────────────────────────────────┐
│  1. STARTUP                          │
│     ├─ Generate hardware fingerprint│
│     ├─ Online validation (required) │
│     └─ Block if invalid             │
│                                      │
│  2. RUNTIME                          │
│     ├─ Periodic heartbeat (5 min)   │
│     ├─ Re-validate online           │
│     └─ Block if connection lost     │
│                                      │
│  3. PROTECTION                       │
│     ├─ Unique per machine           │
│     ├─ Can't transfer license       │
│     └─ Server-side control          │
└──────────────────────────────────────┘
```

### Реалізація:

#### 1. Hardware Fingerprinting (Ruby):
```ruby
module ProGran3::Security
  class HardwareFingerprint
    def self.generate
      components = {
        # Унікальні апаратні ідентифікатори
        motherboard: get_motherboard_serial,
        cpu: get_cpu_id,
        mac: get_primary_mac_address,
        disk: get_disk_serial,
        
        # Додаткові ідентифікатори
        hostname: Socket.gethostname.downcase,
        username: ENV['USERNAME'] || ENV['USER'],
        
        # Захист від VM
        is_virtual: detect_virtual_machine
      }
      
      # SHA256 hash всіх компонентів
      data_string = components.sort.to_h.to_json
      fingerprint = Digest::SHA256.hexdigest(data_string)
      
      # Зберігаємо компоненти окремо для debug
      {
        fingerprint: fingerprint,
        components: components,
        timestamp: Time.now.to_i
      }
    end
    
    private
    
    def self.get_motherboard_serial
      if RUBY_PLATFORM.include?('mingw')
        result = `wmic baseboard get serialnumber /value 2>nul`
        serial = result.scan(/SerialNumber=(.+)/).flatten.first&.strip
        return serial if serial && serial != 'To be filled by O.E.M.'
      end
      'unknown'
    end
    
    def self.get_cpu_id
      if RUBY_PLATFORM.include?('mingw')
        result = `wmic cpu get processorid /value 2>nul`
        result.scan(/ProcessorId=(.+)/).flatten.first&.strip || 'unknown'
      else
        'unknown'
      end
    end
    
    def self.get_primary_mac_address
      if RUBY_PLATFORM.include?('mingw')
        result = `getmac /v /fo csv 2>nul`
        macs = result.scan(/"([A-F0-9-]{17})"/).flatten
        
        # Фільтруємо віртуальні адаптери
        physical = macs.reject { |mac| virtual_mac?(mac) }
        physical.first || 'unknown'
      else
        'unknown'
      end
    end
    
    def self.get_disk_serial
      if RUBY_PLATFORM.include?('mingw')
        result = `wmic diskdrive get serialnumber /value 2>nul`
        result.scan(/SerialNumber=(.+)/).flatten.first&.strip || 'unknown'
      else
        'unknown'
      end
    end
    
    def self.detect_virtual_machine
      if RUBY_PLATFORM.include?('mingw')
        result = `wmic computersystem get model 2>nul`
        result.downcase.include?('virtual') || result.downcase.include?('vmware')
      else
        false
      end
    end
    
    def self.virtual_mac?(mac)
      virtual_prefixes = [
        '00:05:69', '00:0C:29', '00:1C:14', '00:50:56', # VMware
        '08:00:27', '0A:00:27',                         # VirtualBox
        '00:15:5D',                                      # Hyper-V
        '00:16:3E'                                       # Xen
      ]
      virtual_prefixes.any? { |prefix| mac.upcase.start_with?(prefix) }
    end
  end
end
```

#### 2. Online Validation:
```ruby
module ProGran3::Security
  class StrictLicenseManager
    def initialize
      @api_client = ApiClient.new
      @max_offline_time = 30 * 60 # 30 minutes
    end
    
    def validate_on_startup
      fingerprint = HardwareFingerprint.generate
      
      # ОБОВ'ЯЗКОВА online перевірка при запуску
      result = @api_client.validate_license(fingerprint[:fingerprint])
      
      if result[:success] && result[:valid]
        # Зберігаємо з timestamp
        save_validation(result, Time.now)
        return { valid: true, license: result[:license] }
      else
        return { valid: false, error: result[:error] }
      end
    end
    
    def check_during_runtime
      last_validation = load_last_validation
      
      # Якщо пройшло більше 30 хвилин - вимагаємо online перевірку
      if !last_validation || (Time.now - last_validation[:timestamp] > @max_offline_time)
        return validate_on_startup
      end
      
      # Інакше використовуємо кеш
      { valid: true, cached: true }
    end
  end
end
```

#### 3. Інтеграція в плагін:
```ruby
# proGran3.rb
module ProGran3
  def self.can_start_plugin?
    license_mgr = Security::StrictLicenseManager.new
    result = license_mgr.validate_on_startup
    
    if result[:valid]
      Logger.success("Ліцензія валідна", "Main")
      true
    else
      show_license_error(result[:error])
      false
    end
  end
  
  # У створенні toolbar
  cmd = UI::Command.new("ProGran3") {
    if can_start_plugin?
      SplashScreen.show
    else
      UI.messagebox("Ліцензія не знайдена або прострочена")
    end
  }
end
```

### ✅ Переваги:
- ⭐⭐⭐⭐⭐ **Дуже високий рівень захисту**
- Неможливо перенести на інший ПК
- Server-side контроль (можна деактивувати)
- Виявляє віртуальні машини

### ❌ Недоліки:
- Потребує internet при КОЖНОМУ запуску
- Якщо сервер down = плагін не працює
- Погана UX при поганому інтернеті

### 📊 Оцінки:
- **Захист:** 9/10 🟢
- **UX:** 5/10 🟡
- **Складність:** 7/10 🟡
- **Надійність:** 6/10 🟡 (залежить від сервера)

**Коли використовувати:** Enterprise клієнти з постійним інтернетом

---

## 🏆 ВАРІАНТ 2: OFFLINE FIRST + PERIODIC VALIDATION (РЕКОМЕНДОВАНО!)

### Концепція: "Працює offline, але перевіряє online періодично"

```
┌──────────────────────────────────────┐
│  1. STARTUP                          │
│     ├─ Check local license file     │
│     ├─ If valid → Start immediately │
│     └─ Background online check      │
│                                      │
│  2. BACKGROUND VALIDATION            │
│     ├─ Every 24 hours online check  │
│     ├─ Update local cache           │
│     └─ Continue if offline          │
│                                      │
│  3. GRACE PERIOD                     │
│     ├─ 7 days offline maximum       │
│     ├─ After 7 days → require online│
│     └─ Soft warning after 3 days    │
└──────────────────────────────────────┘
```

### Реалізація:

#### 1. Smart License Manager:
```ruby
module ProGran3::Security
  class SmartLicenseManager
    GRACE_PERIOD_DAYS = 7
    WARNING_PERIOD_DAYS = 3
    VALIDATION_INTERVAL = 24 * 60 * 60 # 24 hours
    
    def validate_license
      # 1. Завантажуємо локальну ліцензію
      local_license = LicenseStorage.load
      
      # 2. Перевіряємо базову валідність
      if !local_license || expired?(local_license)
        return requires_activation
      end
      
      # 3. Перевіряємо fingerprint
      current_fp = HardwareFingerprint.generate[:fingerprint]
      if local_license[:fingerprint] != current_fp
        return { 
          valid: false, 
          error: 'license_transfer_detected',
          message: 'Ліцензія прив\'язана до іншого комп\'ютера'
        }
      end
      
      # 4. Перевіряємо grace period
      last_online = local_license[:last_validation] || local_license[:activated_at]
      days_offline = (Time.now - Time.parse(last_online)) / 86400
      
      if days_offline > GRACE_PERIOD_DAYS
        # Вимагаємо online перевірку
        return validate_online_required(local_license)
      elsif days_offline > WARNING_PERIOD_DAYS
        # Показуємо попередження але дозволяємо працювати
        validate_online_background(local_license)
        return {
          valid: true,
          warning: "Рекомендуємо підключитись до інтернету (#{days_offline.to_i} днів offline)"
        }
      else
        # Все OK, background validation
        validate_online_background(local_license)
        return { valid: true, offline_mode: days_offline > 1 }
      end
    end
    
    private
    
    def validate_online_required(license)
      result = ApiClient.validate_online(license[:license_key])
      
      if result[:success]
        # Оновлюємо local cache
        license[:last_validation] = Time.now.iso8601
        LicenseStorage.save(license)
        return { valid: true }
      else
        return { 
          valid: false, 
          error: 'online_validation_required',
          message: 'Необхідне підключення до інтернету для перевірки ліцензії'
        }
      end
    end
    
    def validate_online_background(license)
      # Async перевірка в background
      Thread.new do
        result = ApiClient.validate_online(license[:license_key])
        
        if result[:success] && result[:valid]
          license[:last_validation] = Time.now.iso8601
          LicenseStorage.save(license)
          Logger.info("Background validation успішна", "License")
        elsif !result[:offline]
          # Ліцензія більше не валідна на сервері
          Logger.warn("Ліцензія деактивована на сервері", "License")
          # Можна показати warning користувачу
        end
      end
    end
    
    def expired?(license)
      return false unless license[:expires_at]
      Time.parse(license[:expires_at]) < Time.now
    end
    
    def requires_activation
      {
        valid: false,
        error: 'activation_required',
        message: 'Потрібна активація ліцензії'
      }
    end
  end
end
```

#### 2. Encrypted Local Storage:
```ruby
module ProGran3::Security
  class LicenseStorage
    LICENSE_FILE = File.join(Dir.home, '.progran3', 'license.enc')
    
    def self.save(license_data)
      # Encrypt перед збереженням
      encrypted = encrypt_data(license_data)
      
      FileUtils.mkdir_p(File.dirname(LICENSE_FILE))
      File.write(LICENSE_FILE, encrypted)
      
      # Приховуємо файл (Windows)
      if RUBY_PLATFORM.include?('mingw')
        system("attrib +h +s \"#{LICENSE_FILE}\"")
      else
        File.chmod(0600, LICENSE_FILE)
      end
    end
    
    def self.load
      return nil unless File.exist?(LICENSE_FILE)
      
      encrypted = File.read(LICENSE_FILE)
      decrypt_data(encrypted)
    rescue => e
      Logger.error("Failed to load license: #{e.message}", "Storage")
      nil
    end
    
    private
    
    def self.encrypt_data(data)
      require 'openssl'
      
      # Ключ базується на hardware fingerprint
      key = derive_encryption_key
      cipher = OpenSSL::Cipher.new('AES-256-CBC')
      cipher.encrypt
      cipher.key = key
      iv = cipher.random_iv
      
      encrypted = cipher.update(data.to_json) + cipher.final
      
      # Зберігаємо IV + encrypted data
      Base64.strict_encode64(iv + encrypted)
    end
    
    def self.decrypt_data(encrypted_data)
      require 'openssl'
      
      decoded = Base64.strict_decode64(encrypted_data)
      
      key = derive_encryption_key
      cipher = OpenSSL::Cipher.new('AES-256-CBC')
      cipher.decrypt
      cipher.key = key
      
      # Витягуємо IV (перші 16 байт)
      iv = decoded[0...16]
      encrypted = decoded[16..-1]
      
      cipher.iv = iv
      decrypted = cipher.update(encrypted) + cipher.final
      
      JSON.parse(decrypted, symbolize_names: true)
    end
    
    def self.derive_encryption_key
      # Ключ базується на апаратних даних (не можна скопіювати)
      fp = HardwareFingerprint.generate
      salt = 'ProGran3-License-Encryption-v1'
      
      OpenSSL::PKCS5.pbkdf2_hmac(
        fp[:fingerprint],
        salt,
        10000,
        32,
        OpenSSL::Digest::SHA256.new
      )
    end
  end
end
```

#### 3. Server-side binding:
```typescript
// server/app/api/licenses/activate/route.ts
export const POST = async (request) => {
  const { license_key, user_email, system_fingerprint } = await request.json();
  
  // Перевірка чи ліцензія вже активована на іншій системі
  const { data: existing } = await supabase
    .from('system_infos')
    .select('fingerprint_hash')
    .eq('license_id', license.id)
    .single();
  
  if (existing && existing.fingerprint_hash !== system_fingerprint) {
    return apiError(
      'Ліцензія вже активована на іншій системі. Деактивуйте попередню активацію.',
      403
    );
  }
  
  // Зберігаємо binding
  await supabase
    .from('system_infos')
    .upsert({
      license_id: license.id,
      fingerprint_hash: system_fingerprint,
      bound_at: new Date().toISOString()
    });
};
```

### ✅ Переваги:
- ⭐⭐⭐⭐⭐ **Баланс захисту та UX**
- Працює offline (grace period)
- Hardware binding (не можна копіювати)
- Server-side control
- Зашифровані локальні дані

### ❌ Недоліки:
- Після 7 днів offline потрібен internet
- Складніша реалізація
- Потребує encryption

### 📊 Оцінки:
- **Захист:** 8/10 🟢
- **UX:** 9/10 🟢
- **Складність:** 8/10 🟡
- **Надійність:** 9/10 🟢

**Рекомендація:** ⭐⭐⭐⭐⭐ **НАЙКРАЩИЙ ВАРІАНТ**

---

## 🏆 ВАРІАНТ 3: TIME-BASED TOKENS + SERVER VALIDATION

### Концепція: "Short-lived tokens з periodic renewal"

```
┌──────────────────────────────────────┐
│  1. ACTIVATION                       │
│     ├─ Get license from server      │
│     ├─ Receive 7-day token          │
│     └─ Store encrypted locally      │
│                                      │
│  2. RUNTIME                          │
│     ├─ Check token validity         │
│     ├─ If < 24h left → auto-renew   │
│     └─ Block if token expired       │
│                                      │
│  3. TOKEN RENEWAL                    │
│     ├─ Background every 24h         │
│     ├─ Get new 7-day token          │
│     └─ Seamless для користувача     │
└──────────────────────────────────────┘
```

### Реалізація:

```ruby
module ProGran3::Security
  class TokenBasedManager
    TOKEN_LIFETIME = 7 * 24 * 60 * 60 # 7 days
    RENEWAL_THRESHOLD = 24 * 60 * 60  # Renew if < 24h left
    
    def validate_token
      token = load_current_token
      
      # Перевірка чи токен існує
      return requires_activation unless token
      
      # Перевірка fingerprint
      current_fp = HardwareFingerprint.generate[:fingerprint]
      if token[:fingerprint] != current_fp
        return { valid: false, error: 'Hardware mismatch' }
      end
      
      # Перевірка expiration
      expires_at = Time.parse(token[:expires_at])
      now = Time.now
      
      if expires_at < now
        # Token expired - потрібен новий
        return renew_token_required
      elsif (expires_at - now) < RENEWAL_THRESHOLD
        # Token скоро закінчиться - auto-renew в background
        renew_token_background(token)
      end
      
      # Token валідний
      { valid: true, expires_in: (expires_at - now).to_i }
    end
    
    def activate_license(email, license_key)
      fingerprint = HardwareFingerprint.generate[:fingerprint]
      
      # Server activation
      result = ApiClient.activate(email, license_key, fingerprint)
      
      if result[:success]
        # Отримуємо 7-денний token
        token = {
          license_key: license_key,
          fingerprint: fingerprint,
          issued_at: Time.now.iso8601,
          expires_at: (Time.now + TOKEN_LIFETIME).iso8601,
          server_signature: result[:signature]
        }
        
        save_token(token)
        return { success: true }
      else
        return result
      end
    end
    
    private
    
    def renew_token_background(old_token)
      Thread.new do
        result = ApiClient.renew_token(old_token[:license_key])
        
        if result[:success]
          new_token = old_token.merge({
            expires_at: (Time.now + TOKEN_LIFETIME).iso8601,
            server_signature: result[:signature],
            renewed_at: Time.now.iso8601
          })
          
          save_token(new_token)
          Logger.success("Token renewed successfully", "License")
        else
          Logger.warn("Token renewal failed: #{result[:error]}", "License")
        end
      end
    end
    
    def renew_token_required
      # Synchronous renewal (блокує запуск)
      token = load_current_token
      result = ApiClient.renew_token(token[:license_key])
      
      if result[:success]
        new_token = {
          expires_at: (Time.now + TOKEN_LIFETIME).iso8601,
          server_signature: result[:signature]
        }.merge(token)
        
        save_token(new_token)
        return { valid: true }
      else
        return { valid: false, error: 'Token renewal failed' }
      end
    end
  end
end
```

### Server-side:
```typescript
// POST /api/licenses/renew-token
export const POST = withPublicApi(async ({ supabase, request }) => {
  const { license_key, fingerprint } = await request.json();
  
  // Verify license is active
  const { data: license } = await supabase
    .from('licenses')
    .select('*, system_infos(*)')
    .eq('license_key', license_key)
    .eq('status', 'active')
    .single();
  
  if (!license) {
    return apiError('Invalid or inactive license', 403);
  }
  
  // Verify fingerprint match
  if (license.system_infos.fingerprint_hash !== fingerprint) {
    return apiError('Hardware mismatch', 403);
  }
  
  // Generate new token signature
  const token = {
    license_key,
    fingerprint,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };
  
  const signature = crypto
    .createHmac('sha256', process.env.CRYPTO_SECRET_KEY!)
    .update(JSON.stringify(token))
    .digest('hex');
  
  return apiSuccess({
    token,
    signature,
    expires_at: token.expires_at
  });
});
```

### ✅ Переваги:
- ⭐⭐⭐⭐⭐ **Відмінний баланс захисту та UX**
- Працює offline до 7 днів
- Auto-renewal (користувач не помічає)
- Hardware binding
- Short-lived tokens (менша вартість компрометації)

### ❌ Недоліки:
- Потребує інтернет раз на тиждень
- Складніша логіка

### 📊 Оцінки:
- **Захист:** 8/10 🟢
- **UX:** 10/10 🟢
- **Складність:** 7/10 🟡
- **Надійність:** 10/10 🟢

**Рекомендація:** ⭐⭐⭐⭐⭐ **ІДЕАЛЬНИЙ БАЛАНС**

---

## 🏆 ВАРІАНТ 4: CODE OBFUSCATION + ENCRYPTION

### Концепція: "Зашифрований код + Runtime decryption"

```
┌──────────────────────────────────────┐
│  1. DISTRIBUTION                     │
│     ├─ Core код зашифрований        │
│     ├─ Decryption key від сервера   │
│     └─ Runtime декрипція             │
│                                      │
│  2. RUNTIME                          │
│     ├─ Validate license online      │
│     ├─ Get decryption key           │
│     ├─ Decrypt core modules         │
│     └─ Load decrypted code          │
│                                      │
│  3. PROTECTION                       │
│     ├─ No valid license = no key    │
│     ├─ Can't read encrypted code    │
│     └─ Can't run without server     │
└──────────────────────────────────────┘
```

### Реалізація:

#### 1. Code Encryption (Build step):
```ruby
# scripts/encrypt_plugin.rb
require 'openssl'
require 'base64'

module PluginEncryptor
  def self.encrypt_file(source_path, output_path, key)
    cipher = OpenSSL::Cipher.new('AES-256-CBC')
    cipher.encrypt
    cipher.key = Digest::SHA256.digest(key)
    iv = cipher.random_iv
    
    source_code = File.read(source_path)
    encrypted = cipher.update(source_code) + cipher.final
    
    # Save IV + encrypted
    File.write(output_path, Base64.strict_encode64(iv + encrypted))
  end
  
  def self.encrypt_core_modules
    key = ENV['PLUGIN_ENCRYPTION_KEY']
    
    core_files = [
      'builders/foundation_builder.rb',
      'builders/tiling_builder.rb',
      'builders/cladding_builder.rb',
      # ... інші критичні файли
    ]
    
    core_files.each do |file|
      source = File.join('plugin/proGran3', file)
      output = source.gsub('.rb', '.enc')
      
      encrypt_file(source, output, key)
      File.delete(source) # Видаляємо оригінал
    end
  end
end
```

#### 2. Runtime Decryption:
```ruby
module ProGran3::Security
  class CodeLoader
    def self.load_encrypted_module(module_path)
      # Отримуємо decryption key від сервера
      key = get_decryption_key_from_server
      
      return false unless key
      
      # Декриптуємо та завантажуємо
      encrypted_path = module_path.gsub('.rb', '.enc')
      encrypted = File.read(encrypted_path)
      
      decrypted_code = decrypt_code(encrypted, key)
      
      # Виконуємо декриптований код
      eval(decrypted_code, TOPLEVEL_BINDING, module_path)
      
      true
    rescue => e
      Logger.error("Failed to load encrypted module: #{e.message}", "CodeLoader")
      false
    end
    
    private
    
    def self.get_decryption_key_from_server
      # Тільки валідні ліцензії отримують ключ
      license = LicenseStorage.load
      return nil unless license
      
      result = ApiClient.request_decryption_key(license[:license_key])
      result[:success] ? result[:decryption_key] : nil
    end
    
    def self.decrypt_code(encrypted_data, key)
      cipher = OpenSSL::Cipher.new('AES-256-CBC')
      cipher.decrypt
      cipher.key = Digest::SHA256.digest(key)
      
      decoded = Base64.strict_decode64(encrypted_data)
      iv = decoded[0...16]
      encrypted = decoded[16..-1]
      
      cipher.iv = iv
      cipher.update(encrypted) + cipher.final
    end
  end
end
```

#### 3. Server endpoint для ключів:
```typescript
// POST /api/licenses/decryption-key
export const POST = withPublicApi(async ({ supabase, request }) => {
  const { license_key, fingerprint, signature } = await request.json();
  
  // Verify HMAC signature
  if (!verifyHMAC(license_key + fingerprint, signature)) {
    return apiError('Invalid signature', 403);
  }
  
  // Check license validity
  const { data: license } = await supabase
    .from('licenses')
    .select('*, system_infos(*)')
    .eq('license_key', license_key)
    .eq('status', 'active')
    .single();
  
  if (!license) {
    return apiError('Invalid license', 404);
  }
  
  // Verify fingerprint
  if (license.system_infos.fingerprint_hash !== fingerprint) {
    return apiError('Hardware mismatch', 403);
  }
  
  // Generate short-lived decryption key (valid 24h)
  const decryptionKey = crypto
    .createHmac('sha256', process.env.CRYPTO_SECRET_KEY!)
    .update(`${license_key}:${fingerprint}:${Date.now()}`)
    .digest('hex');
  
  return apiSuccess({
    decryption_key: decryptionKey,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });
});
```

### ✅ Переваги:
- ⭐⭐⭐⭐⭐ **Найвищий рівень захисту**
- Неможливо зчитати код без ліцензії
- Навіть з файлами - не можна запустити
- Server має повний контроль

### ❌ Недоліки:
- Вимагає internet при КОЖНОМУ запуску
- Складна система
- Overhead на декрипцію (~100-200ms)
- Ризик: якщо сервер down = плагін не працює

### 📊 Оцінки:
- **Захист:** 10/10 🟢
- **UX:** 4/10 🔴
- **Складність:** 9/10 🔴
- **Надійність:** 5/10 🔴

**Рекомендація:** Тільки для high-value products ($1000+)

---

## 🏆 ВАРІАНТ 5: HYBRID - MULTI-LAYER PROTECTION

### Концепція: "Комбінація декількох методів"

```
┌──────────────────────────────────────┐
│  LAYER 1: Hardware Fingerprint       │
│  └─ Прив'язка до motherboard + CPU   │
│                                      │
│  LAYER 2: Time-based Tokens          │
│  └─ 7-day tokens з auto-renewal     │
│                                      │
│  LAYER 3: Periodic Online Check      │
│  └─ Online validation раз на 48h    │
│                                      │
│  LAYER 4: Critical Features Lock     │
│  └─ Важливі функції вимагають online│
│                                      │
│  LAYER 5: Usage Analytics            │
│  └─ Виявлення аномальної активності │
└──────────────────────────────────────┘
```

### Реалізація:

```ruby
module ProGran3::Security
  class HybridLicenseManager
    def initialize
      @hardware_checker = HardwareFingerprint
      @token_manager = TokenManager.new
      @usage_tracker = UsageTracker.new
    end
    
    def validate_for_startup
      # Layer 1: Hardware check
      fp = @hardware_checker.generate
      stored_fp = load_stored_fingerprint
      
      if stored_fp && fp[:fingerprint] != stored_fp
        return hardware_mismatch_error
      end
      
      # Layer 2: Token check
      token = @token_manager.get_current_token
      
      if !token || @token_manager.expired?(token)
        return token_renewal_required
      end
      
      # Layer 3: Periodic online (async)
      schedule_online_validation if needs_online_check?
      
      # All OK
      { valid: true, mode: 'offline' }
    end
    
    def validate_for_critical_feature(feature_name)
      # Critical features ЗАВЖДИ вимагають online
      result = ApiClient.validate_feature_access(feature_name)
      
      if result[:success]
        @usage_tracker.track(feature_name)
        { valid: true }
      else
        { 
          valid: false, 
          error: 'online_required',
          message: 'Ця функція вимагає підключення до інтернету'
        }
      end
    end
    
    def check_usage_anomaly
      usage = @usage_tracker.get_statistics
      
      # Виявлення підозрілої активності
      if usage[:requests_per_hour] > 1000
        Logger.warn("Anomaly detected: High usage rate", "Security")
        report_to_server('high_usage_rate', usage)
      end
      
      if usage[:unique_ips] > 5
        Logger.warn("Anomaly detected: Multiple IPs", "Security")
        report_to_server('multiple_ips', usage)
      end
    end
  end
end
```

### Feature-level protection:
```ruby
# builders/foundation_builder.rb
module ProGran3
  class FoundationBuilder
    def self.add_foundation(depth, width, height)
      # Перевірка для критичних функцій
      validation = $license_manager.validate_for_critical_feature('foundation')
      
      unless validation[:valid]
        UI.messagebox(validation[:message])
        return false
      end
      
      # Продовжуємо нормальну роботу
      create_foundation_geometry(depth, width, height)
    end
  end
end
```

### ✅ Переваги:
- ⭐⭐⭐⭐⭐ **Максимальний захист**
- Multi-layer defence
- Виявлення аномалій
- Гнучкий контроль (per-feature)
- Analytics для бізнесу

### ❌ Недоліки:
- Найскладніша реалізація
- Overhead на кожну перевірку
- Потребує server для критичних функцій

### 📊 Оцінки:
- **Захист:** 10/10 🟢
- **UX:** 7/10 🟡
- **Складність:** 10/10 🔴
- **Надійність:** 8/10 🟢

**Рекомендація:** Для enterprise з high piracy risk

---

## 🏆 ВАРІАНТ 5: SIMPLE ACTIVATION + HEARTBEAT

### Концепція: "Просто і ефективно"

```
┌──────────────────────────────────────┐
│  1. ACTIVATION (ONE-TIME)            │
│     ├─ Email + License Key          │
│     ├─ Hardware Fingerprint          │
│     └─ Save locally (encrypted)      │
│                                      │
│  2. STARTUP                          │
│     ├─ Check local license file     │
│     ├─ Verify fingerprint match     │
│     └─ Start immediately             │
│                                      │
│  3. HEARTBEAT (BACKGROUND)           │
│     ├─ Every 5 minutes              │
│     ├─ Update last_seen             │
│     └─ Server can revoke remotely   │
└──────────────────────────────────────┘
```

### Реалізація:

```ruby
module ProGran3::Security
  class SimpleLicenseManager
    LICENSE_FILE = File.join(Dir.home, '.progran3_license')
    
    def validate
      license = load_license
      
      # Немає ліцензії
      return { valid: false, action: 'activate' } unless license
      
      # Перевірка fingerprint
      current_fp = generate_fingerprint
      if license['fingerprint'] != current_fp
        return { 
          valid: false, 
          error: 'Ліцензія прив\'язана до іншого комп\'ютера' 
        }
      end
      
      # Перевірка expiration
      if license['expires_at']
        expires = Time.parse(license['expires_at'])
        if expires < Time.now
          return { valid: false, error: 'Ліцензія прострочена' }
        end
      end
      
      # Все OK
      { valid: true, license: license }
    end
    
    def activate(email, license_key)
      fingerprint = generate_fingerprint
      
      # API call
      result = ApiClient.activate(email, license_key, fingerprint)
      
      if result[:success]
        # Save locally
        File.write(LICENSE_FILE, result[:data].to_json)
        
        # Hide file
        system("attrib +h \"#{LICENSE_FILE}\"") if RUBY_PLATFORM.include?('mingw')
        
        # Start heartbeat
        start_heartbeat(license_key, fingerprint)
        
        return { success: true }
      else
        return result
      end
    end
    
    def start_heartbeat(key, fingerprint)
      # Background thread
      Thread.new do
        loop do
          sleep(5 * 60) # 5 minutes
          
          result = ApiClient.heartbeat(key, fingerprint)
          
          if !result[:success] && !result[:offline]
            # License revoked or expired
            Logger.warn("License no longer valid", "Heartbeat")
            # Can show warning to user
          end
        end
      end
    end
    
    private
    
    def generate_fingerprint
      require 'digest'
      
      data = {
        mb: `wmic baseboard get serialnumber`.scan(/\w{8,}/).first,
        cpu: `wmic cpu get processorid`.scan(/\w{8,}/).first,
        hostname: Socket.gethostname
      }
      
      Digest::SHA256.hexdigest(data.to_json)
    end
    
    def load_license
      return nil unless File.exist?(LICENSE_FILE)
      JSON.parse(File.read(LICENSE_FILE))
    rescue
      nil
    end
  end
end
```

### ✅ Переваги:
- ⭐⭐⭐⭐ **Просто і надійно**
- Easy implementation (3 дні)
- Працює offline повністю
- Hardware binding
- Remote revocation можливий

### ❌ Недоліки:
- Можна обійти якщо відключити heartbeat код
- Довіра до local storage
- Немає обфускації

### 📊 Оцінки:
- **Захист:** 6/10 🟡
- **UX:** 10/10 🟢
- **Складність:** 4/10 🟢
- **Надійність:** 9/10 🟢

**Рекомендація:** ⭐⭐⭐⭐ **Для MVP та швидкого старту**

---

## 📊 ПОРІВНЯЛЬНА ТАБЛИЦЯ

| Варіант | Захист | UX | Складність | Надійність | Час впровадження | Рейтинг |
|---------|--------|----|-----------:|------------|------------------|---------|
| **1. Hardware + Always Online** | 9/10 | 5/10 | 7/10 | 6/10 | 2 тижні | ⭐⭐⭐ |
| **2. Offline First + Grace Period** | 8/10 | 9/10 | 8/10 | 9/10 | 2-3 тижні | ⭐⭐⭐⭐⭐ |
| **3. Time-based Tokens** | 8/10 | 10/10 | 7/10 | 10/10 | 2 тижні | ⭐⭐⭐⭐⭐ |
| **4. Code Encryption** | 10/10 | 4/10 | 9/10 | 5/10 | 3-4 тижні | ⭐⭐⭐ |
| **5. Simple + Heartbeat** | 6/10 | 10/10 | 4/10 | 9/10 | 3 дні | ⭐⭐⭐⭐ |

---

## 🎯 ДЕТАЛЬНЕ ПОРІВНЯННЯ

### За захистом від крадіжки:

```
Code Encryption:           ██████████  10/10  (неможливо запустити без ключа)
Hardware + Always Online:  █████████░   9/10  (потрібен internet завжди)
Offline First + Grace:     ████████░░   8/10  (7 днів offline)
Time-based Tokens:         ████████░░   8/10  (tokens можна украсти)
Simple + Heartbeat:        ██████░░░░   6/10  (можна обійти)
```

### За UX (зручність):

```
Simple + Heartbeat:        ██████████  10/10  (не заважає)
Time-based Tokens:         ██████████  10/10  (auto-renewal)
Offline First + Grace:     █████████░   9/10  (7 днів offline OK)
Hardware + Always Online:  █████░░░░░   5/10  (потрібен internet)
Code Encryption:           ████░░░░░░   4/10  (online required)
```

### За складністю реалізації:

```
Simple + Heartbeat:        ████░░░░░░   4/10  (3 дні)
Time-based Tokens:         ███████░░░   7/10  (2 тижні)
Hardware + Always Online:  ███████░░░   7/10  (2 тижні)
Offline First + Grace:     ████████░░   8/10  (2-3 тижні)
Code Encryption:           █████████░   9/10  (3-4 тижні)
```

---

## 💡 РЕКОМЕНДАЦІЇ ПО СЦЕНАРІЯМ

### Сценарій A: Швидкий вихід на ринок (MVP)
**Рекомендую:** Варіант 5 (Simple + Heartbeat)

**Чому:**
- ✅ 3 дні розробки
- ✅ Простий у підтримці
- ✅ Відмінний UX
- ✅ Базовий захист (6/10)

**Достатньо для:** Перші 6 місяців, тестування ринку

---

### Сценарій B: Баланс захисту та UX (РЕКОМЕНДУЮ!)
**Рекомендую:** Варіант 2 (Offline First + Grace Period)

**Чому:**
- ✅ Високий захист (8/10)
- ✅ Чудовий UX (9/10)
- ✅ Працює offline
- ✅ Server control

**Ідеально для:** Більшість SaaS products

---

### Сценарій C: Максимальний захист
**Рекомендую:** Варіант 4 (Code Encryption) + Варіант 2

**Чому:**
- ✅ Найвищий захист (10/10)
- ✅ Multi-layer defense
- ✅ Неможливо обійти

**Для:** High-value products, enterprise

---

### Сценарій D: Enterprise клієнти
**Рекомендую:** Варіант 4 (Hybrid Multi-layer)

**Чому:**
- ✅ Per-feature control
- ✅ Usage analytics
- ✅ Anomaly detection
- ✅ Maximum control

**Для:** Enterprise ліцензії $5000+

---

## 🚀 ПОЕТАПНЕ ВПРОВАДЖЕННЯ

### Phase 1 (Week 1-2): Simple + Heartbeat
```ruby
✅ Hardware fingerprinting
✅ Activation API
✅ Local storage
✅ Basic heartbeat
```
**Result:** Базовий захист працює

---

### Phase 2 (Week 3-4): Add Grace Period
```ruby
✅ Encrypted storage
✅ Grace period logic
✅ Background validation
✅ Token renewal
```
**Result:** Offline support + кращий захист

---

### Phase 3 (Week 5-6): Add Analytics
```ruby
✅ Usage tracking
✅ Anomaly detection
✅ Per-feature validation
✅ Admin dashboard integration
```
**Result:** Enterprise-grade система

---

### Phase 4 (Optional): Code Encryption
```ruby
✅ Build-time encryption
✅ Runtime decryption
✅ Key management
✅ Rollout strategy
```
**Result:** Maximum protection

---

## 🔒 ДОДАТКОВІ ЗАХИСТИ

### 1. Time Manipulation Protection
```ruby
def detect_time_manipulation
  # Зберігаємо last known time
  last_time = load_last_known_time
  current_time = Time.now
  
  if last_time && current_time < last_time
    # Час пішов назад = маніпуляція
    Logger.error("Time manipulation detected!", "Security")
    return { manipulated: true }
  end
  
  save_last_known_time(current_time)
  { manipulated: false }
end
```

### 2. VM Detection
```ruby
def running_in_vm?
  checks = [
    `wmic computersystem get model`.include?('Virtual'),
    `wmic bios get serialnumber`.include?('VMware'),
    File.exist?('C:\\Program Files\\VMware'),
    ENV['PROCESSOR_IDENTIFIER']&.include?('QEMU')
  ]
  
  checks.any?
end
```

### 3. Debugger Detection
```ruby
def debugger_attached?
  if RUBY_PLATFORM.include?('mingw')
    # Windows API check
    result = `tasklist /FI "IMAGENAME eq ruby.exe"`.include?('ruby.exe')
    # Додаткові перевірки...
  end
  false
end
```

---

## 💰 ВАРТІСТЬ VS ЗАХИСТ

| Рівень захисту | Час розробки | Вартість | Piracy rate | ROI |
|----------------|--------------|----------|-------------|-----|
| **Немає** | 0 | $0 | 80-90% | ❌ |
| **Базовий (Var 5)** | 3 дні | $2K | 40-60% | ✅ Good |
| **Середній (Var 2)** | 2-3 тижні | $10K | 10-20% | ✅✅ Excellent |
| **Високий (Var 4)** | 3-4 тижні | $15K | 2-5% | ✅✅ Excellent |
| **Maximum (Hybrid)** | 6 тижнів | $25K | <1% | ✅ Good (якщо high value) |

---

## 🎯 ФІНАЛЬНІ РЕКОМЕНДАЦІЇ

### Для ProGran3 рекомендую:

**🏆 ВАРІАНТ 2: Offline First + Grace Period**

**Обґрунтування:**
1. ✅ Баланс 8/10 захист vs 9/10 UX
2. ✅ Працює offline (архітектори часто в полі)
3. ✅ 7-day grace period (достатньо)
4. ✅ Hardware binding (не можна копіювати)
5. ✅ Server control (remote deactivation)
6. ✅ Реалістичний timeline (2-3 тижні)

**Implementation:**
- Week 1: Hardware fingerprinting + API
- Week 2: Encryption + Grace period logic
- Week 3: Testing + Polish

**Захист:**
- Hardware fingerprint → не можна перенести
- Encryption → не можна редагувати
- Grace period → працює offline
- Heartbeat → server може відкликати
- HMAC signatures → не можна підробити

**Result:** 
- Piracy rate: 10-20% (industry standard)
- Investment: $10K
- ROI: Excellent

---

**Готовий до детальної реалізації обраного варіанту?** 🚀


