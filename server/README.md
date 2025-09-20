# ProGran3 Tracking Server

Сервер для відстеження активності плагіна ProGran3 для SketchUp.

## 🚀 Технології

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Vercel Postgres** - Database
- **Vercel** - Deployment platform
- **Tailwind CSS** - Styling

## 📁 Структура проекту

```
server/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── heartbeat/route.ts    # POST /api/heartbeat
│   │   │   ├── plugins/route.ts      # GET /api/plugins
│   │   │   └── init/route.ts         # GET /api/init (DB setup)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── lib/
│       ├── database.ts               # Database functions
│       └── types.ts                  # TypeScript types
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## 🔌 API Endpoints

### POST /api/heartbeat
Відстеження активності плагіна.

**Request Body:**
```json
{
  "plugin_id": "progran3-desktop-60aqeiu-provis3d",
  "plugin_name": "ProGran3",
  "version": "1.0.0",
  "user_id": "ProVis3D@DESKTOP-60AQEIU",
  "computer_name": "DESKTOP-60AQEIU",
  "system_info": {
    "os": "x64-mswin64_140",
    "ruby_version": "3.0.0",
    "sketchup_version": "2024.0.0",
    "architecture": "64-bit"
  },
  "timestamp": "2025-09-20T13:27:09.295+00:00",
  "action": "heartbeat_update",
  "source": "sketchup_plugin",
  "update_existing": true,
  "force_update": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Heartbeat updated successfully",
  "plugin": {
    "id": 14,
    "plugin_id": "progran3-desktop-60aqeiu-provis3d",
    "last_heartbeat": "2025-09-20T13:27:09.295+00:00",
    "is_active": true
  }
}
```

### GET /api/plugins
Отримання статистики плагінів.

**Response:**
```json
{
  "success": true,
  "data": {
    "plugins": [...],
    "stats": {
      "total_plugins": 10,
      "active_plugins": 5,
      "recent_plugins": 3
    },
    "last_updated": "2025-09-20T13:27:55.090Z"
  }
}
```

### GET /api/init
Ініціалізація бази даних (створення таблиць).

## 🗄️ База даних

### Таблиця plugins
```sql
CREATE TABLE plugins (
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
```

## 🛠️ Розробка

### Локальний запуск
```bash
# Встановлення залежностей
npm install

# Запуск в режимі розробки
npm run dev

# Збірка для продакшена
npm run build

# Запуск продакшн версії
npm start
```

### Змінні середовища
Скопіюйте `env.example` в `.env.local` та налаштуйте:

```bash
cp env.example .env.local
```

Додайте змінні Vercel Postgres з вашого Dashboard.

## 🚀 Деплой на Vercel

1. **Підключіть GitHub репозиторій** до Vercel
2. **Додайте змінні середовища** в Vercel Dashboard
3. **Налаштуйте Vercel Postgres** базу даних
4. **Деплой автоматично** через GitHub

### Налаштування Vercel Postgres

1. Перейдіть до Vercel Dashboard
2. Виберіть ваш проект
3. Перейдіть до **Storage** → **Postgres**
4. Створіть нову базу даних
5. Скопіюйте змінні середовища в **Environment Variables**

### Ініціалізація бази даних

Після деплою, відвідайте:
```
https://your-app.vercel.app/api/init
```

Це створить необхідні таблиці та індекси.

## 🧪 Тестування

### Тест heartbeat API
```bash
curl -X POST https://your-app.vercel.app/api/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "plugin_id": "test-plugin",
    "plugin_name": "Test Plugin",
    "version": "1.0.0",
    "user_id": "test@example.com",
    "computer_name": "TEST-PC",
    "system_info": {"os": "test"},
    "timestamp": "2025-01-01T00:00:00Z",
    "action": "test",
    "source": "test",
    "update_existing": true,
    "force_update": false
  }'
```

### Тест plugins API
```bash
curl https://your-app.vercel.app/api/plugins
```

## 📊 Моніторинг

- **Vercel Dashboard** - метрики та логи
- **Vercel Postgres** - статистика бази даних
- **API endpoints** - статус сервера

## 🔧 Налагодження

### Перевірка логів
```bash
# Vercel CLI
vercel logs

# Або через Dashboard
# https://vercel.com/dashboard
```

### Тестування локально
```bash
# Запуск з debug логами
DEBUG=* npm run dev
```

## 📝 Ліцензія

MIT License
