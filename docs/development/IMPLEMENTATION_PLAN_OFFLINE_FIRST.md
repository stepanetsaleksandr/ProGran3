# 📋 ПЛАН РЕАЛІЗАЦІЇ: Offline First + Grace Period License System

**Проект:** ProGran3 License Protection  
**Варіант:** #2 - Offline First + Grace Period  
**Дата:** 12 жовтня 2025  
**Timeline:** 2-3 тижні  
**Складність:** 8/10

---

## 🎯 EXECUTIVE SUMMARY

### Що реалізуємо:
Система ліцензування з hardware binding, offline підтримкою до 7 днів, автоматичною фоновою валідацією та повним server-side контролем.

### Ключові характеристики:
- **Захист:** 8/10 (hardware fingerprint + encryption)
- **UX:** 9/10 (працює offline, не заважає користувачу)
- **Надійність:** 9/10 (graceful degradation)
- **Timeline:** 2-3 тижні
- **Piracy prevention:** 80-90%

---

## 📊 ІСНУЮЧА АРХІТЕКТУРА (ПРИВ'ЯЗКА)

### Сервер (вже готово ✅):
```
server/
├── app/api/
│   ├── licenses/
│   │   ├── route.ts                    ✅ List/Create
│   │   ├── generate/route.ts           ✅ Generate
│   │   ├── activate/route.ts           ✅ Activate (ГОТОВО!)
│   │   └── [id]/route.ts               ✅ CRUD
│   ├── heartbeats/route.ts             ✅ ГОТОВО!
│   ├── systems/route.ts                ✅ ГОТОВО!
│   └── dashboard/stats/route.ts        ✅ Stats
│
├── lib/
│   ├── api-handler.ts                  ✅ Middleware
│   ├── api-response.ts                 ✅ Responses
│   ├── validation/schemas.ts           ✅ Zod schemas
│   ├── supabase.ts                     ✅ DB client
│   └── [ДОДАТИ] crypto.ts              🆕 HMAC, signatures
│
└── .env.local                           ✅ Все налаштовано
```

### Плагін (потрібно створити 🆕):
```
plugin/proGran3/
├── security/ (ПОРОЖНЯ → ЗАПОВНИТИ!)    🆕 Головна робота
│   ├── hardware_fingerprint.rb         🆕 MB/CPU/MAC detection
│   ├── license_manager.rb              🆕 Головний контролер
│   ├── api_client.rb                   🆕 HTTP communication
│   ├── license_storage.rb              🆕 Encrypted storage
│   ├── grace_period_manager.rb         🆕 Grace period logic
│   └── crypto_utils.rb                 🆕 Encryption helpers
│
├── ui.rb                               ✏️ Додати callbacks
├── splash_screen.rb                    ✏️ Додати validation
├── license_ui.rb                       ✏️ Додати activation
└── proGran3.rb                         ✏️ Integrate security
```

### База даних (мінімальні зміни):
```sql
-- Вже є в Supabase:
licenses         ✅ Готова
users            ✅ Готова
system_infos     ✅ Готова (fingerprint_hash)
heartbeats       ✅ Готова

-- Додати колонку (опціонально):
ALTER TABLE system_infos 
ADD COLUMN IF NOT EXISTS bound_at TIMESTAMP;
```

---

## 📅 ДЕТАЛЬНИЙ TIMELINE

### **WEEK 1: Ruby Security Modules**

#### Day 1-2: Hardware Fingerprinting
**Файл:** `plugin/proGran3/security/hardware_fingerprint.rb`

**Завдання:**
- [x] Створити module HardwareFingerprint
- [x] Реалізувати get_motherboard_serial (Windows/Mac/Linux)
- [x] Реалізувати get_cpu_id
- [x] Реалізувати get_primary_mac
- [x] Реалізувати get_disk_serial
- [x] Додати VM detection
- [x] Додати fingerprint caching (1 год TTL)
- [x] Тестування на різних системах

**Критерії успіху:**
- Генерує унікальний 64-char SHA256 hash
- Стабільний на одній системі
- Різний на різних системах
- Час генерації <100ms

**Код структура:**
```ruby
module ProGran3::Security
  class HardwareFingerprint
    def self.generate
      # Implementation
    end
    
    def self.get_motherboard_serial
      # Windows: wmic baseboard get serialnumber
      # Mac: system_profiler SPHardwareDataType
      # Linux: dmidecode
    end
    
    # ... інші методи
  end
end
```

---

#### Day 3-4: API Client
**Файл:** `plugin/proGran3/security/api_client.rb`

**Завдання:**
- [x] HTTP client з Net::HTTP
- [x] HTTPS підтримка
- [x] Timeout configuration (10s)
- [x] Retry logic (3 спроби, exponential backoff)
- [x] Thread wrapper для async
- [x] HMAC signature generation
- [x] Error handling
- [x] Offline detection

**Методи:**
```ruby
module ProGran3::Security
  class ApiClient
    BASE_URL = 'https://server-i2vb5ob17-provis3ds-projects.vercel.app/api'
    
    def self.activate_license(email, license_key, fingerprint)
      # POST /licenses/activate
    end
    
    def self.validate_license(license_key, fingerprint)
      # POST /licenses/validate (створити endpoint)
    end
    
    def self.send_heartbeat(license_key, fingerprint)
      # POST /heartbeats (вже є!)
    end
    
    def self.renew_token(license_key, fingerprint)
      # POST /licenses/renew (створити endpoint)
    end
    
    private
    
    def self.make_request(endpoint, data, options = {})
      # Net::HTTP implementation
    end
    
    def self.make_request_async(endpoint, data, callback)
      # Thread wrapper
    end
  end
end
```

---

#### Day 5: Encrypted Storage
**Файл:** `plugin/proGran3/security/license_storage.rb`

**Завдання:**
- [x] AES-256-CBC encryption
- [x] Key derivation з hardware fingerprint
- [x] Save/Load методи
- [x] File hiding (Windows attrib +h +s)
- [x] Permissions (chmod 600 на Unix)
- [x] Backup mechanism
- [x] Corruption recovery

**Структура файлу:**
```ruby
module ProGran3::Security
  class LicenseStorage
    LICENSE_DIR = File.join(Dir.home, '.progran3')
    LICENSE_FILE = File.join(LICENSE_DIR, 'license.enc')
    BACKUP_FILE = File.join(LICENSE_DIR, 'license.bak')
    
    def self.save(license_data)
      # Encrypt + Save
    end
    
    def self.load
      # Load + Decrypt
    end
    
    private
    
    def self.encrypt_data(data)
      # AES-256-CBC
    end
    
    def self.decrypt_data(encrypted)
      # Decrypt
    end
    
    def self.derive_encryption_key
      # PBKDF2 з hardware fingerprint
    end
  end
end
```

---

### **WEEK 2: License Logic & Server Integration**

#### Day 6-7: Grace Period Manager
**Файл:** `plugin/proGran3/security/grace_period_manager.rb`

**Завдання:**
- [x] Grace period константи (7 днів)
- [x] Warning threshold (3 дні)
- [x] Offline time calculation
- [x] Warning messages
- [x] Force online logic
- [x] UI notifications

**Логіка:**
```ruby
module ProGran3::Security
  class GracePeriodManager
    GRACE_PERIOD_DAYS = 7
    WARNING_PERIOD_DAYS = 3
    
    def self.check_grace_period(license)
      last_online = Time.parse(license[:last_validation])
      days_offline = (Time.now - last_online) / 86400
      
      if days_offline > GRACE_PERIOD_DAYS
        return {
          status: :expired,
          message: 'Необхідне підключення до інтернету',
          days_offline: days_offline.to_i,
          action: :block
        }
      elsif days_offline > WARNING_PERIOD_DAYS
        return {
          status: :warning,
          message: "Підключіться до інтернету (#{days_offline.to_i} днів offline)",
          days_offline: days_offline.to_i,
          action: :warn
        }
      else
        return {
          status: :ok,
          days_offline: days_offline.to_i,
          action: :continue
        }
      end
    end
  end
end
```

---

#### Day 8-9: Main License Manager
**Файл:** `plugin/proGran3/security/license_manager.rb`

**Завдання:**
- [x] Координація всіх модулів
- [x] Startup validation
- [x] Background validation
- [x] Heartbeat scheduling
- [x] Error handling
- [x] Fallback logic

**Головний контролер:**
```ruby
module ProGran3::Security
  class LicenseManager
    attr_reader :current_license, :validation_status
    
    def initialize
      @api_client = ApiClient
      @storage = LicenseStorage
      @grace_mgr = GracePeriodManager
      @heartbeat_timer = nil
      @validation_cache = {}
    end
    
    # ГОЛОВНИЙ МЕТОД - викликається при запуску
    def validate_license
      Logger.info("Starting license validation...", "LicenseManager")
      
      # 1. Завантажуємо локальну ліцензію
      @current_license = @storage.load
      
      if !@current_license
        return requires_activation
      end
      
      # 2. Перевіряємо hardware fingerprint
      current_fp = HardwareFingerprint.generate[:fingerprint]
      
      if @current_license[:fingerprint] != current_fp
        Logger.error("Hardware fingerprint mismatch!", "LicenseManager")
        return {
          valid: false,
          error: :hardware_mismatch,
          message: 'Ліцензія прив\'язана до іншого комп\'ютера'
        }
      end
      
      # 3. Перевіряємо expiration
      if license_expired?(@current_license)
        return {
          valid: false,
          error: :expired,
          message: 'Ліцензія прострочена'
        }
      end
      
      # 4. Перевіряємо grace period
      grace_status = @grace_mgr.check_grace_period(@current_license)
      
      case grace_status[:action]
      when :block
        # Вимагаємо online validation
        return validate_online_required
      when :warn
        # Показуємо warning, але дозволяємо працювати
        validate_online_background
        return {
          valid: true,
          warning: grace_status[:message],
          days_offline: grace_status[:days_offline]
        }
      else
        # Все OK, background validation
        validate_online_background
        return {
          valid: true,
          offline_mode: grace_status[:days_offline] > 0
        }
      end
    end
    
    # Активація нової ліцензії
    def activate_license(email, license_key)
      Logger.info("Activating license for #{email}", "LicenseManager")
      
      # Generate fingerprint
      fp_data = HardwareFingerprint.generate
      fingerprint = fp_data[:fingerprint]
      
      # Call server API
      result = @api_client.activate_license(email, license_key, fingerprint)
      
      if result[:success]
        # Prepare license data
        license_data = {
          license_key: license_key,
          user_email: email,
          fingerprint: fingerprint,
          activated_at: Time.now.iso8601,
          last_validation: Time.now.iso8601,
          expires_at: result[:data][:expires_at],
          duration_days: result[:data][:duration_days],
          hardware_components: fp_data[:components]
        }
        
        # Save encrypted
        @storage.save(license_data)
        @current_license = license_data
        
        # Start heartbeat
        start_heartbeat_timer
        
        Logger.success("License activated successfully", "LicenseManager")
        
        return {
          success: true,
          license: license_data,
          message: 'Ліцензія успішно активована!'
        }
      else
        Logger.error("Activation failed: #{result[:error]}", "LicenseManager")
        return result
      end
    end
    
    # Запуск heartbeat таймера
    def start_heartbeat_timer
      # Зупиняємо старий таймер якщо є
      stop_heartbeat_timer
      
      Logger.info("Starting heartbeat timer (5 min interval)", "LicenseManager")
      
      @heartbeat_timer = UI.start_timer(300, true) do # 5 хвилин
        send_heartbeat_background
      end
    end
    
    def stop_heartbeat_timer
      if @heartbeat_timer
        UI.stop_timer(@heartbeat_timer)
        @heartbeat_timer = nil
        Logger.info("Heartbeat timer stopped", "LicenseManager")
      end
    end
    
    # Отримання інформації про ліцензію
    def get_license_info
      return nil unless @current_license
      
      expires_at = Time.parse(@current_license[:expires_at])
      days_remaining = ((expires_at - Time.now) / 86400).to_i
      
      last_validation = Time.parse(@current_license[:last_validation])
      days_offline = ((Time.now - last_validation) / 86400).to_i
      
      {
        email: @current_license[:user_email],
        license_key: obfuscate_key(@current_license[:license_key]),
        status: license_expired?(@current_license) ? 'expired' : 'active',
        expires_at: @current_license[:expires_at],
        days_remaining: days_remaining,
        days_offline: days_offline,
        activated_at: @current_license[:activated_at]
      }
    end
    
    private
    
    # ОБОВ'ЯЗКОВА online validation
    def validate_online_required
      Logger.warn("Grace period expired, online validation required", "LicenseManager")
      
      result = @api_client.validate_license(
        @current_license[:license_key],
        @current_license[:fingerprint]
      )
      
      if result[:success] && result[:valid]
        # Оновлюємо timestamp
        @current_license[:last_validation] = Time.now.iso8601
        @storage.save(@current_license)
        
        Logger.success("Online validation successful", "LicenseManager")
        
        return { valid: true, online_validated: true }
      else
        Logger.error("Online validation failed: #{result[:error]}", "LicenseManager")
        
        return {
          valid: false,
          error: :online_validation_failed,
          message: 'Необхідне підключення до інтернету для перевірки ліцензії',
          details: result[:error]
        }
      end
    end
    
    # Background online validation (не блокує)
    def validate_online_background
      Thread.new do
        begin
          result = @api_client.validate_license(
            @current_license[:license_key],
            @current_license[:fingerprint]
          )
          
          if result[:success] && result[:valid]
            # Оновлюємо local cache
            @current_license[:last_validation] = Time.now.iso8601
            @storage.save(@current_license)
            
            Logger.info("Background validation successful", "LicenseManager")
          elsif !result[:offline]
            # Ліцензія деактивована на сервері
            Logger.warn("License revoked on server!", "LicenseManager")
            
            # Можна показати warning користувачу
            UI.start_timer(0, false) do
              show_license_revoked_warning
            end
          end
        rescue => e
          Logger.error("Background validation error: #{e.message}", "LicenseManager")
        end
      end
    end
    
    # Background heartbeat
    def send_heartbeat_background
      Thread.new do
        begin
          result = @api_client.send_heartbeat(
            @current_license[:license_key],
            @current_license[:fingerprint]
          )
          
          if result[:success]
            Logger.info("Heartbeat sent successfully", "LicenseManager")
          elsif !result[:offline]
            Logger.warn("Heartbeat rejected: #{result[:error]}", "LicenseManager")
          end
        rescue => e
          Logger.error("Heartbeat error: #{e.message}", "LicenseManager")
        end
      end
    end
    
    def license_expired?(license)
      return false unless license[:expires_at]
      Time.parse(license[:expires_at]) < Time.now
    end
    
    def requires_activation
      {
        valid: false,
        error: :not_activated,
        message: 'Потрібна активація ліцензії',
        action: :show_activation_ui
      }
    end
    
    def obfuscate_key(key)
      return key if key.length < 20
      "#{key[0..15]}...#{key[-4..-1]}"
    end
    
    def show_license_revoked_warning
      # Можна показати HtmlDialog або messagebox
      UI.messagebox(
        "Вашу ліцензію було деактивовано. Зв'яжіться з підтримкою.",
        MB_OK
      )
    end
  end
end
```

**Тестування:**
```ruby
# test_license_manager.rb
license_mgr = ProGran3::Security::LicenseManager.new

# Test 1: No license
result = license_mgr.validate_license
assert result[:valid] == false
assert result[:action] == :show_activation_ui

# Test 2: Activate
result = license_mgr.activate_license('test@test.com', 'TEST-KEY')
assert result[:success] == true

# Test 3: Validate
result = license_mgr.validate_license
assert result[:valid] == true
```

---

#### Day 10: Server Endpoints
**Файли:** `server/app/api/licenses/validate/route.ts` (новий)

**Завдання:**
- [x] Створити POST /api/licenses/validate
- [x] Створити POST /api/licenses/renew  
- [x] Додати HMAC verification
- [x] Додати fingerprint check
- [x] Додати expiration check
- [x] Update last_validation timestamp

**Код:**
```typescript
// server/app/api/licenses/validate/route.ts
import { withPublicApi, ApiContext } from '@/lib/api-handler';
import { apiSuccess, apiError } from '@/lib/api-response';
import { verifyHMAC } from '@/lib/crypto';

export const POST = withPublicApi(async ({ supabase, request }: ApiContext) => {
  try {
    const { license_key, system_fingerprint, signature } = await request.json();
    
    // Verify HMAC signature
    const dataToSign = `${license_key}:${system_fingerprint}`;
    if (!verifyHMAC(dataToSign, signature)) {
      return apiError('Invalid signature', 403);
    }
    
    // Find license
    const { data: license, error } = await supabase
      .from('licenses')
      .select(`
        *,
        system_infos!inner(fingerprint_hash, last_seen)
      `)
      .eq('license_key', license_key)
      .single();
    
    if (error || !license) {
      return apiError('License not found', 404);
    }
    
    // Check status
    if (license.status !== 'active') {
      return apiSuccess({
        valid: false,
        reason: 'license_not_active',
        status: license.status
      });
    }
    
    // Check fingerprint
    if (license.system_infos.fingerprint_hash !== system_fingerprint) {
      return apiSuccess({
        valid: false,
        reason: 'hardware_mismatch'
      });
    }
    
    // Check expiration
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      // Auto-update status
      await supabase
        .from('licenses')
        .update({ status: 'expired' })
        .eq('id', license.id);
      
      return apiSuccess({
        valid: false,
        reason: 'expired',
        expires_at: license.expires_at
      });
    }
    
    // Update last_validation
    await supabase
      .from('system_infos')
      .update({ 
        last_seen: new Date().toISOString(),
        last_validation: new Date().toISOString()
      })
      .eq('fingerprint_hash', system_fingerprint);
    
    // All good!
    return apiSuccess({
      valid: true,
      expires_at: license.expires_at,
      license_type: license.license_type,
      days_remaining: Math.ceil(
        (new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    });
  } catch (error) {
    return apiError(error as Error);
  }
});
```

**Також створити:**
```typescript
// server/lib/crypto.ts
import crypto from 'crypto';

export function generateHMAC(data: string): string {
  const secret = process.env.CRYPTO_SECRET_KEY!;
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
}

export function verifyHMAC(data: string, signature: string): boolean {
  const expected = generateHMAC(data);
  
  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expected, 'hex')
  );
}
```

---

### **WEEK 3: Integration & UI**

#### Day 11-12: Integration в головні файли

**1. Оновити `proGran3.rb`:**
```ruby
# proGran3.rb (на початку файлу)

# Load security modules
require_relative 'progran3/security/hardware_fingerprint'
require_relative 'progran3/security/crypto_utils'
require_relative 'progran3/security/license_storage'
require_relative 'progran3/security/api_client'
require_relative 'progran3/security/grace_period_manager'
require_relative 'progran3/security/license_manager'

module ProGran3
  # Global license manager
  $license_manager = nil
  
  def self.initialize_licensing
    $license_manager = Security::LicenseManager.new
    Logger.info("License system initialized", "Main")
  end
  
  # Перевірка перед запуском плагіна
  def self.can_start_plugin?
    result = $license_manager.validate_license
    
    if result[:valid]
      Logger.success("License valid", "Main")
      
      # Показуємо warning якщо є
      if result[:warning]
        show_warning_dialog(result[:warning])
      end
      
      # Запускаємо heartbeat
      $license_manager.start_heartbeat_timer
      
      return true
    else
      Logger.error("License invalid: #{result[:error]}", "Main")
      
      # Визначаємо дію
      case result[:action]
      when :show_activation_ui
        LicenseUI.show
      else
        show_error_dialog(result[:message])
      end
      
      return false
    end
  end
  
  # Оновлюємо create_toolbar
  def self.create_toolbar
    # ... існуючий код ...
    
    cmd = UI::Command.new("ProGran3 Конструктор") {
      ErrorHandler.safe_execute("UI", "Запуск діалогу") do
        # ДОДАТИ ПЕРЕВІРКУ ЛІЦЕНЗІЇ
        if can_start_plugin?
          SplashScreen.show
        else
          puts "❌ Плагін заблокований - немає ліцензії"
        end
      end
    }
    
    # ... решта коду ...
  end
  
  # Ініціалізація при завантаженні
  unless file_loaded?(__FILE__)
    initialize_licensing  # 🆕 ДОДАТИ
    # ... решта ініціалізації ...
  end
end
```

**2. Оновити `splash_screen.rb`:**
```ruby
# splash_screen.rb

def self.show
  # ... створення dialog ...
  
  # 🆕 ДОДАТИ callback для перевірки ліцензії
  dialog.add_action_callback("check_license_status") do |d|
    Thread.new do
      result = $license_manager.validate_license
      
      UI.start_timer(0, false) do
        if result[:valid]
          d.execute_script("onLicenseValid(#{result.to_json})")
        else
          d.execute_script("onLicenseInvalid(#{result.to_json})")
        end
      end
    end
  end
  
  dialog.show
end

# 🆕 У SPLASH_HTML JavaScript:
<script>
  function checkLicense() {
    loadingText.textContent = 'Перевірка ліцензії...';
    statusText.textContent = 'Підключення до сервера...';
    
    // Викликаємо Ruby callback
    if (window.sketchup && window.sketchup.check_license_status) {
      window.sketchup.check_license_status();
    }
  }
  
  function onLicenseValid(result) {
    loadingText.textContent = 'Ліцензія знайдена!';
    statusText.textContent = 'Завантаження інтерфейсу...';
    
    // Показуємо warning якщо є
    if (result.warning) {
      console.warn('License warning:', result.warning);
    }
    
    setTimeout(() => {
      window.sketchup.show_main_ui();
    }, 1000);
  }
  
  function onLicenseInvalid(result) {
    loadingText.textContent = 'Ліцензія не знайдена';
    statusText.textContent = result.message || 'Потрібна активація';
    
    setTimeout(() => {
      if (result.action === 'show_activation_ui') {
        window.sketchup.show_license_ui();
      }
    }, 1500);
  }
  
  // Початок перевірки
  setTimeout(() => {
    checkLicense();
  }, 2000);
</script>
```

**3. Оновити `license_ui.rb`:**
```ruby
# license_ui.rb

def self.show
  # ... створення dialog ...
  
  # 🆕 ДОДАТИ callback для активації
  dialog.add_action_callback("activate_license") do |d, email, license_key|
    Logger.info("Activation attempt: #{email}", "LicenseUI")
    
    # Show loading state
    d.execute_script("showActivating()")
    
    Thread.new do
      result = $license_manager.activate_license(email, license_key)
      
      UI.start_timer(0, false) do
        if result[:success]
          d.execute_script("onActivationSuccess(#{result.to_json})")
          
          # Закриваємо через 2 секунди та показуємо main UI
          UI.start_timer(2, false) do
            d.close
            ProGran3::UI.show_dialog
          end
        else
          d.execute_script("onActivationError('#{result[:error]}')")
        end
      end
    end
  end
  
  dialog.show
end

# 🆕 У LICENSE_HTML JavaScript:
<script>
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const licenseKey = document.getElementById('licenseKey').value;
    
    // Викликаємо Ruby callback
    if (window.sketchup && window.sketchup.activate_license) {
      window.sketchup.activate_license(email, licenseKey);
    }
  });
  
  function showActivating() {
    activateBtn.textContent = 'Активація...';
    activateBtn.disabled = true;
    statusMessage.textContent = 'Підключення до сервера...';
    statusMessage.className = 'status-message';
    statusMessage.style.display = 'block';
  }
  
  function onActivationSuccess(result) {
    statusMessage.textContent = '✅ Ліцензія успішно активована!';
    statusMessage.className = 'status-message status-success';
  }
  
  function onActivationError(error) {
    statusMessage.textContent = `❌ Помилка: ${error}`;
    statusMessage.className = 'status-message status-error';
    activateBtn.textContent = 'Активувати ліцензію';
    activateBtn.disabled = false;
  }
</script>
```

**4. Оновити `ui.rb`:**
```ruby
# ui.rb

@dialog.add_action_callback("ready") do |d, _|
  # 🆕 ДОДАТИ license info в footer
  if $license_manager && $license_manager.current_license
    license_info = $license_manager.get_license_info
    
    @dialog.execute_script("
      updateLicenseFooter(#{license_info.to_json});
    ")
  end
  
  # Запускаємо tracking
  ProGran3.start_tracking
end

# 🆕 ДОДАТИ callback для refresh license
@dialog.add_action_callback("refresh_license_status") do |d|
  Thread.new do
    result = $license_manager.validate_license
    
    UI.start_timer(0, false) do
      license_info = $license_manager.get_license_info
      d.execute_script("updateLicenseFooter(#{license_info.to_json})")
    end
  end
end
```

---

#### Day 13-14: Testing & Bug Fixes

**Тестові сценарії:**

1. **Activation Flow:**
   - [ ] Activate з валідним ключем → Success
   - [ ] Activate з invalid ключем → Error
   - [ ] Activate з неправильним email → Error
   - [ ] Activate двічі з одним ключем → Error

2. **Hardware Binding:**
   - [ ] Скопіювати license file на інший ПК → Блокування
   - [ ] Зміна hardware → Блокування
   - [ ] Normal hardware → OK

3. **Grace Period:**
   - [ ] Offline 1 день → Works
   - [ ] Offline 5 днів → Works with warning
   - [ ] Offline 8 днів → Requires online
   - [ ] Back online after 8 days → Works

4. **Heartbeat:**
   - [ ] Heartbeat sent every 5 min → Logs OK
   - [ ] Server down → Continue working
   - [ ] License revoked on server → Warning shown

5. **Expiration:**
   - [ ] License expired → Block
   - [ ] Near expiration → Warning
   - [ ] Active license → OK

---

#### Day 15: UI Polish & Documentation

**Завдання:**
- [ ] Додати license info в footer
- [ ] Додати warning dialogs
- [ ] Додати refresh button
- [ ] Покращити error messages
- [ ] Написати user guide
- [ ] Написати troubleshooting guide

---

## 📁 СТРУКТУРА ФАЙЛІВ (ФІНАЛЬНА)

```
ProGran3/
├── plugin/proGran3/
│   ├── security/ (🆕 ВСЕ НОВЕ)
│   │   ├── hardware_fingerprint.rb    (~200 lines) 🆕
│   │   ├── api_client.rb              (~250 lines) 🆕
│   │   ├── license_storage.rb         (~150 lines) 🆕
│   │   ├── grace_period_manager.rb    (~80 lines)  🆕
│   │   ├── license_manager.rb         (~400 lines) 🆕
│   │   └── crypto_utils.rb            (~100 lines) 🆕
│   │
│   ├── proGran3.rb                    ✏️ +50 lines
│   ├── ui.rb                          ✏️ +30 lines
│   ├── splash_screen.rb               ✏️ +80 lines
│   └── license_ui.rb                  ✏️ +60 lines
│
└── server/
    ├── app/api/
    │   └── licenses/
    │       ├── validate/route.ts      (~150 lines) 🆕
    │       └── renew/route.ts         (~100 lines) 🆕
    │
    └── lib/
        └── crypto.ts                  ✏️ +50 lines
```

**Total новий код:**
- Ruby: ~1,180 lines
- TypeScript: ~300 lines
- JavaScript: ~220 lines (UI updates)
**TOTAL: ~1,700 lines**

---

## ✅ CHECKLIST РЕАЛІЗАЦІЇ

### Week 1: Security Modules (Ruby)
- [ ] День 1-2: hardware_fingerprint.rb
  - [ ] Windows support (wmic)
  - [ ] Mac support (system_profiler)
  - [ ] Linux support (dmidecode)
  - [ ] VM detection
  - [ ] Caching mechanism
  - [ ] Unit tests

- [ ] День 3-4: api_client.rb
  - [ ] Net::HTTP wrapper
  - [ ] HTTPS configuration
  - [ ] Retry logic (3x, exponential)
  - [ ] Thread wrapper для async
  - [ ] Timeout handling
  - [ ] HMAC signatures
  - [ ] Error categorization

- [ ] День 5: license_storage.rb
  - [ ] AES-256-CBC encryption
  - [ ] Key derivation (PBKDF2)
  - [ ] Save/Load methods
  - [ ] File hiding
  - [ ] Backup mechanism
  - [ ] Corruption recovery
  - [ ] Migration from old format

### Week 2: License Logic & Server
- [ ] День 6-7: grace_period_manager.rb
  - [ ] Constants (7 days grace, 3 days warning)
  - [ ] Offline time calculation
  - [ ] Status determination
  - [ ] Warning messages
  - [ ] Unit tests

- [ ] День 8-9: license_manager.rb
  - [ ] validate_license() - main method
  - [ ] activate_license()
  - [ ] start_heartbeat_timer()
  - [ ] get_license_info()
  - [ ] Background validation
  - [ ] Error handling
  - [ ] Integration tests

- [ ] День 10: Server endpoints
  - [ ] /api/licenses/validate
  - [ ] /api/licenses/renew
  - [ ] lib/crypto.ts (HMAC)
  - [ ] Update existing activate endpoint
  - [ ] API tests

### Week 3: Integration & Testing
- [ ] День 11-12: UI Integration
  - [ ] proGran3.rb updates
  - [ ] splash_screen.rb updates
  - [ ] license_ui.rb updates
  - [ ] ui.rb updates (footer, callbacks)
  - [ ] JavaScript UI updates

- [ ] День 13-14: Testing
  - [ ] Unit tests (всі modules)
  - [ ] Integration tests
  - [ ] End-to-end flow testing
  - [ ] Different scenarios
  - [ ] Bug fixes

- [ ] День 15: Polish & Deploy
  - [ ] UI improvements
  - [ ] Error messages
  - [ ] Documentation
  - [ ] User guide
  - [ ] Deploy to production

---

## 🧪 TESTING SCENARIOS

### Scenario 1: Fresh Installation
```
1. Launch plugin (no license)
   → Shows activation UI
2. Enter email + license key
   → Success message
3. Plugin starts normally
   → License info in footer
4. Close SketchUp
5. Reopen SketchUp
   → Starts immediately (cached license)
```

### Scenario 2: Offline Usage
```
1. Disconnect internet
2. Launch plugin
   → Works (checks local cache)
3. Use for 5 days offline
   → Shows warning "2 days until online required"
4. Continue 3 more days
   → Blocks: "Please connect to internet"
5. Connect internet
   → Auto-validates and continues
```

### Scenario 3: Hardware Transfer
```
1. Copy license file to another PC
2. Launch plugin
   → "License bound to another computer"
3. Cannot use
   → Must activate new license
```

### Scenario 4: License Expiration
```
1. License expires
2. Launch plugin
   → "License expired"
3. Cannot use
   → Must renew license
```

### Scenario 5: License Revocation
```
1. Admin revokes license on server
2. Plugin sends heartbeat
   → Receives "revoked" status
3. Shows warning
   → "License deactivated. Contact support."
```

---

## 🔐 SECURITY CONSIDERATIONS

### Що захищає:

1. **Hardware Binding:**
   - SHA256(Motherboard + CPU + MAC + Disk)
   - Неможливо перенести на інший ПК
   - Виявляє VM

2. **Encrypted Storage:**
   - AES-256-CBC encryption
   - Key з hardware fingerprint
   - Неможливо редагувати файл

3. **HMAC Signatures:**
   - Всі API requests підписані
   - Server verifies signature
   - Неможливо підробити requests

4. **Grace Period:**
   - Max 7 днів offline
   - Після - вимагає online
   - Запобігає indefinite offline use

5. **Server Control:**
   - Remote deactivation
   - Heartbeat monitoring
   - Usage analytics

### Що НЕ захищає:

1. ⚠️ **Code modification** (потрібна obfuscation)
2. ⚠️ **Memory hacking** (runtime modification)
3. ⚠️ **Debugger bypass** (потрібен debugger detection)

**Рівень захисту:** 8/10 (достатньо для 80-90% piracy prevention)

---

## 📊 METRICS & KPIs

### Success Metrics:

| Метрика | Target | Спосіб вимірювання |
|---------|--------|-------------------|
| **Activation Success Rate** | >95% | Server logs |
| **False Positives** | <1% | Support tickets |
| **Offline Work Time** | 7 days | Grace period config |
| **Heartbeat Success** | >98% | Server monitoring |
| **Piracy Rate** | <20% | License sharing detection |
| **User Satisfaction** | >85% | UX не заважає |

### Performance Metrics:

| Операція | Target | Acceptable |
|----------|--------|------------|
| **Fingerprint Generation** | <50ms | <100ms |
| **Local Validation** | <10ms | <50ms |
| **Online Validation** | <300ms | <1000ms |
| **Activation** | <500ms | <2000ms |
| **Heartbeat** | 0ms (async) | N/A |

---

## 🚀 DEPLOYMENT STRATEGY

### Phase 1: Internal Testing (1 week)
```
1. Deploy server endpoints
2. Build plugin with security
3. Internal team testing
4. Fix critical bugs
5. Performance optimization
```

### Phase 2: Beta Testing (1 week)
```
1. Select 10 beta users
2. Provide beta licenses
3. Monitor activation flow
4. Collect feedback
5. Fix issues
```

### Phase 3: Gradual Rollout (2 weeks)
```
Week 1: 25% of users
Week 2: 50% of users
Week 3: 75% of users
Week 4: 100% rollout
```

### Phase 4: Monitoring (Ongoing)
```
- Monitor activation rates
- Track heartbeat success
- Detect anomalies
- Support tickets
- Iterate improvements
```

---

## 💰 COST BREAKDOWN

### Development:
```
Week 1: Security modules        $4,000
Week 2: Integration & Server    $3,500
Week 3: Testing & Polish        $2,500
───────────────────────────────────────
Total Development:              $10,000
```

### Infrastructure (Monthly):
```
Vercel Pro (needed)             $20
Supabase Pro (optional)         $25
Upstash Redis (optional)        $10
───────────────────────────────────────
Total Monthly:                  $55
```

### ROI Analysis:
```
Without protection: 80% piracy
With protection: 20% piracy
───────────────────────────────────────
Revenue protection: +60%

If 100 licenses @ $500 = $50,000
Protection saves: $30,000
Investment: $10,000
───────────────────────────────────────
ROI: 200% in first year
```

---

## 🆘 RISK MITIGATION

### Risk 1: Server Downtime
**Mitigation:** 7-day grace period + local caching

### Risk 2: False Positives
**Mitigation:** Support hotline + manual override capability

### Risk 3: Hardware Changes
**Mitigation:** Деактивація/реактивація process

### Risk 4: User Privacy
**Mitigation:** Collect тільки hardware hashes, не raw data

### Risk 5: Implementation Bugs
**Mitigation:** Comprehensive testing + gradual rollout

---

## 📚 ДОКУМЕНТАЦІЯ ДЛЯ КОРИСТУВАЧІВ

### User Guide (створити):
```
1. Як активувати ліцензію
2. Що робити якщо втрачено ліцензію
3. Як працює offline
4. Як деактивувати на старому ПК
5. FAQ
6. Troubleshooting
```

### Admin Guide (створити):
```
1. Як генерувати ліцензії
2. Як відкликати ліцензію
3. Як перенести ліцензію на новий ПК
4. Моніторинг heartbeats
5. Виявлення піратства
```

---

## 🎯 SUCCESS CRITERIA

### Must Have (обов'язково):
- ✅ Hardware fingerprinting працює на Windows
- ✅ Activation flow завершується успішно
- ✅ Grace period 7 днів працює
- ✅ Heartbeat не блокує UI
- ✅ Encrypted storage secure

### Should Have (бажано):
- ✅ Cross-platform (Windows/Mac)
- ✅ Background validation smooth
- ✅ Error messages зрозумілі
- ✅ Performance <500ms
- ✅ False positives <1%

### Could Have (nice to have):
- ⭐ Auto-deactivation при uninstall
- ⭐ License transfer wizard
- ⭐ Usage analytics
- ⭐ Multi-license support

---

## 🔄 MIGRATION PLAN

### Існуючі користувачі:
```
1. Release v2.1.0 without enforcement (1 week)
   → Всі отримують warning "Activate license"
   
2. Grace period for activation (2 weeks)
   → Email campaign з інструкціями
   
3. Soft enforcement (1 week)
   → Warning при кожному запуску
   
4. Hard enforcement
   → Блокування без ліцензії
```

### Нові користувачі:
```
→ Активація при першому запуску
→ 30-day trial option
→ Easy purchase flow
```

---

## 📞 SUPPORT PLAN

### Common Issues:

**1. "License bound to another computer"**
**Solution:** Деактивація через admin panel + нова активація

**2. "Online validation required"**
**Solution:** Підключитись до internet

**3. "Hardware mismatch after upgrade"**
**Solution:** Manual license transfer через support

**4. "Heartbeat failing"**
**Solution:** Check firewall, VPN

### Support Workflow:
```
1. User contacts support
2. Admin checks license in dashboard
3. Admin can:
   - Deactivate old activation
   - Reset grace period
   - Extend expiration
   - View heartbeat history
```

---

## 🎊 FINAL DELIVERABLES

### Code:
- [ ] 6 Ruby security modules (~1,180 lines)
- [ ] 2 Server endpoints (~300 lines)
- [ ] UI integration (~220 lines)
- [ ] Tests (~500 lines)

### Documentation:
- [ ] Implementation guide (this doc)
- [ ] User activation guide
- [ ] Admin management guide
- [ ] API documentation
- [ ] Troubleshooting guide

### Tools:
- [ ] License generator script
- [ ] Bulk activation tool
- [ ] Migration script
- [ ] Testing utilities

---

## 🚀 READY TO IMPLEMENT

**Цей план готовий до виконання!**

**Коли почнете реалізацію:**
1. Створіть git branch: `feature/license-system`
2. Почніть з Day 1: hardware_fingerprint.rb
3. Кожен день - commit
4. Weekly code review
5. Після Week 3 - merge to dev

**Estimated timeline:** 2-3 тижні (1 developer full-time)  
**Estimated cost:** $10,000  
**Expected piracy prevention:** 80-90%  
**ROI:** 200%+ in first year

---

**Документ готовий до використання!**  
**Всі деталі та код в:** `LICENSE_PROTECTION_STRATEGIES.md`


