# 🏗️ **КОМПЛЕКСНИЙ ГІД ПО АРХІТЕКТУРІ PROGRAN3**

## 📋 **ОГЛЯД ПРОЕКТУ**

**ProGran3** - це комплексна система для створення 3D моделей надгробних споруд у SketchUp з інтегрованою системою ліцензування та відстеження активності.

### **Основні компоненти:**
1. **SketchUp Plugin** (Ruby) - основний функціонал
2. **Tracking Server** (Next.js/TypeScript) - система ліцензування
3. **Web Dashboard** (React) - управління та моніторинг
4. **Database** (Supabase/PostgreSQL) - зберігання даних

---

## 🎯 **АРХІТЕКТУРНІ ПРИНЦИПИ**

### **1. Clean Architecture (Чиста архітектура)**
```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                   │
│  ┌─────────────────┐  ┌─────────────────┐             │
│  │   SketchUp UI   │  │   Web Dashboard  │             │
│  │   (HTML/JS)     │  │   (React)        │             │
│  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                     │
│  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Use Cases     │  │   DTOs          │             │
│  │   (Business)    │  │   (Data)        │             │
│  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                        │
│  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Entities      │  │   Services      │             │
│  │   (Core)        │  │   (Business)    │             │
│  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                    │
│  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Database     │  │   External APIs   │             │
│  │   (Supabase)    │  │   (Services)   │             │
│  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

### **2. SOLID Principles**
- **S** - Single Responsibility: Кожен клас має одну відповідальність
- **O** - Open/Closed: Відкритий для розширення, закритий для модифікації
- **L** - Liskov Substitution: Підкласи повинні замінювати базові класи
- **I** - Interface Segregation: Клієнти не повинні залежати від невикористовуваних інтерфейсів
- **D** - Dependency Inversion: Залежність від абстракцій, не від конкретних класів

---

## 🏛️ **СТРУКТУРА ПРОЕКТУ**

### **Plugin (SketchUp) - Ruby**
```
plugin/
├── proGran3.rb                    # Головний модуль
├── ui.rb                          # UI менеджер
├── loader.rb                      # Завантажувач компонентів
├── callback_manager.rb            # Менеджер callback'ів
├── coordination_manager.rb        # Координаційний менеджер
├── model_state_manager.rb         # Менеджер стану моделі
├── skp_preview_extractor.rb       # Генератор превью
├── validation.rb                  # Валідація
├── error_handler.rb               # Обробка помилок
├── logger.rb                      # Логування
├── security/
│   └── license_manager.rb         # Управління ліцензіями
├── builders/                      # Будівельники компонентів
│   ├── foundation_builder.rb
│   ├── blind_area_builder.rb
│   ├── tiling_builder.rb
│   ├── cladding_builder.rb
│   └── fence_builder.rb
├── assets/                        # 3D компоненти
│   ├── stands/                    # Підставки
│   ├── steles/                    # Стели
│   ├── flowerbeds/                # Квітники
│   ├── gravestones/               # Надгробні плити
│   ├── lamps/                     # Лампадки
│   └── fence/                     # Огорожа
└── web/                           # Frontend (JavaScript)
    ├── index.html                 # Головна сторінка
    ├── script.js                  # Основний скрипт
    ├── style.css                  # Стилі
    ├── modules/                   # Модульна структура
    │   ├── core/                  # ProGran3.Core.*
    │   ├── ui/                    # ProGran3.UI.*
    │   ├── builders/              # ProGran3.Builders.*
    │   └── utils/                 # ProGran3.Utils.*
    └── components/                # UI компоненти
```

### **Server (Next.js) - TypeScript**
```
server/
├── src/
│   ├── app/
│   │   ├── api/                   # API endpoints
│   │   │   ├── heartbeat/         # Heartbeat API
│   │   │   ├── license/           # License API
│   │   │   └── plugins/          # Plugin API
│   │   ├── admin/                 # Admin dashboard
│   │   └── dashboard/             # User dashboard
│   ├── lib/
│   │   ├── database/              # Database layer
│   │   ├── services/              # Business services
│   │   ├── utils/                 # Utilities
│   │   └── types.ts               # TypeScript types
│   └── middleware.ts               # Next.js middleware
├── migrations/                    # Database migrations
└── tests/                         # Test files
```

---

## ⚠️ **КРИТИЧНІ ОБМЕЖЕННЯ ТА ПРОБЛЕМИ**

### **1. ОБМЕЖЕННЯ SKETCHUP CEF**

#### **Проблема: ES6 модулі не працюють**
```javascript
// ❌ НЕ ПРАЦЮЄ в SketchUp:
import { functionName } from './module.js';

// ✅ ПРАЦЮЄ в SketchUp:
(function(global) {
  'use strict';
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.Core = global.ProGran3.Core || {};
  
  function myFunction() { /* ... */ }
  
  global.ProGran3.Core.MyModule = { myFunction };
  global.myFunction = myFunction; // Зворотна сумісність
})(window);
```

#### **Рішення: Namespace Pattern**
```javascript
// Правильна структура модулів
ProGran3.Core.StateManager
ProGran3.Core.Logger
ProGran3.UI.Tabs
ProGran3.UI.Panels
ProGran3.Builders.Foundation
ProGran3.Utils.Units
```

### **2. ПРОБЛЕМИ СИСТЕМИ ЛІЦЕНЗУВАННЯ**

#### **Критичні помилки архітектури:**
1. **Порушення SOLID принципів**
   - `LicenseValidator` виконує валідацію, оновлення heartbeat, управління статистикою
   - Прямі залежності від Supabase замість абстракцій

2. **Неузгодженість в обробці часу**
   ```typescript
   // Проблема: days_valid використовується як дні і як хвилини
   const expirationDate = new Date(activatedAt.getTime() + (license.days_valid * 60 * 1000)); // хвилини
   // Але в інших місцях як дні
   const hoursSinceLastHeartbeat = (Date.now() - lastHeartbeat.getTime()) / (1000 * 60 * 60);
   ```

3. **Небезпечне управління станом**
   ```typescript
   // Проблема: undefined для збереження стану
   let isBlocked: boolean | undefined = false;
   isBlocked = undefined; // Непередбачувана поведінка
   ```

4. **Агресивна логіка блокування**
   - Майстер-ліцензія деактивується при будь-якій помилці
   - Блокує всіх користувачів цієї ліцензії
   - Відсутність транзакційності операцій

5. **Проблеми з Hardware ID**
   - Залежність від змінних середовища
   - Можливість різних ID на тому ж комп'ютері
   - Відсутність fallback механізмів

### **3. ПРОБЛЕМИ З API ENDPOINTS**

#### **Видалені endpoints через @/ imports**
```typescript
// ❌ ПРОБЛЕМА: Використання @/ imports
import { createClient } from '@/lib/supabase';

// ✅ РІШЕННЯ: Прямі imports
import { createClient } from '@supabase/supabase-js';
```

#### **Відсутні критичні endpoints:**
- `/api/license/register` - створення ліцензій
- `/api/license/validate` - валідація ліцензій
- `/api/license/activate` - активація ліцензій

---

## 🔧 **ПРАВИЛЬНА АРХІТЕКТУРА**

### **Domain Layer (Доменний шар)**
```typescript
// Entities
export class License {
  constructor(
    private readonly id: LicenseId,
    private readonly key: LicenseKey,
    private readonly type: LicenseType,
    private readonly timeValue: number,
    private readonly timeUnit: TimeUnit,
    private readonly maxActivations: number,
    private readonly features: LicenseFeatures,
    private readonly isActive: boolean,
    private readonly activationCount: number,
    private readonly createdAt: Date,
    private readonly updatedAt: Date
  ) {}

  public isExpired(activatedAt: Date): boolean {
    const expirationDate = TimeCalculationService.calculateExpirationDate(
      activatedAt, 
      this.timeValue, 
      this.timeUnit
    );
    return new Date() > expirationDate;
  }

  public canActivate(): boolean {
    return this.isActive && this.activationCount < this.maxActivations;
  }
}
```

### **Application Layer (Шар застосування)**
```typescript
// Use Cases
export class ActivateLicenseUseCase {
  constructor(
    private readonly licenseRepository: ILicenseRepository,
    private readonly userLicenseRepository: IUserLicenseRepository,
    private readonly timeService: ITimeService,
    private readonly logger: ILogger
  ) {}

  async execute(request: ActivateLicenseRequest): Promise<ActivateLicenseResponse> {
    // 1. Валідація вхідних даних
    // 2. Перевірка існування ліцензії
    // 3. Перевірка можливості активації
    // 4. Перевірка на дублікат активації
    // 5. Створення користувацької ліцензії
    // 6. Транзакційне збереження
  }
}
```

### **Infrastructure Layer (Шар інфраструктури)**
```typescript
// Repository Implementation
export class SupabaseLicenseRepository implements ILicenseRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findByKey(key: string): Promise<License | null> {
    const { data, error } = await this.supabase
      .from('licenses')
      .select('*')
      .eq('license_key', key)
      .single();

    if (error) return null;
    return this.mapToEntity(data);
  }
}
```

---

## 🗄️ **СХЕМА БАЗИ ДАНИХ**

### **Таблиця licenses (Майстер-ліцензії)**
```sql
CREATE TABLE licenses (
  id SERIAL PRIMARY KEY,
  license_key VARCHAR(255) UNIQUE NOT NULL,
  license_type VARCHAR(50) DEFAULT 'standard',
  time_value INTEGER DEFAULT 365,
  time_unit VARCHAR(10) DEFAULT 'days',
  is_active BOOLEAN DEFAULT true,
  activation_count INTEGER DEFAULT 0,
  max_activations INTEGER DEFAULT 1,
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT chk_time_unit CHECK (time_unit IN ('minutes', 'hours', 'days')),
  CONSTRAINT chk_time_value CHECK (time_value > 0),
  CONSTRAINT chk_max_activations CHECK (max_activations > 0),
  CONSTRAINT chk_activation_count CHECK (activation_count >= 0)
);
```

### **Таблиця user_licenses (Користувацькі ліцензії)**
```sql
CREATE TABLE user_licenses (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  license_key VARCHAR(255) NOT NULL,
  hardware_id VARCHAR(255) NOT NULL,
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  offline_count INTEGER DEFAULT 0,
  max_offline_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(email, license_key, hardware_id),
  CONSTRAINT chk_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT chk_offline_count CHECK (offline_count >= 0),
  CONSTRAINT chk_max_offline_hours CHECK (max_offline_hours > 0)
);
```

### **Таблиця plugins (Плагіни)**
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
  state VARCHAR(20) DEFAULT 'inactive',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT chk_state CHECK (state IN ('active', 'blocked', 'inactive', 'pending'))
);
```

---

## 🔄 **ПОТОКИ ДАНИХ**

### **1. Heartbeat Flow**
```
SketchUp Plugin → Server API → Database
       ↓
Response ← Server ← Database
       ↓
Plugin State Update
```

### **2. License Activation Flow**
```
Plugin → Server API → License Validation
       ↓
License Check ← Database
       ↓
User License Creation → Database
       ↓
Activation Response → Plugin
```

### **3. Dashboard Data Flow**
```
Web Dashboard → Server API → Database
       ↓
Data Processing ← Database
       ↓
UI Update ← Server
```

---

## 🚨 **КРИТИЧНІ ПОМИЛКИ ТА ЇХ ВИПРАВЛЕННЯ**

### **1. Помилка: Failed to execute 'json' on 'Response'**

#### **Причина:**
- API endpoint `/api/license/register` не існує
- Видалені всі API файли з `@/` imports

#### **Виправлення:**
```typescript
// Створення endpoint для створення ліцензій
// server/src/app/api/license/register/route.ts
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: license, error } = await supabase
      .from('licenses')
      .insert({
        license_key: data.license_key,
        license_type: data.license_type || 'standard',
        days_valid: data.days_valid || 30,
        is_active: true,
        max_activations: data.max_activations || 1,
        features: data.features || {}
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { license } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

### **2. Помилка: Environment Variables**

#### **Причина:**
- Відсутні змінні середовища в Vercel
- Неправильні назви змінних

#### **Виправлення:**
```bash
# Vercel Environment Variables
SB_SUPABASE_URL=https://your-project.supabase.co
SB_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **3. Помилка: Hardware ID Generation**

#### **Причина:**
- Залежність від змінних середовища
- Нестабільна генерація ID

#### **Виправлення:**
```ruby
def get_stable_hardware_id
  begin
    # Використовуємо стабільні системні параметри
    hostname = Socket.gethostname.downcase.gsub(/[^a-z0-9]/, '-')
    username = get_stable_username
    
    # Додаємо MAC адресу для унікальності
    mac_address = get_primary_mac_address
    
    # Створюємо хеш для стабільності
    combined = "#{hostname}-#{username}-#{mac_address}"
    Digest::SHA256.hexdigest(combined)[0..15] # Перші 16 символів
  rescue => e
    puts "⚠️ [LicenseManager] Помилка генерації hardware_id: #{e.message}"
    "fallback-#{Time.now.to_i}"
  end
end
```

---

## 🧪 **ТЕСТУВАННЯ**

### **Unit Tests**
```typescript
describe('License Entity', () => {
  it('should calculate expiration correctly', () => {
    const license = new License(/* ... */);
    const activatedAt = new Date('2025-01-01');
    const isExpired = license.isExpired(activatedAt);
    expect(isExpired).toBe(false);
  });
});
```

### **Integration Tests**
```typescript
describe('ActivateLicenseUseCase', () => {
  it('should activate license successfully', async () => {
    const useCase = new ActivateLicenseUseCase(/* ... */);
    const result = await useCase.execute(validRequest);
    expect(result.isSuccess).toBe(true);
  });
});
```

---

## 📊 **МОНІТОРИНГ ТА МЕТРИКИ**

### **Ключові метрики:**
- **Ліцензії**: Загальна кількість, активні, прострочені, заблоковані
- **Плагіни**: Активні, заблоковані, offline
- **Продуктивність**: Час відгуку API, кількість помилок
- **Безпека**: Спроби неавторизованого доступу, rate limiting

### **Health Check:**
```typescript
export class HealthChecker {
  static async checkSystemHealth(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkDatabaseConnection(),
      this.checkLicenseValidation(),
      this.checkHeartbeatProcessing(),
      this.checkCacheStatus()
    ]);
    
    return {
      status: checks.every(check => check.healthy) ? 'healthy' : 'unhealthy',
      checks: checks,
      timestamp: new Date().toISOString()
    };
  }
}
```

---

## 🚀 **ПЛАН ВПРОВАДЖЕННЯ**

### **Фаза 1: Критичні виправлення (Тижні 1-2)**
- [ ] Створення відсутніх API endpoints
- [ ] Виправлення проблем з змінними середовища
- [ ] Стабілізація Hardware ID генерації
- [ ] Додавання транзакційності до операцій

### **Фаза 2: Рефакторинг архітектури (Тижні 3-4)**
- [ ] Створення Domain Services
- [ ] Розділення LicenseValidator на окремі сервіси
- [ ] Створення Infrastructure Layer
- [ ] Реалізація Repository Pattern

### **Фаза 3: Безпека та стабілізація (Тижні 5-6)**
- [ ] Додавання Rate Limiting
- [ ] Покращення безпечного логування
- [ ] Додавання fallback механізмів
- [ ] Створення системи метрик

### **Фаза 4: Тестування та оптимізація (Тижні 7-8)**
- [ ] Написання автоматичних тестів
- [ ] Навантажувальне тестування
- [ ] Оптимізація продуктивності
- [ ] Документація

---

## 📈 **ОЧІКУВАНІ РЕЗУЛЬТАТИ**

### **Технічні покращення:**
- ✅ Зменшення кількості помилок блокування на 90%
- ✅ Покращення часу відгуку API на 50%
- ✅ Зменшення false positive блокувань на 95%
- ✅ Підвищення стабільності Hardware ID на 100%

### **Бізнес покращення:**
- ✅ Зменшення скарг користувачів на 80%
- ✅ Підвищення задоволеності на 70%
- ✅ Зменшення часу підтримки на 60%
- ✅ Підвищення надійності системи на 90%

---

## ⚠️ **РИЗИКИ ТА МІТИГАЦІЯ**

### **Високі ризики:**
1. **Втрата даних при міграції**
   - *Мітигація*: Повне резервне копіювання перед міграцією
   - *План відновлення*: Rollback до попередньої версії

2. **Порушення роботи існуючих користувачів**
   - *Мітигація*: Поетапне впровадження з можливістю rollback
   - *Моніторинг*: Реальний час відстеження помилок

### **Середні ризики:**
1. **Збільшення складності коду**
   - *Мітигація*: Детальна документація та навчання команди
   - *Підтримка*: Code review та pair programming

2. **Продуктивність після рефакторингу**
   - *Мітигація*: Профілювання та оптимізація
   - *Моніторинг*: Метрики продуктивності

---

## 📚 **ДОКУМЕНТАЦІЯ ДЛЯ РОЗРОБНИКІВ**

### **Обов'язкова документація:**
- [ ] API документація
- [ ] Приклади використання
- [ ] Діаграми архітектури
- [ ] Інструкції з розгортання
- [ ] Читання коду (code comments)

### **Оновлення документації:**
- Документація оновлюється разом з кодом
- Кожна зміна API потребує оновлення документації
- Приклади коду повинні бути актуальними

---

## 🎯 **КОНТРОЛЬНИЙ СПИСОК ДЛЯ НОВИХ РОЗРОБНИКІВ**

### **Перед початком роботи:**
- [ ] Прочитати цей документ повністю
- [ ] Зрозуміти архітектурні принципи
- [ ] Ознайомитися з критичними обмеженнями
- [ ] Налаштувати середовище розробки
- [ ] Запустити тести

### **Перед додаванням нового функціоналу:**
- [ ] Перевірити відповідність SOLID принципам
- [ ] Створити unit тести
- [ ] Оновити документацію
- [ ] Перевірити зворотну сумісність
- [ ] Запустити integration тести

### **Перед рефакторингом:**
- [ ] Створити резервну копію
- [ ] Написати тести для існуючого функціоналу
- [ ] Планувати поетапне впровадження
- [ ] Підготувати план rollback
- [ ] Інформувати команду про зміни

---

## 🔧 **ІНСТРУМЕНТИ РОЗРОБКИ**

### **Обов'язкові інструменти:**
- **IDE**: VS Code з розширеннями для TypeScript, Ruby
- **Version Control**: Git з GitHub
- **Testing**: Jest для TypeScript, RSpec для Ruby
- **Database**: Supabase CLI
- **Deployment**: Vercel CLI

### **Рекомендовані розширення:**
- TypeScript Importer
- Ruby Solargraph
- GitLens
- Prettier
- ESLint

---

## 📞 **ПІДТРИМКА ТА КОНТАКТИ**

### **Технічна підтримка:**
- **Документація**: `/docs/` директорія
- **Issues**: GitHub Issues
- **Code Review**: Pull Request reviews
- **Моніторинг**: Vercel Dashboard

### **Контакти:**
- **Lead Developer**: ProVis3D
- **Project Repository**: GitHub
- **Deployment**: Vercel
- **Database**: Supabase

---

**Останнє оновлення:** 30 вересня 2025 року  
**Версія документації:** 1.0  
**Автор:** ProGran3 Development Team  
**Статус:** Активна розробка

---

*Цей документ є живим документом і повинен оновлюватися разом з проектом. Всі зміни в архітектурі повинні відображатися в цьому документі.*
