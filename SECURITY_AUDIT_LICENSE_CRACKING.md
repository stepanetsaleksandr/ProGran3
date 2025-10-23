# 🔐 Security Audit: Можливість зламу системи ліцензування

**Дата:** 23 жовтня 2025  
**Версія:** 3.2.1  
**Тип аналізу:** Penetration Testing / Code Review

---

## 🎯 МЕТА АНАЛІЗУ

Проаналізувати чи може зловмисник, отримавши доступ до `.rbz` файлу плагіна:
1. Обійти систему ліцензування
2. Створити фальшиві ліцензії
3. Використовувати плагін безкоштовно
4. Передати ліцензію іншим користувачам

---

## 📁 ФАЙЛИ ДОСТУПНІ ЗЛОВМИСНИКУ

Після встановлення `.rbz` плагіна, зловмисник має доступ до:

```
%APPDATA%\SketchUp\SketchUp 2024\SketchUp\Plugins\
├── proGran3.rb                                    # Loader
├── proGran3_core.rb                               # Main plugin
├── proGran3/
│   ├── security/
│   │   ├── license_manager.rb                    # ⚠️ КРИТИЧНИЙ
│   │   ├── api_client.rb                         # ⚠️ КРИТИЧНИЙ
│   │   ├── hardware_fingerprint.rb               # ⚠️ КРИТИЧНИЙ
│   │   └── license_storage.rb                    # ⚠️ КРИТИЧНИЙ
│   └── ...
└── config.json                                    # API URL
```

---

## 🚨 КРИТИЧНІ ВРАЗЛИВОСТІ

### **1. HMAC SECRET KEY ЗАХАРДКОЖЕНИЙ** ⚠️⚠️⚠️

**Файл:** `api_client.rb:58`

```ruby
def self.get_secret_key
  'ProGran3-HMAC-Global-Secret-2025-v3.1-DO-NOT-SHARE-9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d'
end
```

**Проблема:**
- ✅ Секрет **ВІДКРИТИЙ** в коді
- ✅ Будь-який зловмисник може прочитати його
- ✅ Може створювати валідні HMAC підписи для запитів

**Можливість експлуатації:** 🔴 **ВИСОКА**

**Що може зловмисник:**
```ruby
# Зловмисник може створити фальшивий запит з валідним HMAC
secret = 'ProGran3-HMAC-Global-Secret-2025-v3.1-DO-NOT-SHARE-9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d'
body = { license_key: 'FAKE-KEY', system_fingerprint: 'FAKE-FP' }.to_json
timestamp = Time.now.to_i
signature = OpenSSL::HMAC.hexdigest('SHA256', secret, "#{body}#{timestamp}")

# Тепер може робити запити з валідним підписом!
```

**Захист на сервері:**
- ✅ Сервер перевіряє HMAC
- ✅ Але секрет той самий!
- ❌ Rate limiting може обмежити кількість спроб
- ❌ Але не захистить від атаки з валідним HMAC

**Вирок:** 🔴 **КРИТИЧНА ВРАЗЛИВІСТЬ**

---

### **2. ENCRYPTION KEY БАЗУЄТЬСЯ НА HARDWARE FINGERPRINT** ⚠️⚠️

**Файл:** `license_storage.rb:280-300`

```ruby
def self.derive_encryption_key
  fp = HardwareFingerprint.generate
  salt = 'ProGran3-License-Salt-v1.0'  # ⚠️ ПУБЛІЧНИЙ SALT
  iterations = 100000
  
  OpenSSL::PKCS5.pbkdf2_hmac(
    fp[:fingerprint],  # ⚠️ ПРЕДСКАЗУЄМИЙ
    salt,              # ⚠️ ЗАХАРДКОЖЕНИЙ
    iterations,
    32,
    OpenSSL::Digest::SHA256.new
  )
end
```

**Проблема:**
- Fingerprint генерується з **ПУБЛІЧНИХ** даних
- Salt **ЗАХАРДКОЖЕНИЙ** в коді
- Зловмисник може згенерувати той самий ключ

**Що може зловмисник:**
```ruby
# 1. Прочитати як генерується fingerprint (hardware_fingerprint.rb)
# 2. Згенерувати свій fingerprint
fp = HardwareFingerprint.generate

# 3. Використати той самий salt
salt = 'ProGran3-License-Salt-v1.0'

# 4. Згенерувати ключ шифрування
key = OpenSSL::PKCS5.pbkdf2_hmac(fp[:fingerprint], salt, 100000, 32, OpenSSL::Digest::SHA256.new)

# 5. Розшифрувати license.enc з іншого ПК
# 6. Змінити fingerprint на свій
# 7. Зашифрувати назад

# РЕЗУЛЬТАТ: Ліцензія "перенесена" на інший ПК!
```

**Вирок:** 🔴 **КРИТИЧНА ВРАЗЛИВІСТЬ**

---

### **3. GRACE PERIOD BYPASS (TIME TAMPERING)** ⚠️

**Файл:** `license_manager.rb:228-241`

```ruby
# Перевірка time tampering
if Time.now < last_validation_time
  return {
    action: :block,
    message: 'Виявлено зміну системного часу.'
  }
end
```

**Проблема:**
- Перевіряється лише зміна часу **НАЗАД**
- НЕ перевіряється зміна часу **ВПЕРЕД**

**Що може зловмисник:**
```ruby
# 1. Встановити плагін
# 2. Активувати ліцензію (1 день grace period)
# 3. Змінити системний час на 1 день вперед
# 4. Запустити плагін (grace period оновиться)
# 5. Повернути час назад
# 6. Змінити license.enc: last_validation = поточний час
# 7. БЕЗКІНЕЧНИЙ GRACE PERIOD!
```

**Захист:**
- ✅ Перевірка зміни часу назад
- ❌ НЕ перевірка зміни часу вперед
- ❌ НЕ використання NTP серверів

**Вирок:** 🟠 **СЕРЕДНЯ ВРАЗЛИВІСТЬ**

---

### **4. OFFLINE MODE МОЖНА ПРОДОВЖИТИ** ⚠️

**Файл:** `license_manager.rb:14`

```ruby
GRACE_PERIOD_DAYS = 1  # Тільки 1 день offline
```

**Проблема:**
- Grace period зберігається в `license.enc`
- Файл можна модифікувати

**Що може зловмисник:**
```ruby
# 1. Зчитати license.enc
encrypted = File.read('~/.progran3/license.enc')

# 2. Розшифрувати (знаючи як генерується ключ)
decrypted = decrypt_with_known_method(encrypted)

# 3. Змінити last_validation на поточний час
decrypted[:last_validation] = Time.now.iso8601

# 4. Зашифрувати назад
encrypted_new = encrypt_with_known_method(decrypted)

# 5. Записати назад
File.write('~/.progran3/license.enc', encrypted_new)

# РЕЗУЛЬТАТ: Grace period "обнулено"!
```

**Вирок:** 🟠 **СЕРЕДНЯ ВРАЗЛИВІСТЬ**

---

### **5. SERVER URL МОЖНА ЗМІНИТИ** ⚠️

**Файл:** `config.json`

```json
{
  "api": {
    "base_url": "https://server-hbf7li0u7-provis3ds-projects.vercel.app"
  }
}
```

**Проблема:**
- URL не захищений
- Можна замінити на фальшивий сервер

**Що може зловмисник:**
```ruby
# 1. Створити фальшивий сервер який завжди повертає success
# 2. Змінити config.json:
{
  "api": {
    "base_url": "http://localhost:3000"  # Фальшивий сервер
  }
}

# 3. Фальшивий сервер:
POST /api/licenses/validate
→ { success: true, valid: true }

# РЕЗУЛЬТАТ: Плагін думає що ліцензія валідна!
```

**Вирок:** 🟠 **СЕРЕДНЯ ВРАЗЛИВІСТЬ**

---

### **6. MACHINE GUID ОБХІД (FLEXIBLE VALIDATION)** ⚠️

**Файл:** `hardware_fingerprint.rb:60-89`

```ruby
def self.validate_flexible(stored_components, current_components)
  # Machine GUID має збігатися
  return false if stored_components[:machine_guid] != current_components[:machine_guid]
  
  # Але інші компоненти flexible (2 з 3)
  matches = 0
  [:volume_serial, :bios_serial, :mac_address].each do |key|
    matches += 1 if stored_components[key] == current_components[key]
  end
  
  matches >= 2  # Достатньо 2 з 3
end
```

**Проблема:**
- Machine GUID **МОЖНА ЗМІНИТИ** в Registry
- Flexible validation дозволяє 2 з 3 інших компонентів

**Що може зловмисник:**
```ruby
# 1. Скопіювати license.enc з легального ПК
# 2. Змінити Machine GUID в Registry:
# HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Cryptography\MachineGuid

# 3. Підробити ще 2 компоненти:
# - Volume Serial (змінити через diskpart)
# - BIOS Serial (може бути однаковий на однакових ПК)
# - MAC Address (змінити в Network Adapter properties)

# РЕЗУЛЬТАТ: Fingerprint збігається!
```

**Складність:** 🟠 Середня (потрібні права адміністратора)

**Вирок:** 🟠 **СЕРЕДНЯ ВРАЗЛИВІСТЬ**

---

## 💰 ЕКОНОМІКА АТАКИ

### **Варіант 1: Фальшивий сервер**

**Складність:** 🟢 Низька  
**Час:** 1-2 години  
**Навички:** Базові (Ruby, HTTP)

**Крок и:**
1. Встановити локальний HTTP сервер
2. Змінити `config.json` → `"base_url": "http://localhost:3000"`
3. Сервер завжди повертає `{ success: true, valid: true }`
4. **Плагін працює безкоштовно!**

**Код фальшивого сервера:**
```ruby
require 'sinatra'

post '/api/licenses/activate' do
  content_type :json
  { success: true, data: { status: 'active', valid: true } }.to_json
end

post '/api/licenses/validate' do
  content_type :json
  { success: true, data: { valid: true }, offline: false }.to_json
end

# ruby server.rb
```

**Захист:** ❌ ВІДСУТНІЙ (URL не перевіряється)

---

### **Варіант 2: Модифікація license.enc**

**Складність:** 🟠 Середня  
**Час:** 4-6 годин  
**Навички:** Середні (Ruby, Cryptography)

**Кроки:**
1. Прочитати код шифрування в `license_storage.rb`
2. Згенерувати свій fingerprint
3. Розшифрувати `license.enc`
4. Змінити `last_validation` на поточний час
5. Зашифрувати назад
6. **Grace period "обнулено"!**

**Код:**
```ruby
# Скрипт для "скидання" grace period
require_relative 'plugin/proGran3/security/license_storage'
require_relative 'plugin/proGran3/security/hardware_fingerprint'

license = ProGran3::Security::LicenseStorage.load
license[:last_validation] = Time.now.iso8601
ProGran3::Security::LicenseStorage.save(license)

puts "✅ Grace period обнулено!"
```

**Захист:** ⚠️ СЛАБКИЙ (encryption key предсказуємий)

---

### **Варіант 3: Patch binary**

**Складність:** 🔴 Висока  
**Час:** 1-2 дні  
**Навички:** Високі (Reverse Engineering, Assembly)

**Кроки:**
1. Декомпілювати Ruby bytecode
2. Знайти функцію `validate_license`
3. Змінити `return { valid: false }` → `return { valid: true }`
4. Рекомпілювати
5. **Ліцензія завжди валідна!**

**Інструменти:**
- RubyDecompiler
- Hex Editor
- IDA Pro / Ghidra

**Захист:** ⚠️ СЛАБКИЙ (Ruby легко декомпілювати)

---

### **Варіант 4: Keygen (найскладніший)**

**Складність:** 🔴 Дуже висока  
**Час:** Тижні  
**Навички:** Експерт (Reverse Engineering, Crypto)

**Кроки:**
1. Reverse engineer алгоритм генерації ліцензійних ключів на сервері
2. Створити keygen
3. Генерувати валідні ключі

**Захист:** ✅ СИЛЬНИЙ (алгоритм на сервері, недоступний)

---

## 🎯 РЕЙТИНГ ВРАЗЛИВОСТЕЙ

| Вразливість | Складність | Ймовірність | Вплив | Пріоритет |
|-------------|------------|-------------|-------|-----------|
| **Фальшивий сервер** | 🟢 Низька | 🔴 Висока | 🔴 Критичний | 🔴 **P0** |
| **HMAC Secret exposed** | 🟢 Низька | 🟠 Середня | 🔴 Критичний | 🔴 **P0** |
| **License.enc модифікація** | 🟠 Середня | 🟠 Середня | 🟠 Високий | 🟠 **P1** |
| **Time tampering forward** | 🟠 Середня | 🟠 Середня | 🟠 Високий | 🟠 **P1** |
| **Machine GUID підробка** | 🟠 Середня | 🟢 Низька | 🟠 Високий | 🟢 **P2** |
| **Binary patch** | 🔴 Висока | 🟢 Низька | 🔴 Критичний | 🟢 **P2** |

---

## 🛡️ РЕКОМЕНДАЦІЇ ПО УСУНЕННЮ

### **P0: КРИТИЧНО (негайно)**

#### **1. Захист API URL** 

**Проблема:** URL можна замінити на фальшивий сервер

**Рішення:**
```ruby
# api_client.rb
KNOWN_SERVERS = [
  'server-hbf7li0u7-provis3ds-projects.vercel.app',
  'api.progran3.com',
  'progran3.vercel.app'
].freeze

def self.validate_server_url(url)
  uri = URI.parse(url)
  
  # 1. Перевірка домену
  unless KNOWN_SERVERS.any? { |s| uri.host.include?(s) }
    raise SecurityError, "Invalid server URL"
  end
  
  # 2. Перевірка SSL сертифіката
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  http.verify_mode = OpenSSL::SSL::VERIFY_PEER
  
  # 3. Certificate pinning
  expected_fingerprint = 'SHA256_CERT_FINGERPRINT'
  actual_fingerprint = get_cert_fingerprint(http)
  
  unless actual_fingerprint == expected_fingerprint
    raise SecurityError, "Certificate mismatch"
  end
  
  true
end
```

**Ефект:** ✅ Фальшивий сервер не працюватиме

---

#### **2. Приховати HMAC Secret**

**Проблема:** Secret відкритий в коді

**Рішення A: Обфускація (швидко, але не ідеально)**
```ruby
def self.get_secret_key
  # Розбити на частини
  parts = [
    'ProGran3',
    'HMAC',
    'Global',
    'Secret',
    '2025',
    'v3.1',
    'DO-NOT-SHARE',
    '9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d'
  ]
  
  # XOR з fingerprint
  fp = HardwareFingerprint.generate[:fingerprint][0..31]
  secret = parts.join('-')
  
  # XOR кожен символ
  secret.chars.zip(fp.chars.cycle).map { |a, b| (a.ord ^ b.ord).chr }.join
end
```

**Рішення B: Динамічне завантаження (краще)**
```ruby
def self.get_secret_key
  # Завантажити з сервера при першому запуску
  cached_secret = load_from_secure_cache
  return cached_secret if cached_secret
  
  # Запит на сервер
  response = Net::HTTP.get(URI("#{API_BASE_URL}/api/get-client-secret"))
  secret = decrypt_response(response, HardwareFingerprint.generate[:fingerprint])
  
  save_to_secure_cache(secret)
  secret
end
```

**Ефект:** ⚠️ Ускладнює, але не унеможливлює зламНе можу продовжити через обмеження. Створю фінальну версію з висновками:

<function_calls>
<invoke name="search_replace">
<parameter name="file_path">SECURITY_AUDIT_LICENSE_CRACKING.md
