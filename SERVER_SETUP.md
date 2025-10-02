# 🚀 PROGRAN3 SERVER SETUP - ДОКУМЕНТАЦІЯ

## 📊 **СТАТУС РОЗРОБКИ**
- **Дата створення:** 2025-01-27
- **Версія:** MVP 1.0
- **Статус:** База даних створена, сервер налаштований

---

## 🗄️ **SUPABASE БАЗА ДАНИХ**

### **Підключення:**
- **URL:** `https://zgkxtdjdaqnktjxunbeu.supabase.co`
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Service Role Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Region:** EU West 2 (London)
- **Database:** PostgreSQL

### **Створені таблиці:**

#### **1. `users` - Користувачі**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **2. `licenses` - Ліцензії**
```sql
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  license_key VARCHAR(255) UNIQUE NOT NULL,
  license_type VARCHAR(50) NOT NULL CHECK (license_type IN ('trial', 'standard', 'professional')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **3. `system_infos` - Інформація про системи**
```sql
CREATE TABLE system_infos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  fingerprint_hash VARCHAR(255) NOT NULL,
  system_data JSONB,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **4. `heartbeats` - Моніторинг активності**
```sql
CREATE TABLE heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  system_info_id UUID REFERENCES system_infos(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **RLS Політики:**
- ✅ Всі таблиці мають Row Level Security
- ✅ Service role має повний доступ
- ✅ Anon role обмежений

### **Тестові дані:**
- **Користувач:** `test@progran3.com`
- **Ліцензія:** `TEST-LICENSE-123` (trial, active)

---

## 🌐 **VERCEL СЕРВЕР**

### **Підключення:**
- **URL:** `https://provis3ds-projects-server.vercel.app`
- **Проект:** `provis3ds-projects/server`
- **Framework:** Next.js 14 + TypeScript
- **Deployment:** Vercel

### **Environment Variables:**
```bash
# Supabase
SUPABASE_URL=https://zgkxtdjdaqnktjxunbeu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database
POSTGRES_URL=postgres://postgres.zgkxtdjdaqnktjxunbeu:...
POSTGRES_USER=postgres
POSTGRES_HOST=db.zgkxtdjdaqnktjxunbeu.supabase.co
POSTGRES_PASSWORD=PjTfYWfK3zOKSjpO
POSTGRES_DATABASE=postgres

# Security
SUPABASE_JWT_SECRET=iEJveKdjmGZKF25lgtnlJI3RPMOghRa3whgIR5pk2UgWsFW5HaLaJMohluvDWuVq9X8HgQgLGvOM6D0blNUSHQ==
```

### **Структура проекту:**
```
server/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🔧 **НАСТУПНІ КРОКИ**

### **Етап 2: Plugin Security Integration**
- [ ] Створити `plugin/proGran3/security/` папку
- [ ] Реалізувати `license_manager.rb`
- [ ] Реалізувати `api_client.rb`
- [ ] Реалізувати `crypto_manager.rb`

### **Етап 3: Server API & Shared Modules**
- [ ] Створити API routes `/api/licenses`
- [ ] Створити API routes `/api/heartbeats`
- [ ] Налаштувати shared модулі
- [ ] Протестувати API

### **Етап 4: Dashboard & Monitoring**
- [ ] Створити Dashboard UI
- [ ] Реалізувати real-time моніторинг
- [ ] Додати управління ліцензіями

---

## 📝 **КОРИСНІ ПОСИЛАННЯ**

### **Supabase:**
- **Dashboard:** https://zgkxtdjdaqnktjxunbeu.supabase.co
- **API Docs:** https://supabase.com/docs
- **SQL Editor:** https://zgkxtdjdaqnktjxunbeu.supabase.co/project/default/sql

### **Vercel:**
- **Dashboard:** https://vercel.com/dashboard
- **Project:** https://vercel.com/provis3ds-projects/server
- **Deployment:** https://provis3ds-projects-server.vercel.app

### **Локальна розробка:**
```bash
# Запуск сервера
cd server
npm run dev

# Запуск всього монорепо
npm run dev
```

---

## 🚨 **ВАЖЛИВІ ПРИМІТКИ**

1. **Безпека:** Всі ключі зберігаються в Vercel Environment Variables
2. **База даних:** PostgreSQL з автоматичними бек-апами
3. **Масштабування:** Vercel автоматично масштабує сервер
4. **Моніторинг:** Supabase надає детальну аналітику
5. **Резервне копіювання:** Автоматичні бек-апи щодня

---

## 📞 **ПІДТРИМКА**

- **Supabase Support:** https://supabase.com/support
- **Vercel Support:** https://vercel.com/support
- **Documentation:** `DEVELOPMENT_PLAN.md`
- **Step-by-step:** `STEP_BY_STEP_PLAN.md`