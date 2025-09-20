# ProGran3 Tracking Server

Сервер для відстеження активності плагінів ProGran3 в SketchUp.

## 🚀 Швидкий старт

### Встановлення залежностей

```bash
npm install
```

### Налаштування змінних середовища

Скопіюйте `env.example` в `.env.local` та налаштуйте:

```bash
cp env.example .env.local
```

Заповніть змінні:
- `STORAGE_SUPABASE_URL` - URL вашого Supabase проекту
- `STORAGE_SUPABASE_SERVICE_ROLE_KEY` - Service Role Key з Supabase

### Запуск в режимі розробки

```bash
npm run dev
```

Сервер буде доступний на `http://localhost:3000`

### Збірка для продакшену

```bash
npm run build
npm start
```

## 📊 Функціональність

### API Endpoints

- **POST /api/heartbeat** - Відстеження активності плагіна
- **GET /api/plugins** - Отримання статистики плагінів

### Dashboard

- Моніторинг активних плагінів
- Статистика використання
- Реальний час оновлення

## 🗄️ База даних

Сервер використовує Supabase для зберігання даних. Створіть таблицю `plugins`:

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

## 🛠️ Технології

- **Next.js 14** - React фреймворк
- **TypeScript** - Типізація
- **Tailwind CSS** - Стилізація
- **Supabase** - База даних
- **Vercel** - Хостинг

## 📱 Інтерфейс

- **Головна сторінка** (`/`) - Статус сервера та швидкі дії
- **Dashboard** (`/dashboard`) - Моніторинг плагінів
- **API** (`/api/*`) - REST API endpoints

## 🔧 Розробка

### Структура проекту

```
src/
├── app/
│   ├── api/
│   │   ├── heartbeat/route.ts
│   │   └── plugins/route.ts
│   ├── dashboard/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── database.ts
│   └── types.ts
└── globals.css
```

### Додавання нових endpoints

1. Створіть папку в `src/app/api/`
2. Додайте `route.ts` з функціями HTTP методів
3. Експортуйте функції (GET, POST, PUT, DELETE)

### Стилізація

Використовуйте Tailwind CSS класи для стилізації. Конфігурація в `tailwind.config.js`.

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

## 📈 Моніторинг

Dashboard автоматично оновлюється кожні 30 секунд та показує:
- Кількість активних плагінів
- Статус кожного плагіна
- Час останнього heartbeat
- IP адреси користувачів

## 🔒 Безпека

- Валідація всіх вхідних даних
- Захист від SQL injection (Supabase)
- CORS налаштування
- Rate limiting (рекомендується додати)