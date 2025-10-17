# 🚀 Процес завантаження плагіна ProGran3 - Покрокový опис

**Версія:** 3.1.0  
**Дата:** 17 жовтня 2025  
**Призначення:** Детальне розуміння startup flow для розробників

---

## 📊 ЗАГАЛЬНИЙ ОГЛЯД

**Час запуску:**
- З ліцензією: ~2-3 секунди (splash → validation → main UI)
- Без ліцензії: ~3-5 секунд (splash → license UI → activation → main UI)

**Ключові етапи:**
```
1. SketchUp завантажує proGran3.rb
2. Створюється toolbar + menu item
3. Користувач клікає → SplashScreen.show
4. Splash показує progress bar
5. License validation (validate_license callback)
6. Якщо OK → Main UI
7. Якщо NO → License UI → activation → Main UI
8. Activity Tracker запускається
9. Periodic heartbeat кожні 10 хв
```

---

## 🔄 ДЕТАЛЬНИЙ FLOW

### ФАЗА 1: SketchUp Startup (автоматично)

**Що відбувається при запуску SketchUp:**

```ruby
# === КРОК 1.1: SketchUp шукає плагіни ===
Локація: C:/Users/[USER]/AppData/Roaming/SketchUp/SketchUp 2024/SketchUp/Plugins/

SketchUp знаходить:
  ├─ proGran3.rb           ← Entry point
  └─ proGran3/ (директорія)
```

**Час:** ~100ms

---

```ruby
# === КРОК 1.2: Завантаження proGran3.rb ===

# Рядки 1-166: ProGran3Tracker class (legacy heartbeat - НЕ використовується)
# Рядок 168: module ProGran3 - головний модуль

# Рядки 169-192: Завантаження всіх модулів
require_relative 'progran3/constants'           # Константи
require_relative 'progran3/logger'              # Логування
require_relative 'progran3/error_handler'       # Обробка помилок
require_relative 'progran3/validation'          # Валідація
require_relative 'progran3/dimensions_manager'  # Розміри
require_relative 'progran3/coordination_manager' # Координація
require_relative 'progran3/callback_manager'    # UI callbacks (1,310 lines!)
require_relative 'progran3/config'              # Конфігурація
require_relative 'progran3/loader'              # Завантажувач
require_relative 'progran3/builders/...'        # 5 builders
require_relative 'progran3/ui'                  # Main UI
require_relative 'progran3/skp_preview_extractor' # Previews
require_relative 'progran3/splash_screen'       # Splash
require_relative 'progran3/license_ui'          # License UI
require_relative 'progran3/demo_ui'             # Demo UI
require_relative 'progran3/activity_tracker'    # Activity tracking (NEW)

# Рядки 195-205: Методи start_tracking, stop_tracking, session_info
```

**Що завантажується:**
- 20+ модулів
- Builders (Foundation, Tiling, Fence, Cladding, BlindArea)
- UI systems (Splash, License, Main, Demo)
- Security layer (при потребі)
- Activity tracker

**Час:** ~500ms

---

```ruby
# === КРОК 1.3: Створення UI елементів ===

# Рядки 240-247: Додавання menu item
UI.menu("Plugins").add_item("proGran3 Конструктор") {
  ProGran3::SplashScreen.show  # Виклик при кліці
}

# Рядки 249-250: Створення toolbar
create_toolbar  # Кнопка на панелі інструментів

# Рядок 253: Логування
Logger.info("Плагін ProGran3 завантажено", "Main")
```

**Що створюється:**
- Menu item: Plugins → proGran3 Конструктор
- Toolbar: Кнопка з іконкою
- Готовий до виклику (але ще НЕ показується UI)

**Час:** ~100ms

**Лог:**
```
📱 Плагін ProGran3 завантажено
```

---

**ФАЗА 1 ЗАВЕРШЕНА.**

**Загальний час:** ~700ms  
**Статус:** Плагін завантажений, чекає на клік користувача  
**UI показано:** Ні (тільки menu item + toolbar button)

---

### ФАЗА 2: Клік користувача → Splash Screen

**Користувач клікає:** Plugins → proGran3 Конструктор (або toolbar button)

```ruby
# === КРОК 2.1: Виклик SplashScreen.show ===

# proGran3.rb рядок 217:
ProGran3::SplashScreen.show
  ↓
# splash_screen.rb рядок 267:
def self.show
```

**Що відбувається:**

```ruby
# Рядки 269-282: Створення HtmlDialog
dialog = UI::HtmlDialog.new({
  :dialog_title => "ProGran3 - Завантаження",
  :preferences_key => "ProGran3_Splash",
  :scrollable => false,
  :resizable => false,
  :width => 420,
  :height => 850,
  :style => UI::HtmlDialog::STYLE_DIALOG
})

# Рядок 285: Встановлення HTML
dialog.set_html(SPLASH_HTML)  # ~265 рядків HTML з CSS і JavaScript
```

**UI показано:**
```
╔════════════════════════════╗
║      ProGran3              ║
║  Конструктор пам'ятників   ║
║                            ║
║    Завантаження...         ║
║   [████░░░░░░░░] 0%        ║
║                            ║
║  Перевірка системи...      ║
╚════════════════════════════╝
```

**Час:** ~200ms

---

```ruby
# === КРОК 2.2: Реєстрація callbacks ===

# Рядки 288-320: validate_license callback
dialog.add_action_callback("validate_license") do
  # Тут буде валідація (викликається з JavaScript)
end

# Рядки 323-327: license_valid callback
dialog.add_action_callback("license_valid") do
  dialog.close
  show_main_ui  # Показати Main UI
end

# Рядки 329-333: license_required callback
dialog.add_action_callback("license_required") do
  dialog.close
  show_license_ui  # Показати License UI
end

# Рядки 336-343: show_main_ui callback (прямий виклик)
dialog.add_action_callback("show_main_ui") do
  dialog.close
  UI.show_dialog  # ProGran3::UI.show_dialog
end

# Рядки 345-351: show_license_ui callback
dialog.add_action_callback("show_license_ui") do
  dialog.close
  LicenseUI.show
end
```

**Зареєстровано 5 callbacks:**
- `validate_license` - перевірка ліцензії (викликається з JS)
- `license_valid` - ліцензія OK → Main UI
- `license_required` - ліцензія потрібна → License UI
- `show_main_ui` - прямий виклик Main UI
- `show_license_ui` - прямий виклик License UI

**Час:** ~50ms

---

```ruby
# === КРОК 2.3: Показ діалогу ===

# Рядок 353: Показати splash screen
dialog.show

# Лог:
puts "🎬 Splash Screen показано"
```

**Splash screen відкривається на екрані.**

**Час:** ~100ms

---

**ФАЗА 2 ЗАВЕРШЕНА.**

**Загальний час:** ~350ms  
**UI показано:** Splash screen з progress bar  
**Статус:** Чекає на JavaScript виконання

---

### ФАЗА 3: JavaScript виконання → Progress Animation

**Що відбувається в браузері (HTML):**

```javascript
// === КРОК 3.1: DOM завантажився ===

window.addEventListener('DOMContentLoaded', () => {
  // Елементи знайдені
  const progressBar = document.getElementById('progress');
  const loadingText = document.getElementById('loading-text');
  const statusText = document.getElementById('status-text');
  
  // Рядок 255: Початок анімації через 500ms
  setTimeout(updateProgress, 500);
});
```

**Час:** ~500ms (затримка перед анімацією)

---

```javascript
// === КРОК 3.2: Progress Animation (5 кроків) ===

function updateProgress() {
  const steps = [
    { progress: 20, text: 'Перевірка системи...', status: 'Ініціалізація модулів' },
    { progress: 40, text: 'Завантаження компонентів...', status: 'Підготовка інтерфейсу' },
    { progress: 60, text: 'Перевірка ліцензії...', status: 'Зв\'язок із сервером' },
    { progress: 80, text: 'Фінальна підготовка...', status: 'Майже готово' },
    { progress: 100, text: 'Готово!', status: 'Запуск інтерфейсу' }
  ];
  
  let currentStep = 0;
  
  const interval = setInterval(() => {
    if (currentStep < steps.length) {
      const step = steps[currentStep];
      
      // Оновлюємо UI
      progressBar.style.width = step.progress + '%';
      loadingText.textContent = step.text;
      statusText.textContent = step.status;
      
      currentStep++;
    } else {
      clearInterval(interval);
      
      // === КРОК 3.3: Виклик валідації ліцензії ===
      
      // Рядок 212: Викликаємо Ruby callback
      if (window.sketchup && window.sketchup.validate_license) {
        window.sketchup.validate_license();
      }
    }
  }, 400); // Кожен крок 400ms
}
```

**Анімація:**
```
[████░░░░░░░░] 20%  Перевірка системи...
[████████░░░░] 40%  Завантаження компонентів...
[████████████] 60%  Перевірка ліцензії...
[████████████] 80%  Фінальна підготовка...
[████████████] 100% Готово!
```

**Час:** 5 кроків × 400ms = ~2000ms (2 секунди)

---

**ФАЗА 3 ЗАВЕРШЕНА.**

**Загальний час:** ~2.5 секунди  
**UI показано:** Анімація завершена  
**Статус:** Викликається validate_license callback

---

### ФАЗА 4: License Validation (критична!)

```ruby
# === КРОК 4.1: validate_license callback викликаний ===

# splash_screen.rb рядок 288:
dialog.add_action_callback("validate_license") do
  puts "🔍 Callback: validate_license викликано"
  
  begin
    # Рядок 293: Завантаження License Manager
    require_relative 'security/license_manager'
    manager = Security::LicenseManager.new
```

**Лог:**
```
🔍 Callback: validate_license викликано
```

**Час:** ~50ms

---

```ruby
    # === КРОК 4.2: Ініціалізація LicenseManager ===
    
    # license_manager.rb рядок 10:
    class LicenseManager
      def initialize
        # Генерація fingerprint
        fp_data = HardwareFingerprint.generate
        @fingerprint = fp_data[:fingerprint]
        @fingerprint_components = fp_data[:components]
        @current_license = nil
      end
    end
```

**Що відбувається:**
```
Hardware Fingerprint генерується:
  ├─ Motherboard serial
  ├─ CPU ID
  ├─ Primary MAC address
  ├─ Disk serial
  ├─ Hostname
  └─ Platform
  
  ↓ SHA256 hash
  
  → d41602e6dbe2c8cad2be11f4498a79175de20ae12b5517764c3ae352cd9b91dc
```

**Час:** ~100ms

---

```ruby
    # === КРОК 4.3: Валідація ліцензії ===
    
    # Рядок 297: Виклик validate_license()
    result = manager.validate_license
```

**Логіка валідації (license_manager.rb рядок 90):**

```ruby
def validate_license
  # 1. Генерація fingerprint (якщо не було)
  fp_data = HardwareFingerprint.generate
  @fingerprint = fp_data[:fingerprint]
  
  # 2. Завантаження локального файлу ліцензії
  license = LicenseStorage.load
  
  # 3. СЦЕНАРІЙ A: Файл не знайдено
  if license.nil?
    return {
      valid: false,
      error: 'no_license',
      message: 'Ліцензія не знайдена'
    }
  end
  
  # 4. Перевірка fingerprint match
  if license[:fingerprint] != @fingerprint
    return {
      valid: false,
      error: 'hardware_mismatch',
      message: 'Ліцензія прив\'язана до іншого комп\'ютера'
    }
  end
  
  # 5. Перевірка expiration
  if license[:expires_at]
    expires_at = Time.parse(license[:expires_at])
    if expires_at < Time.now
      return {
        valid: false,
        error: 'expired',
        message: 'Ліцензія прострочена'
      }
    end
  end
  
  # 6. Перевірка grace period
  grace_check = check_grace_period(license)
  
  if !grace_check[:valid]
    # Grace period закінчився - потрібна online валідація
    # Спроба online validation...
    online_result = validate_online(license)
    
    if online_result[:success]
      # Online OK - оновлюємо файл
      LicenseStorage.save(license.merge(last_validation: Time.now))
      return { valid: true, license: license }
    else
      return {
        valid: false,
        error: 'grace_period_expired',
        message: 'Потрібне підключення до інтернету'
      }
    end
  end
  
  # 7. Фонова валідація (async, не блокує)
  if should_revalidate?(license)
    background_validation(license)
  end
  
  # 8. Ліцензія валідна!
  @current_license = license
  
  return {
    valid: true,
    license: license,
    warning: grace_check[:warning]  # Може бути "Рекомендуємо підключитись"
  }
end
```

**Можливі результати:**

**A. Ліцензія валідна:**
```ruby
{
  valid: true,
  license: {
    license_key: "PROGRAN3-...",
    email: "user@test.com",
    fingerprint: "d41602e6...",
    expires_at: "2025-11-16T10:00:00Z",
    last_validation: "2025-10-17T10:00:00Z"
  },
  warning: nil  # або "Рекомендуємо підключитись" (якщо 3+ дні offline)
}
```

**B. Ліцензія не знайдена:**
```ruby
{
  valid: false,
  error: 'no_license',
  message: 'Ліцензія не знайдена'
}
```

**C. Hardware mismatch:**
```ruby
{
  valid: false,
  error: 'hardware_mismatch',
  message: 'Ліцензія прив\'язана до іншого комп\'ютера'
}
```

**D. Прострочена:**
```ruby
{
  valid: false,
  error: 'expired',
  message: 'Ліцензія прострочена'
}
```

**Час валідації:**
- Локальна перевірка: ~50-100ms (швидко!)
- З online validation: ~500-1000ms (якщо потрібна)

---

```ruby
    # === КРОК 4.4: Повернення результату в JavaScript ===
    
    # Рядки 300-306: Конвертація в JSON
    js_result = {
      valid: result[:valid],
      message: result[:message] || result[:error],
      warning: result[:warning]
    }.to_json
    
    # Виклик JavaScript функції
    dialog.execute_script("window.handleLicenseValidationResult(#{js_result})")
```

**Результат передається назад в браузер.**

**Час:** ~10ms

---

**ФАЗА 4 ЗАВЕРШЕНА.**

**Загальний час:** ~200-1200ms (залежить від online validation)  
**Статус:** JavaScript отримав результат валідації

---

### ФАЗА 5: JavaScript обробка результату

```javascript
// === КРОК 5.1: handleLicenseValidationResult викликана ===

// splash_screen.rb HTML рядок 218:
window.handleLicenseValidationResult = function(result) {
  console.log('Результат валідації:', result);
  
  // Рядок 222: Очищаємо interval
  clearInterval(interval);
  
  if (result.valid) {
    // === СЦЕНАРІЙ A: Ліцензія валідна ===
    
    // Рядок 224-228: Оновлюємо UI
    progressBar.style.width = '100%';
    loadingText.textContent = 'Ліцензія валідна!';
    statusText.textContent = result.message || 'Запуск інтерфейсу...';
    
    // Рядок 230-237: Через 1 секунду → Main UI
    setTimeout(() => {
      if (window.sketchup && window.sketchup.license_valid) {
        window.sketchup.license_valid();  // Викликає Ruby callback
      }
    }, 1000);
    
  } else {
    // === СЦЕНАРІЙ B: Ліцензія НЕ валідна ===
    
    // Рядок 239-242: Оновлюємо UI
    progressBar.style.width = '100%';
    progressBar.style.backgroundColor = '#e74c3c';  // Червоний
    loadingText.textContent = 'Ліцензія не знайдена';
    statusText.textContent = result.message || 'Потрібна активація';
    
    // Рядок 244-250: Через 1 секунду → License UI
    setTimeout(() => {
      if (window.sketchup && window.sketchup.show_license_ui) {
        window.sketchup.show_license_ui();  // Викликає Ruby callback
      }
    }, 1000);
  }
}
```

**Візуально:**

**Якщо ліцензія валідна:**
```
[████████████] 100% (зелена)
Ліцензія валідна!
Запуск інтерфейсу...
```

**Якщо ліцензія не валідна:**
```
[████████████] 100% (червона)
Ліцензія не знайдена
Потрібна активація
```

**Час:** ~1 секунда (затримка для показу повідомлення)

---

**ФАЗА 5 ЗАВЕРШЕНА.**

**Статус:** JavaScript виконав callback (license_valid або show_license_ui)  
**Splash screen:** Закривається

---

### ФАЗА 6A: Ліцензія валідна → Main UI

```ruby
# === КРОК 6A.1: license_valid callback ===

# splash_screen.rb рядок 323:
dialog.add_action_callback("license_valid") do
  puts "✅ Ліцензія валідна - показуємо основний UI"
  
  # Рядок 325: Закрити splash
  dialog.close
  
  # Рядок 326: Показати Main UI
  show_main_ui
end
```

**Лог:**
```
✅ Ліцензія валідна - показуємо основний UI
```

---

```ruby
# === КРОК 6A.2: show_main_ui викликаний ===

# splash_screen.rb рядок 361:
def self.show_main_ui
  puts "📱 Запуск Main UI..."
  
  # Рядок 364: Показати UI
  ProGran3::UI.show_dialog
  
  puts "✅ Main UI показано"
end
```

**Лог:**
```
📱 Запуск Main UI...
```

---

```ruby
# === КРОК 6A.3: UI.show_dialog ===

# ui.rb рядок 9:
def show_dialog
  # Рядок 11: Конструкція HTML path
  html_path = File.join(WEB_PATH, 'index.html')
  
  # Рядки 34-43: Створення HtmlDialog
  @dialog = UI::HtmlDialog.new({
    :dialog_title => "ProGran3 - Конструктор",
    :preferences_key => "ProGran3_Main",
    :scrollable => false,
    :resizable => true,
    :width => 420,
    :height => 850,
    :min_width => 350,
    :min_height => 600
  })
  
  # Рядок 44: Завантаження HTML файлу
  @dialog.set_file(html_path)  # web/index.html + CSS + JavaScript
```

**Завантажується:**
- `web/index.html` - Main UI (accordion system, forms, buttons)
- `web/style.css` + `web/css/*.css` - Стилі
- `web/script.js` - Головна логіка
- `web/modules/*.js` - 16 JS модулів (Accordion, Summary, Carousel, etc.)

**Час:** ~500-800ms (завантаження всіх файлів)

---

```ruby
  # === КРОК 6A.4: Реєстрація callbacks (багато!) ===
  
  # Рядок 46: ready callback
  @dialog.add_action_callback("ready") do
    puts "📱 UI повністю завантажено - запуск Activity Tracker..."
    
    # Рядки 50-61: Оновлення license status в UI (через 1 і 3 сек)
    @dialog.execute_script("
      setTimeout(() => { updateLicenseStatus(); }, 1000);
      setTimeout(() => { updateLicenseStatus(); }, 3000);
    ")
    
    # Рядки 64-71: Перевірка чи плагін заблокований
    if $plugin_blocked
      @dialog.execute_script("showBlockingCard();")
    else
      puts "✅ Плагін активний"
    end
    
    # Рядки 96-101: Запуск Activity Tracker
    begin
      ProGran3.start_tracking  # ВАЖЛИВО!
      puts "✅ Відстеження heartbeat запущено"
    rescue => e
      puts "⚠️ Не вдалося запустити відстеження: #{e.message}"
    end
    
    # Рядок 103: Завантаження компонентів в UI
    @dialog.execute_script("loadModelLists(#{categories.to_json});")
  end
  
  # + ще ~50 callbacks для всіх UI дій:
  # - add_foundation
  # - add_stand
  # - add_tiles
  # - get_detailed_summary
  # - get_license_info
  # - switch_language
  # і т.д.
```

**Лог:**
```
📱 UI повністю завантажено - запуск Activity Tracker...
✅ Плагін активний
```

---

```ruby
  # === КРОК 6A.5: Показ діалогу ===
  
  # ui.rb рядки 830+:
  @dialog.show
  
  puts "✅ Діалог ProGran3 показано"
```

**Main UI показано на екрані!**

**Лог:**
```
✅ Main UI показано
✅ Діалог ProGran3 показано
```

**Час:** ~100ms

---

**ФАЗА 6A ЗАВЕРШЕНА.**

**Загальний час:** ~1-1.5 секунди  
**UI показано:** Main UI (повний інтерфейс)  
**Статус:** Користувач може працювати

---

### ФАЗА 7: Activity Tracker запуск (background)

```ruby
# === КРОК 7.1: start_tracking викликаний ===

# ui.rb рядок 97:
ProGran3.start_tracking
  ↓
# proGran3.rb рядок 195:
def self.start_tracking
  ActivityTracker.start_tracking
end
  ↓
# activity_tracker.rb рядок 26:
def start_tracking
  return if @tracking_enabled  # Вже запущено
  
  puts "📊 Запуск Activity Tracker..."
```

**Лог:**
```
📊 Запуск Activity Tracker...
```

---

```ruby
  # === КРОК 7.2: Перевірка ліцензії ===
  
  # Рядок 29: Отримання license info
  license = get_license_info  # Викликає LicenseManager.license_info
  
  unless license && license[:has_license]
    puts "   ⚠️ Ліцензія не знайдена - tracking вимкнено"
    return
  end
  
  @tracking_enabled = true
  @session_start = Time.now
```

**Якщо ліцензія є:**
```
@tracking_enabled = true
@session_start = 2025-10-17 10:00:00
```

**Лог:**
```
✅ Activity Tracker запущено
📍 Session start: 2025-10-17 10:00:00
⏱️ Heartbeat interval: 600s (10 хв)
```

---

```ruby
  # === КРОК 7.3: Відправка startup event ===
  
  # Рядок 37: Виклик send_startup_event
  send_startup_event(license)
```

**Що відправляється:**

```ruby
# activity_tracker.rb рядок 51:
def send_startup_event(license)
  puts "   📤 Відправка startup event..."
  
  fingerprint = Security::HardwareFingerprint.generate[:fingerprint]
  
  # Рядок 59: POST запит на сервер
  result = Security::ApiClient.post_request('/api/heartbeats', {
    license_key: license[:license_key],
    system_fingerprint: fingerprint,
    event_type: 'startup',              # Тип: startup
    plugin_version: '1.0.0',
    session_start: @session_start.iso8601,
    sketchup_version: Sketchup.version,
    platform: Sketchup.platform,
    timestamp: Time.now.to_i
  }, silent: true)
  
  if result[:success]
    puts "   ✅ Startup event відправлено"
  else
    puts "   ⚠️ Startup event не відправлено: #{result[:error]}"
  end
end
```

**HTTP Request:**
```http
POST https://server-qf9qtpsf0-provis3ds-projects.vercel.app/api/heartbeats
Content-Type: application/json

{
  "license_key": "PROGRAN3-2025-...",
  "system_fingerprint": "d41602e6dbe2c8cad2be11f4498a79175...",
  "event_type": "startup",
  "plugin_version": "1.0.0",
  "session_start": "2025-10-17T10:00:00Z",
  "sketchup_version": "24.0.553",
  "platform": "Windows",
  "timestamp": 1729177200
}
```

**Server зберігає:**
- `system_infos.last_seen` = now
- `system_infos.system_data.last_startup` = now
- `system_infos.system_data.plugin_version` = "1.0.0"
- `heartbeats` record (status: "startup")

**Лог:**
```
   📤 Відправка startup event...
   ✅ Startup event відправлено
```

**Час:** ~500-800ms (HTTP request)

---

```ruby
  # === КРОК 7.4: Запуск periodic heartbeat timer ===
  
  # Рядок 40: Виклик start_heartbeat_timer
  start_heartbeat_timer(license)
```

**Що створюється:**

```ruby
# activity_tracker.rb рядок 106:
def start_heartbeat_timer(license)
  # Зупинити старий таймер якщо є
  if @heartbeat_timer
    UI.stop_timer(@heartbeat_timer)
  end
  
  # Створити новий таймер
  @heartbeat_timer = UI.start_timer(HEARTBEAT_INTERVAL, true) do
    send_heartbeat(license) if @tracking_enabled
  end
  
  puts "   ⏱️ Heartbeat timer запущено"
end
```

**Timer:**
- Інтервал: 600 секунд (10 хвилин)
- Repeat: true (повторюється)
- Callback: send_heartbeat(license)

**Лог:**
```
   ⏱️ Heartbeat timer запущено
```

**Час:** ~10ms

---

**ФАЗА 7 ЗАВЕРШЕНА.**

**Загальний час:** ~500-900ms  
**Статус:** Activity Tracker активний, heartbeat timer запущений  
**Наступний heartbeat:** Через 10 хвилин

---

### ФАЗА 6B: Ліцензія НЕ валідна → License UI (альтернативний шлях)

```ruby
# === КРОК 6B.1: show_license_ui callback ===

# splash_screen.rb рядок 329:
dialog.add_action_callback("license_required") do
  puts "🔐 Потрібна ліцензія - показуємо ліцензійний UI"
  
  # Закрити splash
  dialog.close
  
  # Показати License UI
  show_license_ui
end
```

**Лог:**
```
🔐 Потрібна ліцензія - показуємо ліцензійний UI
```

---

```ruby
# === КРОК 6B.2: LicenseUI.show ===

# splash_screen.rb рядок 355:
def self.show_license_ui
  puts "🔐 Запуск License UI..."
  ProGran3::LicenseUI.show
end
  ↓
# license_ui.rb рядок 340:
def self.show
  # Створення HtmlDialog
  dialog = UI::HtmlDialog.new({
    :dialog_title => "ProGran3 - Активація ліцензії",
    ...
  })
  
  # Встановлення HTML
  dialog.set_html(LICENSE_HTML)  # ~340 рядків HTML
```

**License UI показано:**
```
╔════════════════════════════╗
║      ProGran3              ║
║   Активація ліцензії       ║
║                            ║
║  Email:                    ║
║  [___________________]     ║
║                            ║
║  Ключ ліцензії:            ║
║  [___________________]     ║
║                            ║
║  [Активувати ліцензію]     ║
║                            ║
║  [Демо версія]             ║
╚════════════════════════════╝
```

**Час:** ~300ms

---

```ruby
  # === КРОК 6B.3: Реєстрація activate callback ===
  
  # license_ui.rb рядок 362:
  dialog.add_action_callback("activate_license") do |context, email, key|
    puts "🔐 Callback: activate_license викликано"
    
    # Рядки 369-370: Ініціалізація manager
    require_relative 'security/license_manager'
    manager = Security::LicenseManager.new
    
    # Рядок 373: Активація через API
    result = manager.activate_license(email, key)
    
    # Рядки 376-382: Повернення результату в JavaScript
    js_result = {
      success: result[:success],
      error: result[:error],
      message: result[:message]
    }.to_json
    
    dialog.execute_script("window.handleActivationResult(#{js_result})")
    
    # Рядки 385-389: Якщо успішно - через 1.5 сек закрити і показати Main UI
    if result[:success]
      sleep(1.5)
      dialog.close
      show_main_ui
    end
  end
```

**Користувач вводить:**
- Email: `user@example.com`
- Key: `PROGRAN3-2025-ABC123-XYZ789`

**Клікає "Активувати"**

---

```ruby
  # === КРОК 6B.4: Активація ліцензії (manager.activate_license) ===
  
  # license_manager.rb рядок 26:
  def activate_license(email, license_key)
    # 1. Генерація fingerprint
    fp_data = HardwareFingerprint.generate
    @fingerprint = fp_data[:fingerprint]
    
    puts "📤 Активація ліцензії: #{license_key[0..15]}..."
    
    # 2. HTTP POST на сервер
    result = ApiClient.activate(email, license_key, @fingerprint)
    
    if !result[:success]
      return {
        success: false,
        error: result[:error] || 'Помилка активації'
      }
    end
    
    # 3. Підготовка даних для збереження
    license_data = {
      license_key: license_key,
      email: email,
      fingerprint: @fingerprint,
      activated_at: result[:license][:activated_at],
      expires_at: result[:license][:expires_at],
      last_validation: Time.now
    }
    
    # 4. Збереження локально (зашифровано)
    saved = LicenseStorage.save(license_data)
    
    if !saved
      return {
        success: false,
        error: 'Не вдалося зберегти ліцензію локально'
      }
    end
    
    puts "✅ Ліцензію збережено: #{LicenseStorage::LICENSE_FILE}"
    
    # 5. Успіх!
    @current_license = license_data
    
    return {
      success: true,
      license: license_data,
      message: 'Ліцензію активовано та збережено!'
    }
  end
```

**HTTP Request до сервера:**
```http
POST /api/licenses/activate
{
  "user_email": "user@example.com",
  "license_key": "PROGRAN3-2025-ABC123-XYZ789",
  "system_fingerprint": "d41602e6dbe2c8cad2be11f4498a79175..."
}
```

**Server:**
1. Перевіряє ключ існує і status = "generated"
2. Створює user якщо не існує
3. Оновлює license status = "active"
4. Створює system_info з fingerprint
5. Повертає license data

**Response:**
```json
{
  "success": true,
  "data": {
    "license_id": "uuid",
    "license_key": "PROGRAN3-2025-ABC123-XYZ789",
    "user_email": "user@example.com",
    "activated_at": "2025-10-17T10:00:00Z",
    "expires_at": "2025-11-16T10:00:00Z",
    "status": "active"
  }
}
```

**Локальне збереження:**
```ruby
# license_storage.rb:
LicenseStorage.save(license_data)
  ↓
# Файл: C:/Users/[USER]/.progran3/license.enc
# Шифрування: AES-256-CBC
# Ключ: Derived from fingerprint (PBKDF2)
# Атрибути: Hidden + System (Windows)
```

**Лог:**
```
📤 Активація ліцензії: PROGRAN3-2025-AB...
🌐 POST https://server-qf9qtpsf0-.../api/licenses/activate
📥 Response: 200
✅ Ліцензію активовано успішно
✅ Ліцензію збережено: C:/Users/ProVis3D/.progran3/license.enc
✅ Ліцензію активовано та збережено!
```

**Час:** ~2-3 секунди (HTTP + encryption)

---

```ruby
  # === КРОК 6B.5: JavaScript показує success ===
  
  # license_ui.rb HTML:
  window.handleActivationResult = function(result) {
    if (result.success) {
      // Показ success message
      messageDiv.textContent = '✅ ' + result.message;
      messageDiv.style.backgroundColor = '#2ecc71';
      messageDiv.style.display = 'block';
      
      // Через 1.5 сек Ruby закриє діалог і покаже Main UI
    } else {
      // Показ error
      messageDiv.textContent = '❌ ' + result.error;
      messageDiv.style.backgroundColor = '#e74c3c';
      messageDiv.style.display = 'block';
    }
  }
```

**UI показує:**
```
✅ Ліцензію активовано та збережено!
```

**Затримка:** 1.5 секунди

**Потім:** License UI закривається → Main UI відкривається (як у ФАЗІ 6A)

---

**ФАЗА 6B ЗАВЕРШЕНА.**

**Загальний час:** ~4-5 секунд (activation + main UI)  
**UI показано:** Main UI  
**Ліцензія:** Збережена локально

---

### ФАЗА 8: Periodic Heartbeat (фоновий процес)

**Через 10 хвилин після запуску:**

```ruby
# === КРОК 8.1: Timer спрацював ===

# activity_tracker.rb рядок 113:
@heartbeat_timer = UI.start_timer(HEARTBEAT_INTERVAL, true) do
  send_heartbeat(license) if @tracking_enabled
end
```

**Timer callback викликається:**

```ruby
# === КРОК 8.2: send_heartbeat ===

# Рядок 119:
def send_heartbeat(license)
  return unless @tracking_enabled
  
  fingerprint = Security::HardwareFingerprint.generate[:fingerprint]
  session_duration = Time.now - @session_start  # Скільки секунд від старту
  
  # Рядок 130: Відправка heartbeat
  result = Security::ApiClient.post_request('/api/heartbeats', {
    license_key: license[:license_key],
    system_fingerprint: fingerprint,
    event_type: 'heartbeat',
    plugin_version: '1.0.0',
    session_duration: session_duration.to_i,  # В секундах
    session_start: @session_start.iso8601,
    sketchup_version: Sketchup.version,
    platform: Sketchup.platform,
    timestamp: Time.now.to_i
  }, silent: true)
  
  if result[:success]
    @last_heartbeat = Time.now
    puts "💓 Heartbeat відправлено (session: #{format_duration(session_duration)})"
  end
end
```

**HTTP Request:**
```http
POST /api/heartbeats
{
  "license_key": "PROGRAN3-...",
  "system_fingerprint": "d41602e6...",
  "event_type": "heartbeat",
  "plugin_version": "1.0.0",
  "session_duration": 600,
  "session_start": "2025-10-17T10:00:00Z",
  "sketchup_version": "24.0.553",
  "platform": "Windows",
  "timestamp": 1729177800
}
```

**Server оновлює:**
- `system_infos.last_seen` = now
- `system_infos.system_data.session_duration` = 600
- Створює heartbeat record

**Лог:**
```
💓 Heartbeat відправлено (session: 10хв)
```

**Час:** ~500ms (async, не блокує UI)

---

**ПОВТОРЮЄТЬСЯ кожні 10 хвилин поки плагін активний.**

---

## 📊 SUMMARY TIMELINE

### З валідною ліцензією (швидкий шлях):

```
T+0ms      SketchUp запускається
T+700ms    Плагін завантажено (menu + toolbar створені)
           [Користувач чекає...]
           
T+?        Користувач клікає "proGran3 Конструктор"
T+0ms      SplashScreen.show викликано
T+200ms    Splash screen показано
T+700ms    JavaScript почав progress animation
T+2700ms   Progress animation завершена (5 кроків × 400ms)
T+2750ms   validate_license callback викликано
T+2850ms   HardwareFingerprint.generate (~100ms)
T+2950ms   LicenseStorage.load (файл знайдено, дешифровано)
T+3000ms   Fingerprint match ✅
T+3050ms   Not expired ✅
T+3100ms   Grace period OK ✅
T+3150ms   Background validation запущена (async)
T+3200ms   Результат повернено в JavaScript { valid: true }
T+4200ms   Після 1 сек затримки → license_valid callback
T+4300ms   Splash закривається
T+4400ms   Main UI створюється
T+5200ms   Main UI показано ✅
T+5300ms   ready callback викликано
T+5400ms   Activity Tracker запускається
T+5500ms   Startup event відправляється на сервер
T+6000ms   Startup event відправлено ✅
T+6100ms   Heartbeat timer запущено (10 хв interval)
T+6200ms   Користувач може працювати! ✅

T+600000ms (10 хв) - Перший heartbeat відправляється
T+1200000ms (20 хв) - Другий heartbeat...
...
```

**Загальний час: ~6 секунд** (від кліку до ready)  
**Perceived time: ~3 секунди** (від кліку до Main UI)

---

### Без ліцензії (повний шлях з активацією):

```
T+0ms      ... (те саме до validation)
T+3200ms   Результат валідації: { valid: false, error: 'no_license' }
T+4200ms   Після затримки → license_required callback
T+4300ms   Splash закривається
T+4400ms   License UI створюється
T+4700ms   License UI показано ✅
           
           [Користувач вводить email + key]
           
T+?        Користувач клікає "Активувати"
T+0ms      activate_license callback викликано
T+100ms    HardwareFingerprint.generate
T+200ms    HTTP POST /api/licenses/activate
T+2500ms   Server response отримано (активація успішна)
T+2600ms   LicenseStorage.save (шифрування + збереження)
T+2700ms   JavaScript показує success message
T+4200ms   Після 1.5 сек затримки - License UI закривається
T+4300ms   Main UI створюється
T+5100ms   Main UI показано ✅
T+5200ms   Activity Tracker запускається
T+5800ms   Startup event відправлено ✅
T+5900ms   Користувач може працювати! ✅
```

**Загальний час: ~10 секунд** (від кліку до ready, включно з activation)  
**User interaction: ~5 секунд** (вводить email + key)

---

## 🔄 КРИТИЧНІ ТОЧКИ ПРОЦЕСУ

### Point 1: Hardware Fingerprint Generation

**Де:** `HardwareFingerprint.generate`  
**Коли:** При валідації ліцензії + при активації  
**Важливість:** КРИТИЧНО (основа security)

**Що робить:**
```ruby
1. Читає motherboard serial (WMI)
2. Читає CPU ID (WMI)
3. Читає MAC address (GetMACAddress)
4. Читає disk serial (WMI)
5. Hostname + Platform
6. SHA256(всі компоненти)
   ↓
d41602e6dbe2c8cad2be11f4498a79175de20ae12b5517764c3ae352cd9b91dc
```

**Час:** ~50-150ms (залежить від системи)

**⚠️ Якщо цей крок провалюється → весь процес зупиняється!**

---

### Point 2: License File Decryption

**Де:** `LicenseStorage.load`  
**Коли:** При валідації ліцензії  
**Важливість:** КРИТИЧНО (без цього ліцензія не знайдена)

**Що робить:**
```ruby
1. Перевіряє файл існує: C:/Users/[USER]/.progran3/license.enc
2. Читає зашифровані дані
3. Derived key з fingerprint (PBKDF2)
4. Дешифрує (AES-256-CBC)
5. Парсить JSON
   ↓
{
  license_key: "PROGRAN3-...",
  email: "user@test.com",
  fingerprint: "d41602e6...",
  expires_at: "2025-11-16T10:00:00Z",
  last_validation: "2025-10-17T09:00:00Z"
}
```

**Час:** ~100-200ms

**⚠️ Якщо файл не знайдено або fingerprint не збігається → показується License UI**

---

### Point 3: Server Communication

**Де:** `ApiClient.activate` або `ApiClient.validate`  
**Коли:** При активації або background validation  
**Важливість:** ВИСОКА (але не блокує при offline)

**Що робить:**
```ruby
1. Створює HTTP request
2. Додає HMAC headers (якщо налаштовано)
3. POST на Vercel
4. Чекає response (timeout: 10 сек)
5. Парсить JSON
```

**Можливі результати:**
- ✅ Success (200) → license data
- ❌ Offline (SocketError) → використовує grace period
- ❌ Timeout → використовує grace period
- ❌ 401/403 → показує error

**Час:** ~500-2000ms (залежить від мережі)

**Graceful degradation:** При offline працює локально (grace period 7 днів)

---

### Point 4: Activity Tracker Startup

**Де:** `ActivityTracker.start_tracking`  
**Коли:** Після відкриття Main UI (ready callback)  
**Важливість:** СЕРЕДНЯ (моніторинг, не блокує роботу)

**Що робить:**
```ruby
1. Перевіряє ліцензію
2. Встановлює @session_start = now
3. Відправляє startup event (async)
4. Запускає heartbeat timer (10 хв)
```

**Час:** ~500-1000ms (startup event async, не блокує UI)

**⚠️ Якщо провалюється → просто логує warning, не зупиняє плагін**

---

## 🎯 DECISION POINTS (де система вибирає шлях)

### Decision 1: Ліцензія знайдена?

**Локація:** `LicenseManager.validate_license` (рядок 98)

```ruby
license = LicenseStorage.load

if license.nil?
  # ШЛЯХ A: Немає ліцензії → License UI
  return { valid: false, error: 'no_license' }
else
  # ШЛЯХ B: Є ліцензія → перевірки далі
end
```

**Impact:** Визначає чи показувати License UI (активація) або Main UI (робота)

---

### Decision 2: Fingerprint збігається?

**Локація:** `LicenseManager.validate_license` (рядок 108)

```ruby
if license[:fingerprint] != @fingerprint
  # ШЛЯХ A: Mismatch → показати error (ліцензія з іншого ПК)
  return { valid: false, error: 'hardware_mismatch' }
else
  # ШЛЯХ B: Match → перевірки далі
end
```

**Impact:** Захист від копіювання ліцензії на інший ПК

---

### Decision 3: Grace period expired?

**Локація:** `LicenseManager.check_grace_period` (рядок 167)

```ruby
last_validation = license[:last_validation]
days_offline = (Time.now - last_validation) / 86400

if days_offline > GRACE_PERIOD_DAYS  # 7 днів
  # ШЛЯХ A: Expired → потрібна online validation
  return { valid: false, require_online: true }
elsif days_offline > WARNING_PERIOD_DAYS  # 3 дні
  # ШЛЯХ B: Warning → працює але попереджає
  return { valid: true, warning: 'Рекомендуємо підключитись' }
else
  # ШЛЯХ C: OK → все добре
  return { valid: true }
end
```

**Impact:** Визначає чи потрібна online валідація

---

### Decision 4: Online validation успішна?

**Локація:** `LicenseManager.validate_online` (рядок 231)

```ruby
result = ApiClient.validate(license_key, fingerprint)

if result[:success] && result[:data][:valid]
  # ШЛЯХ A: Server підтвердив → оновити last_validation
  license[:last_validation] = Time.now
  LicenseStorage.save(license)
  return { valid: true, license: result[:data] }
else
  # ШЛЯХ B: Server відхилив → показати error
  return { valid: false, error: result[:error] }
end
```

**Impact:** Оновлює grace period або блокує якщо server відмовив

---

## 🧩 МОДУЛІ ТА ЇХ РОЛЬ

### Завантажені при startup:

**1. Core Modules (завжди):**
```ruby
constants.rb           # Шляхи, константи
logger.rb              # Система логування
error_handler.rb       # Обробка помилок
validation.rb          # Валідація inputs
```

**2. Business Logic:**
```ruby
dimensions_manager.rb      # Управління розмірами
coordination_manager.rb    # Координація елементів
callback_manager.rb        # Всі UI callbacks (найбільший - 1,310 lines)
```

**3. Builders (lazy load при потребі):**
```ruby
foundation_builder.rb      # Фундамент
tiling_builder.rb          # Плитка
fence_builder.rb           # Огорожа
cladding_builder.rb        # Облицювання
blind_area_builder.rb      # Відмостка
```

**4. UI Systems:**
```ruby
ui.rb                  # Main UI dialog
splash_screen.rb       # Startup splash
license_ui.rb          # License activation
demo_ui.rb             # Demo mode (не використовується)
```

**5. Security (lazy load при потребі):**
```ruby
hardware_fingerprint.rb    # Генерація PC ID
license_storage.rb         # Шифрування/дешифрування
api_client.rb              # HTTP client
license_manager.rb         # Головний контролер
```

**6. Activity Tracking:**
```ruby
activity_tracker.rb        # Startup events + heartbeats
```

---

## 📈 PERFORMANCE METRICS

### Startup без ліцензії (перший раз):

```
Завантаження модулів:        ~700ms
Splash screen show:          ~200ms
Progress animation:          ~2000ms
License validation:          ~150ms (файл не знайдено - швидко)
License UI show:             ~300ms
────────────────────────────────────
До License UI:               ~3.3 секунди

[Користувач вводить + активує:  ~5-10 секунд]

Activation:                  ~2500ms
Main UI show:                ~800ms
Activity Tracker start:      ~500ms
────────────────────────────────────
До ready:                    ~7-12 секунд загалом
```

---

### Startup з ліцензією (наступні рази):

```
Завантаження модулів:        ~700ms
Splash screen show:          ~200ms
Progress animation:          ~2000ms
License validation:          ~250ms (локальна перевірка)
Main UI show:                ~800ms
Activity Tracker start:      ~500ms
Startup event:               ~500ms (async, не блокує)
────────────────────────────────────
До ready:                    ~4.5 секунди
Perceived time:              ~4 секунди (startup event в фоні)
```

**Користувач може працювати через ~4 секунди!**

---

### Background processes (не блокують):

```
Background validation:       ~500-1000ms (якщо потрібна)
Startup event:               ~500-800ms
Periodic heartbeat:          ~500ms (кожні 10 хв)
```

**НЕ впливають на perceived performance!**

---

## 🔍 DEBUGGING POINTS

### Де шукати проблеми:

**"Плагін не запускається":**
```
1. Перевірте Ruby Console → чи є помилки при завантаженні?
2. Перевірте чи всі файли на місці (proGran3.rb + proGran3/)
3. Перевірте чи немає syntax errors (Ruby Console покаже)
```

**"Splash screen показується але зависає":**
```
1. Ruby Console → чи validate_license callback викликався?
2. Чи є помилки в LicenseManager?
3. Чи HardwareFingerprint генерується? (може бути PermissionError)
```

**"License UI не активує":**
```
1. Ruby Console → чи activate_license callback викликався?
2. Чи є інтернет?
3. Чи правильний URL сервера в api_client.rb?
4. Server logs → чи запит дійшов?
```

**"Main UI показується але Activity Tracker не запускається":**
```
1. Ruby Console → чи є помилка в start_tracking?
2. Чи ліцензія валідна? (tracking потребує ліцензію)
3. Чи startup event відправився? (може offline - не критично)
```

---

## ✅ CHECKLIST для нової feature

### Якщо додаєте новий крок в startup:

- [ ] Додати в правильну фазу (не блокувати швидкі фази)
- [ ] Додати error handling (rescue => e)
- [ ] Додати логування (puts з емодзі)
- [ ] Не блокувати UI (async якщо можливо)
- [ ] Graceful degradation (якщо щось провалюється - продовжити)
- [ ] Оновити цей документ з новим кроком!

---

## 🎯 OPTIMIZATION TIPS

### Що вже оптимізовано:

✅ **Lazy loading security modules**
- Завантажуються тільки при потребі
- Не завантажуються якщо ліцензія валідна і в cache

✅ **Async background operations**
- Background validation не блокує
- Startup event не блокує
- Heartbeats не блокують

✅ **Fingerprint caching**
- Генерується раз, кешується на 1 годину

✅ **Grace period**
- 99% часу працює offline (тільки локальна валідація)
- Online тільки раз на 3-7 днів

---

### Що НЕ треба оптимізувати:

❌ **Progress animation** (2 сек) - це UX, не performance issue  
❌ **Splash delays** (1 сек) - для показу повідомлень користувачу  
❌ **Module loading** (700ms) - вже мінімальне

---

## 📊 FINAL SUMMARY

**Startup flow складається з 8 фаз:**

1. **SketchUp Startup** (~700ms) - автоматично
2. **User Click → Splash** (~350ms) - клік
3. **Progress Animation** (~2000ms) - UX
4. **License Validation** (~200-1200ms) - критично
5. **Result Processing** (~1000ms) - JavaScript
6. **Main UI або License UI** (~800-5000ms) - залежить від сценарію
7. **Activity Tracker** (~500-1000ms) - background
8. **Periodic Heartbeat** (кожні 10 хв) - background

**Загальний час (з ліцензією):** ~4-6 секунд  
**Perceived time:** ~3-4 секунди  
**Критичні точки:** Fingerprint, Validation, Server communication

**Graceful degradation:** При offline працює локально ✅

---

**Створено:** 17 жовтня 2025  
**Версія:** 1.0  
**Для:** ProGran3 Development Team

