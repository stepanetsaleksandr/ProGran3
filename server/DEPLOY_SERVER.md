# 🚀 Деплой сервера ProGran3

## Перед деплоєм

### 1. Перевірка залежностей
```bash
cd server
npm install
```

### 2. Налаштування змінних середовища
Створіть файл `.env.local` в папці `server/`:
```bash
# Supabase Configuration
STORAGE_SUPABASE_URL="https://your-project.supabase.co"
STORAGE_SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Security Configuration
ALLOWED_ORIGINS="https://progran3.com,https://www.progran3.com,http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_HEARTBEAT_MAX=20
RATE_LIMIT_LICENSE_MAX=5

# Monitoring
MONITORING_ENABLED=true
ALERT_EMAIL="admin@progran3.com"
HEALTH_CHECK_INTERVAL=300000

# Logging
LOG_LEVEL="info"
LOG_SENSITIVE_DATA=false
```

### 3. Налаштування бази даних
Виконайте SQL скрипт в Supabase Dashboard:
```sql
-- Виконайте create_tables.sql в Supabase SQL Editor
```

## Деплой на Vercel

### Варіант 1: Через Vercel CLI
```bash
# Встановлення Vercel CLI
npm i -g vercel

# Логін в Vercel
vercel login

# Деплой
cd server
vercel --prod
```

### Варіант 2: Через GitHub
1. Запуште код в GitHub репозиторій
2. Підключіть репозиторій до Vercel
3. Налаштуйте змінні середовища в Vercel Dashboard

### Варіант 3: Через Vercel Dashboard
1. Перейдіть на [vercel.com](https://vercel.com)
2. Натисніть "New Project"
3. Імпортуйте GitHub репозиторій
4. Налаштуйте:
   - **Framework Preset**: Next.js
   - **Root Directory**: `server`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

## Налаштування змінних середовища в Vercel

В Vercel Dashboard → Project Settings → Environment Variables:

```
STORAGE_SUPABASE_URL=https://your-project.supabase.co
STORAGE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALLOWED_ORIGINS=https://progran3.com,https://www.progran3.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_HEARTBEAT_MAX=20
RATE_LIMIT_LICENSE_MAX=5
MONITORING_ENABLED=true
ALERT_EMAIL=admin@progran3.com
HEALTH_CHECK_INTERVAL=300000
LOG_LEVEL=info
LOG_SENSITIVE_DATA=false
```

## Тестування після деплою

### 1. Перевірка health check
```bash
curl https://your-app.vercel.app/api/init
```

### 2. Тестування heartbeat
```bash
curl -X POST https://your-app.vercel.app/api/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "plugin_id": "progran3-test-plugin",
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

### 3. Тестування реєстрації ліцензії
```bash
curl -X POST https://your-app.vercel.app/api/license/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "license_key": "TQ58-IKVR-9X2M-7N4P",
    "hardware_id": "test-hardware-id"
  }'
```

## Моніторинг

### 1. Vercel Analytics
- Переглядайте метрики в Vercel Dashboard
- Моніторьте помилки та performance

### 2. Supabase Monitoring
- Перевіряйте логи в Supabase Dashboard
- Моніторьте використання бази даних

### 3. Custom Monitoring
```bash
# Health check
curl https://your-app.vercel.app/api/admin/monitoring

# Статистика
curl https://your-app.vercel.app/api/admin/monitoring?report=true
```

## Troubleshooting

### Помилки деплою
1. **Build errors**: Перевірте `npm run build` локально
2. **Environment variables**: Переконайтеся що всі змінні налаштовані
3. **Database connection**: Перевірте Supabase credentials

### Помилки runtime
1. **Rate limiting**: Перевірте налаштування в middleware
2. **CORS errors**: Перевірте ALLOWED_ORIGINS
3. **Database errors**: Перевірте Supabase connection

## Оновлення сервера

### 1. Локальні зміни
```bash
cd server
npm run build
npm run test
```

### 2. Деплой оновлень
```bash
# Через Vercel CLI
vercel --prod

# Або через Git push (якщо налаштовано auto-deploy)
git add .
git commit -m "Update server"
git push origin main
```

## Безпека

### 1. Перевірка безпеки
```bash
npm run security:audit
npm run security:fix
```

### 2. Тестування безпеки
```bash
# Rate limiting test
for i in {1..150}; do curl https://your-app.vercel.app/api/heartbeat; done

# CORS test
curl -H "Origin: https://malicious.com" https://your-app.vercel.app/api/heartbeat
```

## Підтримка

При проблемах:
1. Перевірте логи в Vercel Dashboard
2. Перевірте Supabase logs
3. Використовуйте monitoring endpoints
4. Зверніться до документації SECURITY.md
