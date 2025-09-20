# 🚀 Налаштування ProGran3 Tracking Server

## Швидкий старт

### 1. Встановлення залежностей

**Windows (PowerShell):**
```powershell
.\install-dependencies.ps1
```

**Linux/macOS:**
```bash
chmod +x install-dependencies.sh
./install-dependencies.sh
```

**Або вручну:**
```bash
npm install
```

### 2. Налаштування змінних середовища

Скопіюйте файл конфігурації:
```bash
cp env.example .env.local
```

Відредагуйте `.env.local` та додайте ваші Supabase налаштування:

```env
STORAGE_SUPABASE_URL=https://your-project.supabase.co
STORAGE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Налаштування Supabase

1. Створіть новий проект в [Supabase](https://supabase.com)
2. Перейдіть до SQL Editor
3. Виконайте наступний SQL запит:

```sql
CREATE TABLE IF NOT EXISTS plugins (
  id SERIAL PRIMARY KEY,
  plugin_id VARCHAR(255) UNIQUE NOT NULL,
  plugin_name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  computer_name VARCHAR(255) NOT NULL,
  system_info JSONB,
  ip_address INET,
  last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plugins_plugin_id ON plugins(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugins_last_heartbeat ON plugins(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_plugins_is_active ON plugins(is_active);
```

### 4. Запуск сервера

**Режим розробки:**
```bash
npm run dev
```

**Продакшн:**
```bash
npm run build
npm start
```

Сервер буде доступний на `http://localhost:3000`

### 5. Тестування

Запустіть тести для перевірки:
```bash
node test-api.js
```

## 📊 Використання

### Головна сторінка
- `http://localhost:3000/` - Статус сервера та швидкі дії

### Dashboard
- `http://localhost:3000/dashboard` - Моніторинг плагінів

### API Endpoints
- `POST /api/heartbeat` - Відстеження активності
- `GET /api/plugins` - Статистика плагінів

## 🔧 Налаштування

### Зміна порту
```bash
PORT=3001 npm run dev
```

### Зміна URL бази даних
Відредагуйте `.env.local`:
```env
STORAGE_SUPABASE_URL=https://your-new-project.supabase.co
```

## 🚀 Деплой

### Vercel (рекомендовано)

1. Підключіть репозиторій до Vercel
2. Налаштуйте змінні середовища в Vercel Dashboard
3. Деплой автоматично

### Інші платформи

```bash
npm run build
npm start
```

## 🐛 Вирішення проблем

### Помилка "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Помилка підключення до Supabase
- Перевірте правильність URL та ключів
- Переконайтеся, що таблиця `plugins` створена

### Помилка Tailwind CSS
```bash
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest
```

## 📈 Моніторинг

Dashboard автоматично оновлюється та показує:
- Кількість активних плагінів
- Статус кожного плагіна
- Час останнього heartbeat
- IP адреси користувачів

## 🔒 Безпека

- Валідація всіх вхідних даних
- Захист від SQL injection (Supabase)
- CORS налаштування
- Рекомендується додати rate limiting
