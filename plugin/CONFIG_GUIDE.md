# 🔧 Керівництво з конфігурації ProGran3

## 📋 Огляд

ProGran3 тепер має гнучку систему конфігурації, яка дозволяє налаштовувати URL сервера відстеження та інші параметри без зміни коду.

## 🚀 Швидкий старт

### 1. Отримання поточного URL сервера
```ruby
# В консолі Ruby SketchUp
ProGran3.get_server_url
```

### 2. Зміна URL сервера
```ruby
# Встановити новий URL
ProGran3.set_server_url("https://your-new-server.com")
```

### 3. Тестування підключення
```ruby
# Перевірити доступність сервера
ProGran3.test_server_connection
```

## ⚙️ Методи конфігурації

### **Отримання налаштувань**
```ruby
# Отримати всі налаштування
config = ProGran3.get_config
puts config['tracking_server_url']
```

### **Оновлення налаштувань**
```ruby
# Оновити кілька налаштувань
ProGran3.update_config({
  'tracking_server_url' => 'https://new-server.com',
  'heartbeat_interval' => 1800,
  'debug_mode' => true
})
```

## 📁 Файли конфігурації

### **config.json** (основний файл)
```json
{
  "tracking_server_url": "https://progran3-tracking-server-1rp48ns42-provis3ds-projects.vercel.app",
  "fallback_server_url": "https://httpbin.org/post",
  "heartbeat_interval": 3600,
  "max_retries": 3,
  "retry_delay": 30,
  "offline_fallback_enabled": true,
  "offline_fallback_duration": 48,
  "debug_mode": false
}
```

### **Змінні середовища**
```bash
# Windows
set PROGRAN3_TRACKING_URL=https://your-server.com

# Linux/macOS
export PROGRAN3_TRACKING_URL=https://your-server.com
```

## 🔄 Пріоритет конфігурації

1. **Змінна середовища** `PROGRAN3_TRACKING_URL` (найвищий пріоритет)
2. **Файл config.json** (середній пріоритет)
3. **Дефолтні значення** (найнижчий пріоритет)

## 🛠️ Налаштування параметрів

### **tracking_server_url**
- **Опис:** URL сервера відстеження
- **Тип:** String
- **Приклад:** `"https://your-server.com"`

### **heartbeat_interval**
- **Опис:** Інтервал heartbeat в секундах
- **Тип:** Integer
- **Приклад:** `3600` (1 година)

### **max_retries**
- **Опис:** Максимальна кількість повторних спроб
- **Тип:** Integer
- **Приклад:** `3`

### **retry_delay**
- **Опис:** Затримка між спробами в секундах
- **Тип:** Integer
- **Приклад:** `30`

### **offline_fallback_enabled**
- **Опис:** Увімкнути offline режим
- **Тип:** Boolean
- **Приклад:** `true`

### **debug_mode**
- **Опис:** Режим відладки
- **Тип:** Boolean
- **Приклад:** `false`

## 🧪 Тестування

### **Автоматичне тестування**
```ruby
# Запустити тест конфігурації
load 'test_config.rb'
```

### **Ручне тестування**
```ruby
# 1. Перевірити поточний URL
puts ProGran3.get_server_url

# 2. Тестувати підключення
result = ProGran3.test_server_connection
puts result[:success] ? "✅ Доступний" : "❌ Недоступний"

# 3. Оновити налаштування
ProGran3.update_config({'debug_mode' => true})
```

## 🔧 Розробка

### **Додавання нових параметрів**
1. Додайте параметр в `get_default_config()` в `config.rb`
2. Оновіть `config.json` з новим параметром
3. Додайте валідацію в `Config` модуль

### **Приклад додавання параметра**
```ruby
# В config.rb
def self.get_default_config
  {
    # ... існуючі параметри
    'new_parameter' => 'default_value'
  }
end
```

## 🚨 Вирішення проблем

### **Проблема: URL не оновлюється**
```ruby
# Перевірте права доступу до файлу
puts File.writable?(ProGran3::Config::CONFIG_FILE_PATH)

# Перевірте вміст файлу
puts File.read(ProGran3::Config::CONFIG_FILE_PATH)
```

### **Проблема: Сервер недоступний**
```ruby
# Тестуйте з різними URL
ProGran3.test_server_connection("https://httpbin.org/post")
ProGran3.test_server_connection("https://google.com")
```

### **Проблема: Конфігурація не завантажується**
```ruby
# Перевірте шлях до файлу
puts ProGran3::Config::CONFIG_FILE_PATH

# Перевірте існування файлу
puts File.exist?(ProGran3::Config::CONFIG_FILE_PATH)
```

## 📚 Корисні команди

```ruby
# Отримати поточний URL
ProGran3.get_server_url

# Встановити новий URL
ProGran3.set_server_url("https://new-server.com")

# Тестувати підключення
ProGran3.test_server_connection

# Отримати всі налаштування
ProGran3.get_config

# Оновити налаштування
ProGran3.update_config({'debug_mode' => true})

# Перезавантажити плагін
ProGran3.reload
```

## 🎯 Найкращі практики

1. **Завжди тестуйте** новий URL перед зміною
2. **Використовуйте змінні середовища** для різних середовищ
3. **Робіть резервні копії** config.json перед змінами
4. **Моніторьте логи** при зміні налаштувань
5. **Тестуйте offline режим** для надійності

---

**Останнє оновлення:** 2024-01-01  
**Версія:** 1.0.0  
**Автор:** ProGran3 Development Team
