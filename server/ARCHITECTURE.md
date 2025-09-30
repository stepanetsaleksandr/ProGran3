# 🏗️ АРХІТЕКТУРА PROGRAN3 TRACKING SERVER

## 📖 ОГЛЯД

**ProGran3 Tracking Server** - це Next.js сервер для відстеження активності плагінів SketchUp та управління ліцензіями. Система працює з базою даних Supabase та надає API для плагінів та веб-дашборду.

## 🎯 ОСНОВНІ КОМПОНЕНТИ

### 1. **ПЛАГІН (SketchUp)**
- **Мова:** Ruby
- **Файли:** `plugin/proGran3.rb`, `plugin/proGran3/security/license_manager.rb`
- **Функції:**
  - Відправка heartbeat на сервер
  - Управління ліцензіями
  - Локальне зберігання в Windows Registry

### 2. **СЕРВЕР (Next.js)**
- **Мова:** TypeScript
- **Платформа:** Vercel
- **Функції:**
  - API endpoints для плагінів
  - Управління ліцензіями
  - Веб-дашборд
  - Відстеження активності

### 3. **БАЗА ДАНИХ (Supabase)**
- **Тип:** PostgreSQL
- **Функції:**
  - Зберігання даних плагінів
  - Управління ліцензіями
  - Аудит активності

### 4. **ДАШБОРД (React)**
- **Мова:** TypeScript
- **Функції:**
  - Відображення активності плагінів
  - Управління ліцензіями
  - Моніторинг системи

## 🗄️ СТРУКТУРА БАЗИ ДАНИХ

### Таблиця `plugins`
```sql
CREATE TABLE plugins (
  id SERIAL PRIMARY KEY,
  plugin_id VARCHAR(255) UNIQUE NOT NULL,
  plugin_name VARCHAR(255),
  version VARCHAR(50),
  user_id VARCHAR(255),
  computer_name VARCHAR(255),
  system_info JSONB,
  last_heartbeat TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Таблиця `licenses`
```sql
CREATE TABLE licenses (
  id SERIAL PRIMARY KEY,
  license_key VARCHAR(20) UNIQUE NOT NULL,
  license_type VARCHAR(50) DEFAULT 'standard',
  days_valid INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  activation_count INTEGER DEFAULT 0,
  max_activations INTEGER DEFAULT 1,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Таблиця `user_licenses`
```sql
CREATE TABLE user_licenses (
  id SERIAL PRIMARY KEY,
  license_key VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  hardware_id VARCHAR(255) NOT NULL,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔄 ПОТІК ДАНИХ

### 1. **Heartbeat Flow**
```
Плагін → Сервер → База даних
   ↓
Відповідь ← Сервер ← База даних
```

### 2. **License Activation Flow**
```
Плагін → Сервер → База даних
   ↓
Валідація ← Сервер ← База даних
   ↓
Активація → Сервер → База даних
```

### 3. **Dashboard Data Flow**
```
Дашборд → Сервер → База даних
   ↓
Дані ← Сервер ← База даних
```

## 🛠️ API ENDPOINTS

### **Основні Endpoints**

#### `/api/heartbeat` (POST)
- **Призначення:** Отримання heartbeat від плагінів
- **Дані:** plugin_id, plugin_name, version, system_info, timestamp
- **Відповідь:** Статус плагіна (active/blocked)

#### `/api/license/register-simple` (POST)
- **Призначення:** Активація ліцензії
- **Дані:** email, license_key, hardware_id
- **Відповідь:** Статус активації

#### `/api/debug/all-info` (GET)
- **Призначення:** Отримання всіх даних для дашборду
- **Відповідь:** plugins, licenses, user_licenses, summary

### **Debug Endpoints**

#### `/api/debug/create-license` (POST)
- **Призначення:** Створення тестової ліцензії
- **Дані:** license_key, max_activations, days_valid

#### `/api/debug/clear-all` (POST)
- **Призначення:** Очищення всіх таблиць
- **Відповідь:** Результати очищення

#### `/api/debug/test-licenses` (GET)
- **Призначення:** Отримання всіх ліцензій
- **Відповідь:** Список ліцензій

## 🏛️ АРХІТЕКТУРНІ ПАТЕРНИ

### 1. **Repository Pattern**
```typescript
// Базовий репозиторій
abstract class BaseRepository<T> {
  protected supabase: SupabaseClient;
  protected tableName: string;
  
  abstract create(data: Partial<T>): Promise<T>;
  abstract findById(id: number): Promise<T | null>;
  abstract update(id: number, data: Partial<T>): Promise<T>;
  abstract delete(id: number): Promise<boolean>;
  abstract findAll(): Promise<T[]>;
}
```

### 2. **Service Layer**
```typescript
// Сервіс для бізнес-логіки
class LicenseService {
  private licenseRepo: LicenseRepository;
  private userLicenseRepo: UserLicenseRepository;
  
  async createLicense(data: CreateLicenseRequest): Promise<License>;
  async activateLicense(data: ActivateLicenseRequest): Promise<UserLicense>;
  async validateLicense(data: ValidateLicenseRequest): Promise<LicenseValidation>;
}
```

### 3. **Error Handling**
```typescript
// Стандартизована обробка помилок
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  );
}
```

## 🔧 КОНФІГУРАЦІЯ

### **Environment Variables**
```bash
# Supabase
SB_SUPABASE_URL=https://your-project.supabase.co
SB_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Vercel
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **Deployment**
```bash
# Деплой на Vercel
vercel --prod --force

# Оновлення плагіна
cd plugin
deploy_simple.bat
```

## 📊 МОНІТОРИНГ

### **Логування**
- Структуроване логування в JSON форматі
- Рівні: info, warn, error
- Контекст: plugin_id, user_id, action

### **Метрики**
- Кількість активних плагінів
- Кількість ліцензій
- Кількість активацій
- Статус плагінів (active/blocked)

## 🔒 БЕЗПЕКА

### **Валідація**
- Валідація всіх вхідних даних
- Перевірка форматів email, license_key, hardware_id
- Обмеження на кількість активацій

### **Авторизація**
- Service Role Key для Supabase
- Перевірка дозволів на рівні бази даних

## 🚀 РОЗГОРТАННЯ

### **Сервер**
1. Налаштування змінних середовища в Vercel
2. Деплой через `vercel --prod --force`
3. Перевірка роботи endpoints

### **Плагін**
1. Оновлення URL сервера в `proGran3.rb`
2. Деплой через `deploy_simple.bat`
3. Тестування в SketchUp

## 📈 МАСШТАБУВАННЯ

### **Поточні обмеження**
- Supabase: 500MB база даних
- Vercel: 100GB bandwidth
- API: 1000 requests/day

### **Рекомендації для зростання**
- Кешування даних
- Оптимізація запитів
- Моніторинг продуктивності

## 🔄 ОНОВЛЕННЯ

### **Версіонування**
- Семантичне версіонування (SemVer)
- Міграції бази даних
- Backward compatibility

### **Міграції**
- SQL скрипти в `database-migration.sql`
- Автоматичне застосування через API
- Валідація структури

## 📚 ДОКУМЕНТАЦІЯ

### **Файли документації**
- `README.md` - Основна документація
- `SECURITY.md` - Безпека
- `SETUP.md` - Налаштування
- `TESTING_GUIDE.md` - Тестування
- `DEPLOY_SERVER.md` - Деплой сервера

### **API Documentation**
- Swagger/OpenAPI (планується)
- Postman collection (планується)
- Приклади використання

## 🎯 МАЙБУТНІ ПОКРАЩЕННЯ

### **Короткострокові**
- Покращення UI дашборду
- Додавання метрик
- Оптимізація запитів

### **Довгострокові**
- Мікросервісна архітектура
- Кешування Redis
- Моніторинг Prometheus
- CI/CD pipeline

---

**Останнє оновлення:** 30 вересня 2025  
**Версія:** 1.0.0  
**Автор:** ProVis3D
