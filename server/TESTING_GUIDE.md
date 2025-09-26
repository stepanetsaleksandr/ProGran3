# 🧪 Керівництво з тестування ProGran3

## 📋 **Типи тестування**

### **1. Мануальне тестування сервера**

#### **Перевірка доступності:**
```bash
# Головна сторінка
curl https://progran3-tracking-server-odv98n7ek-provis3ds-projects.vercel.app/

# API endpoints
curl https://progran3-tracking-server-odv98n7ek-provis3ds-projects.vercel.app/api/init
curl https://progran3-tracking-server-odv98n7ek-provis3ds-projects.vercel.app/api/plugins
```

#### **Тестування через браузер:**
1. Відкрийте: `https://progran3-tracking-server-odv98n7ek-provis3ds-projects.vercel.app/`
2. Натисніть "Перейти до Dashboard"
3. Перевірте завантаження даних

### **2. Тестування API endpoints**

#### **Health Check:**
```bash
curl -X GET https://progran3-tracking-server-odv98n7ek-provis3ds-projects.vercel.app/api/init
```
**Очікуваний результат:** `{"success":true,"message":"Database initialized successfully"}`

#### **Heartbeat Test:**
```bash
curl -X POST https://progran3-tracking-server-odv98n7ek-provis3ds-projects.vercel.app/api/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "plugin_id": "test-plugin-123",
    "plugin_name": "ProGran3",
    "version": "1.0.0",
    "user_id": "test@example.com",
    "computer_name": "test-computer",
    "system_info": {
      "os": "Windows",
      "ruby_version": "3.0.0",
      "sketchup_version": "2024",
      "architecture": "64-bit"
    },
    "timestamp": "2024-12-19T10:00:00Z",
    "action": "heartbeat_update",
    "source": "sketchup_plugin",
    "update_existing": true,
    "force_update": false
  }'
```

#### **License Registration Test:**
```bash
curl -X POST https://progran3-tracking-server-odv98n7ek-provis3ds-projects.vercel.app/api/license/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "license_key": "TEST-LICENSE-KEY-123",
    "hardware_id": "test-hardware-id"
  }'
```

### **3. Тестування плагіна в SketchUp**

#### **Підготовка:**
1. Відкрийте SketchUp
2. Завантажте плагін ProGran3
3. Перевірте URL в `plugin/proGran3.rb`:
   ```ruby
   @base_url = 'https://progran3-tracking-server-odv98n7ek-provis3ds-projects.vercel.app'
   ```

#### **Тестування heartbeat:**
1. Відкрийте UI плагіна
2. Перевірте логи в Ruby Console
3. Очікувані логи:
   ```
   📊 Трекер ініціалізовано
   🚀 Запуск відстеження ProGran3...
   📡 Відправка heartbeat до: https://progran3-tracking-server-odv98n7ek-provis3ds-projects.vercel.app/api/heartbeat
   ✅ HEARTBEAT УСПІШНО ВІДПРАВЛЕНО!
   ```

### **4. Тестування бази даних**

#### **Перевірка Supabase:**
1. Відкрийте Supabase Dashboard
2. Перейдіть в Table Editor
3. Перевірте таблиці:
   - `licenses` - має містити тестові ліцензії
   - `user_licenses` - має містити зареєстровані ліцензії
   - `plugins` - має містити активні плагіни

#### **SQL перевірка:**
```sql
-- Перевірка таблиць
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('licenses', 'user_licenses', 'plugins');

-- Перевірка даних
SELECT COUNT(*) FROM licenses;
SELECT COUNT(*) FROM user_licenses;
SELECT COUNT(*) FROM plugins;
```

### **5. Тестування безпеки**

#### **Rate Limiting:**
```bash
# Тест rate limiting (має повернути 429 після 100 запитів)
for i in {1..150}; do 
  curl https://progran3-tracking-server-odv98n7ek-provis3ds-projects.vercel.app/api/heartbeat
done
```

#### **CORS Testing:**
```bash
# Тест CORS
curl -H "Origin: https://progran3.com" \
  https://progran3-tracking-server-odv98n7ek-provis3ds-projects.vercel.app/api/heartbeat
```

### **6. Тестування помилок**

#### **Невірні дані:**
```bash
# Невірний email
curl -X POST https://progran3-tracking-server-odv98n7ek-provis3ds-projects.vercel.app/api/license/register \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", "license_key": "TEST", "hardware_id": "test"}'

# Відсутні поля
curl -X POST https://progran3-tracking-server-odv98n7ek-provis3ds-projects.vercel.app/api/heartbeat \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### **Неіснуючі endpoints:**
```bash
# 404 тест
curl https://progran3-tracking-server-odv98n7ek-provis3ds-projects.vercel.app/api/nonexistent
```

### **7. Моніторинг та логи**

#### **Vercel Dashboard:**
1. Перейдіть на: `https://vercel.com/provis3ds-projects/progran3-tracking-server`
2. Перевірте **Functions** → **Logs**
3. Моніторьте **Analytics** → **Performance**

#### **Supabase Logs:**
1. Відкрийте Supabase Dashboard
2. Перейдіть в **Logs** → **API Logs**
3. Перевірте запити до API

### **8. Автоматизоване тестування**

#### **Створіть тестовий скрипт:**
```bash
#!/bin/bash
# test-server.sh

SERVER_URL="https://progran3-tracking-server-odv98n7ek-provis3ds-projects.vercel.app"

echo "🧪 Тестування ProGran3 Server"
echo "================================"

# Health check
echo "1. Health Check..."
curl -s "$SERVER_URL/api/init" | grep -q "success" && echo "✅ Health check passed" || echo "❌ Health check failed"

# Heartbeat test
echo "2. Heartbeat Test..."
curl -s -X POST "$SERVER_URL/api/heartbeat" \
  -H "Content-Type: application/json" \
  -d '{"plugin_id":"test","plugin_name":"Test","version":"1.0.0","user_id":"test","computer_name":"test","timestamp":"2024-12-19T10:00:00Z","action":"heartbeat_update","source":"test","update_existing":true,"force_update":false}' \
  | grep -q "success" && echo "✅ Heartbeat test passed" || echo "❌ Heartbeat test failed"

# Dashboard test
echo "3. Dashboard Test..."
curl -s "$SERVER_URL/dashboard" | grep -q "ProGran3 Dashboard" && echo "✅ Dashboard accessible" || echo "❌ Dashboard failed"

echo "================================"
echo "🎉 Тестування завершено!"
```

### **9. Чек-лист тестування**

#### **Перед продакшном:**
- [ ] Сервер відповідає на всі endpoints
- [ ] Dashboard завантажується без помилок
- [ ] API обробляє валідні та невалідні дані
- [ ] Rate limiting працює
- [ ] CORS налаштовано правильно
- [ ] База даних підключена
- [ ] Плагін підключається до сервера
- [ ] Логи записуються правильно
- [ ] Помилки обробляються коректно

#### **Після деплою:**
- [ ] Всі endpoints працюють
- [ ] Dashboard показує дані
- [ ] Плагін відправляє heartbeat
- [ ] Ліцензії реєструються
- [ ] Моніторинг працює

## 🚨 **Troubleshooting**

### **Помилка 500:**
1. Перевірте змінні середовища в Vercel
2. Перевірте Supabase підключення
3. Перегляньте логи в Vercel Dashboard

### **Помилка CORS:**
1. Перевірте `ALLOWED_ORIGINS` в Vercel
2. Переконайтеся що домен додано до списку

### **Dashboard не завантажується:**
1. Перевірте JavaScript консоль в браузері
2. Перевірте чи API повертає дані
3. Перевірте змінні середовища

### **Плагін не підключається:**
1. Перевірте URL в `plugin/proGran3.rb`
2. Перевірте інтернет з'єднання
3. Перевірте логи в Ruby Console

## 📞 **Підтримка**

При проблемах:
1. Перевірте логи в Vercel Dashboard
2. Перевірте логи в Supabase Dashboard
3. Використовуйте цей гід для діагностики
4. Зверніться до `SECURITY.md` для деталей безпеки

**Дата створення**: 2024-12-19  
**Версія**: 1.0.0  
**Статус**: ✅ Готово до використання
