# ЗМІНИ ДЛЯ ЛІЦЕНЗІЙНОЇ СИСТЕМИ - ДЕТАЛЬНИЙ ОПИС

## 📋 ОГЛЯД ЗМІН

Цей документ описує всі зміни, які були зроблені для реалізації ліцензійної системи в ProGran3. Якщо потрібно відкотити до робочого стану, використовуйте цей документ як посібник.

## 🎯 МЕТА ЗМІН

Реалізувати повноцінну ліцензійну систему з:
- Генерацією ліцензій через адмін панель
- Активацією ліцензій в плагіні
- HMAC підписом для безпеки
- Відображенням статусу ліцензії в UI

## 📁 ФАЙЛИ, ЯКІ БУЛИ ЗМІНЕНІ

### 1. **plugin/proGran3/ui.rb**
**Що змінено:** Callback `license_display_info`
**Проблема:** Повертав дані через `execute_script`, що викликало JSON.parse помилки
**Рішення:** Прямий повернення JSON через `result.to_json`

```ruby
# БУЛО:
@dialog.execute_cript("updateLicenseStatusWithData('#{result.to_json}')")

# СТАЛО:
result.to_json  # Прямий повернення JSON
```

### 2. **plugin/proGran3/web/script.js**
**Що змінено:** Функції `updateLicenseStatus()` та `updateLicenseStatusWithData()`
**Проблема:** Неправильна обробка JSON даних від Ruby
**Рішення:** Додана перевірка типу даних та правильний парсинг

```javascript
// БУЛО:
const result = window.sketchup.license_display_info();
const licenseDisplayInfo = JSON.parse(result);

// СТАЛО:
const result = window.sketchup.license_display_info();
if (typeof result === 'object' && result !== null) {
  licenseDisplayInfo = result;
} else if (typeof result === 'string') {
  licenseDisplayInfo = JSON.parse(result);
}
```

### 3. **server/app/api/admin/licenses/generate/route.ts** (НОВИЙ ФАЙЛ)
**Що створено:** API endpoint для генерації ліцензій в адмін панелі
**Проблема:** Відсутній endpoint для створення ліцензій
**Рішення:** Створено повноцінний endpoint з JWT аутентифікацією

### 4. **server/app/hooks/useLicenses.ts**
**Що змінено:** Функція `createLicense`
**Проблема:** Неправильний URL та обробка помилок
**Рішення:** Оновлено URL та додана правильна обробка JSON

### 5. **plugin/proGran3/system/core/config_manager.rb**
**Що змінено:** Додано HMAC підпис
**Проблема:** Відсутній HMAC підпис для безпеки
**Рішення:** Додано методи `create_hmac_signature` та `create_authenticated_headers`

```ruby
# ДОДАНО:
def self.create_hmac_signature(body, timestamp)
  require 'openssl'
  secret = ENV['HMAC_SECRET_KEY'] || get_fallback_secret
  normalized_body = body.strip.force_encoding('UTF-8')
  normalized_timestamp = timestamp.to_i
  message = "#{normalized_body}#{normalized_timestamp}"
  hmac = OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha256'), secret, message)
  hmac
end
```

### 6. **plugin/proGran3/system/network/network_client.rb**
**Що змінено:** Додано HMAC заголовки до запитів
**Проблема:** Відсутні заголовки безпеки
**Рішення:** Додано `X-Signature` заголовок до всіх запитів

### 7. **server/app/api/licenses/activate/route.ts**
**Що змінено:** Додано HMAC валідацію
**Проблема:** Відсутня валідація HMAC підпису
**Рішення:** Додано `requireHMAC(request)` для валідації

### 8. **plugin/config.json**
**Що змінено:** Оновлено URL сервера
**Проблема:** Використовувався динамічний Vercel URL
**Рішення:** Змінено на статичний URL `https://server-one-amber.vercel.app`

## 🔧 ТЕХНІЧНІ ДЕТАЛІ

### HMAC Підпис
- **Алгоритм:** SHA256
- **Бібліотека:** OpenSSL::HMAC (замість Digest::HMAC)
- **Секрет:** `ProGran3-Secure-HMAC-Secret-2025-v3.2-SERVER-ONLY-9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d`
- **Формат:** `HMAC(body + timestamp)`

### Заголовки безпеки
```
X-Fingerprint: hardware_fingerprint
X-Timestamp: unix_timestamp
X-Signature: hmac_signature
X-Endpoint: /api/licenses/activate
X-Plugin-Version: 3.2.0
```

### JSON Обробка
- **Проблема:** `JSON.parse: unexpected end of data`
- **Причина:** Ruby повертав дані через `execute_script`
- **Рішення:** Прямий повернення JSON з Ruby callback

## 🚨 ПРОБЛЕМИ, ЯКІ ВИНИКЛИ

### 1. **LoadError: library not found for class Digest::HMAC**
**Причина:** SketchUp не має Digest::HMAC
**Рішення:** Перехід на OpenSSL::HMAC

### 2. **Invalid HMAC signature**
**Причина:** Різні секрети на клієнті та сервері
**Рішення:** Уніфікація секрету через `get_fallback_secret`

### 3. **Timestamp mismatch**
**Причина:** Різні timestamp для HMAC та заголовка
**Рішення:** Генерація timestamp один раз в `create_authenticated_headers`

### 4. **JSON body inconsistency**
**Причина:** Різний порядок ключів в JSON
**Рішення:** Нормалізація payload через `normalize_payload`

## 📊 СТАТИСТИКА ЗМІН

- **Нових файлів:** 1 (server/app/api/admin/licenses/generate/route.ts)
- **Змінених файлів:** 7
- **Додано рядків коду:** ~200
- **Видалено рядків коду:** ~50
- **Тестових файлів створено:** 5

## 🔄 ПЛАН ВІДКАТУВАННЯ

### Крок 1: Відкат серверних змін
```bash
# Видалити новий файл
rm server/app/api/admin/licenses/generate/route.ts

# Відкат змін в useLicenses.ts
git checkout HEAD~1 server/app/hooks/useLicenses.ts

# Відкат змін в activate/route.ts
git checkout HEAD~1 server/app/api/licenses/activate/route.ts
```

### Крок 2: Відкат плагінових змін
```bash
# Відкат ui.rb
git checkout HEAD~1 plugin/proGran3/ui.rb

# Відкат script.js
git checkout HEAD~1 plugin/proGran3/web/script.js

# Відкат config_manager.rb
git checkout HEAD~1 plugin/proGran3/system/core/config_manager.rb

# Відкат network_client.rb
git checkout HEAD~1 plugin/proGran3/system/network/network_client.rb

# Відкат config.json
git checkout HEAD~1 plugin/config.json
```

### Крок 3: Очищення тестових файлів
```bash
# Видалити тестові файли
rm plugin/proGran3/test_*.rb
rm plugin/proGran3/simple_test.rb
rm plugin/proGran3/debug_*.rb
rm plugin/proGran3/force_reload_*.rb
```

## ✅ ПЕРЕВІРКА ПІСЛЯ ВІДКАТУВАННЯ

1. **Плагін завантажується без помилок**
2. **UI відображається правильно**
3. **Побудова компонентів працює**
4. **Немає помилок в консолі**
5. **Ліцензійний UI не показується (як було раніше)**

## 📝 ВИСНОВКИ

Ліцензійна система була успішно реалізована, але потребувала багато змін в архітектурі. Основні проблеми:
- Неправильна обробка JSON між Ruby та JavaScript
- Відсутність HMAC безпеки
- Проблеми з бібліотеками в SketchUp
- Неправильна обробка помилок

Всі зміни були зроблені з урахуванням існуючої архітектури плагіна.

---
**Дата створення:** 25 жовтня 2025  
**Автор:** AI Assistant  
**Версія:** 1.0

