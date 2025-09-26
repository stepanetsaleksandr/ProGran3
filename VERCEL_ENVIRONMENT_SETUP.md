# 🔧 Налаштування змінних середовища в Vercel

## ❌ **Проблема:**
При створенні ліцензії виникає помилка **HTTP 500** через відсутність змінних середовища Supabase.

## ✅ **Рішення:**

### **1. Перейти в Vercel Dashboard**

1. Відкрийте: https://vercel.com/provis3ds-projects/progran3-tracking-server
2. Перейдіть в **Settings** → **Environment Variables**

### **2. Додати змінні середовища Supabase**

#### **Обов'язкові змінні:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### **Додаткові змінні (якщо потрібно):**
```
STORAGE_SUPABASE_URL=https://your-project.supabase.co
STORAGE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### **3. Як отримати змінні з Supabase**

#### **Крок 1: Відкрити Supabase Dashboard**
1. Перейдіть на: https://supabase.com/dashboard
2. Виберіть ваш проект (або створіть новий)

#### **Крок 2: Отримати URL та ключі**
1. Перейдіть в **Settings** → **API**
2. Скопіюйте:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### **4. Створити базу даних**

#### **Виконати SQL скрипт:**
1. Відкрийте Supabase Dashboard
2. Перейдіть в **SQL Editor**
3. Виконайте скрипт з файлу `server/create_tables.sql`:

```sql
-- Створення таблиць для нової системи ліцензування ProGran3

-- 1. Таблиця licenses (майстер-дані про ліцензійні ключі)
CREATE TABLE IF NOT EXISTS licenses (
  id SERIAL PRIMARY KEY,
  license_key VARCHAR(255) UNIQUE NOT NULL,
  license_type VARCHAR(50) DEFAULT 'standard',
  days_valid INTEGER DEFAULT 365, -- Днів дії з моменту активації
  is_active BOOLEAN DEFAULT true,
  activation_count INTEGER DEFAULT 0,
  max_activations INTEGER DEFAULT 1,
  features JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Таблиця user_licenses (реєстрації користувачів)
CREATE TABLE IF NOT EXISTS user_licenses (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  license_key VARCHAR(255) NOT NULL,
  hardware_id VARCHAR(255),
  activated_at TIMESTAMP DEFAULT NOW(),
  last_heartbeat TIMESTAMP,
  offline_count INTEGER DEFAULT 0,
  max_offline_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(email, license_key, hardware_id)
);

-- 3. Таблиця plugins (відстеження активності плагінів)
CREATE TABLE IF NOT EXISTS plugins (
  id SERIAL PRIMARY KEY,
  plugin_id VARCHAR(255) UNIQUE NOT NULL,
  plugin_name VARCHAR(255) NOT NULL,
  version VARCHAR(50),
  user_id VARCHAR(255),
  computer_name VARCHAR(255),
  system_info JSONB,
  last_heartbeat TIMESTAMP,
  ip_address INET,
  is_active BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Індекси для оптимізації
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_active ON licenses(is_active);
CREATE INDEX IF NOT EXISTS idx_user_licenses_email ON user_licenses(email);
CREATE INDEX IF NOT EXISTS idx_user_licenses_license_key ON user_licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_user_licenses_active ON user_licenses(is_active);
CREATE INDEX IF NOT EXISTS idx_plugins_plugin_id ON plugins(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugins_user_id ON plugins(user_id);
CREATE INDEX IF NOT EXISTS idx_plugins_active ON plugins(is_active);
CREATE INDEX IF NOT EXISTS idx_plugins_blocked ON plugins(is_blocked);

-- Композитні індекси для часто використовуваних запитів
CREATE INDEX IF NOT EXISTS idx_licenses_key_active ON licenses(license_key, is_active);
CREATE INDEX IF NOT EXISTS idx_user_licenses_license_active ON user_licenses(license_key, is_active);
CREATE INDEX IF NOT EXISTS idx_plugins_user_active ON plugins(user_id, is_active);
```

### **5. Перевірити налаштування**

#### **Тест змінних середовища:**
```
GET https://progran3-tracking-server-1ci6whn7c-provis3ds-projects.vercel.app/api/debug/env
```

**Очікуваний результат:**
```json
{
  "success": true,
  "env": {
    "SUPABASE_URL": true,
    "SUPABASE_ANON_KEY": true,
    "SUPABASE_SERVICE_ROLE_KEY": true
  },
  "hasAnySupabase": true
}
```

#### **Тест створення ліцензії:**
```
POST https://progran3-tracking-server-1ci6whn7c-provis3ds-projects.vercel.app/api/debug/test-license
```

### **6. Після налаштування**

#### **Повернути оригінальний endpoint:**
В файлі `server/src/app/dashboard/page.tsx` змінити:
```javascript
// З тестового endpoint
const response = await fetch('/api/debug/test-license', {

// На оригінальний endpoint
const response = await fetch('/api/admin/licenses', {
```

#### **Задеплоїти зміни:**
```bash
vercel --prod
```

## 🚨 **Важливо:**

### **Безпека:**
- ✅ **НЕ діліться** service_role ключами
- ✅ **Використовуйте** тільки anon ключі в клієнтському коді
- ✅ **Обмежте доступ** до бази даних

### **Порядок налаштування:**
1. ✅ Створити проект в Supabase
2. ✅ Отримати змінні середовища
3. ✅ Додати змінні в Vercel Dashboard
4. ✅ Виконати SQL скрипт створення таблиць
5. ✅ Протестувати створення ліцензій
6. ✅ Повернути оригінальний endpoint

## 📞 **Підтримка:**

Якщо виникли проблеми:
1. Перевірте логи в Vercel Dashboard
2. Перевірте змінні середовища
3. Перевірте підключення до Supabase
4. Перевірте створені таблиці в Supabase

**Статус**: ⚠️ **ПОТРІБНО НАЛАШТУВАТИ ЗМІННІ СЕРЕДОВИЩА** 🔧
