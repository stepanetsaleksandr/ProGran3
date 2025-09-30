# 🏗️ Правильна архітектура системи ліцензування ProGran3

## 📐 **АРХІТЕКТУРНІ ПРИНЦИПИ**

### **1. Clean Architecture (Чиста архітектура)**
```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                   │
│  ┌─────────────────┐  ┌─────────────────┐             │
│  │   API Routes    │  │   Dashboard     │             │
│  │   (Next.js)     │  │   (React)       │             │
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

```
src/
├── domain/                          # Доменний шар (бізнес-логіка)
│   ├── entities/                    # Сущності
│   │   ├── License.ts              # Ліцензія
│   │   ├── UserLicense.ts          # Користувацька ліцензія
│   │   ├── Plugin.ts               # Плагін
│   │   └── HardwareId.ts           # Hardware ID
│   ├── value-objects/              # Об'єкти-значення
│   │   ├── Email.ts                # Email
│   │   ├── LicenseKey.ts           # Ліцензійний ключ
│   │   └── TimeRange.ts            # Часовий діапазон
│   ├── services/                   # Доменні сервіси
│   │   ├── LicenseValidationService.ts
│   │   ├── TimeCalculationService.ts
│   │   └── HardwareIdService.ts
│   └── repositories/                # Інтерфейси репозиторіїв
│       ├── ILicenseRepository.ts
│       ├── IUserLicenseRepository.ts
│       └── IPluginRepository.ts
├── application/                     # Шар застосування
│   ├── use-cases/                  # Use Cases
│   │   ├── ActivateLicenseUseCase.ts
│   │   ├── ValidateLicenseUseCase.ts
│   │   ├── ProcessHeartbeatUseCase.ts
│   │   ├── BlockPluginUseCase.ts
│   │   └── GetLicenseStatsUseCase.ts
│   ├── dto/                        # Data Transfer Objects
│   │   ├── LicenseDto.ts
│   │   ├── HeartbeatDto.ts
│   │   └── PluginDto.ts
│   └── interfaces/                 # Інтерфейси застосування
│       ├── ITimeService.ts
│       ├── ILogger.ts
│       └── IMetricsCollector.ts
├── infrastructure/                 # Шар інфраструктури
│   ├── database/                   # База даних
│   │   ├── SupabaseRepository.ts
│   │   ├── DatabaseConnection.ts
│   │   └── migrations/
│   ├── security/                   # Безпека
│   │   ├── RateLimiter.ts
│   │   ├── SecureLogger.ts
│   │   └── EncryptionService.ts
│   ├── monitoring/                 # Моніторинг
│   │   ├── MetricsCollector.ts
│   │   ├── HealthChecker.ts
│   │   └── AlertManager.ts
│   └── external/                   # Зовнішні сервіси
│       ├── EmailService.ts
│       └── NotificationService.ts
├── presentation/                   # Шар представлення
│   ├── api/                        # API Routes
│   │   ├── heartbeat/
│   │   ├── license/
│   │   └── plugins/
│   ├── web/                        # Web Dashboard
│   │   ├── components/
│   │   ├── pages/
│   │   └── hooks/
│   └── plugin/                      # SketchUp Plugin
│       ├── LicenseManager.rb
│       ├── HeartbeatManager.rb
│       └── UIManager.rb
└── shared/                         # Спільні компоненти
    ├── types/                       # TypeScript типи
    ├── constants/                   # Константи
    ├── utils/                       # Утиліти
    └── errors/                      # Обробка помилок
```

---

## 🎯 **ДОМЕННІ СУЩНОСТІ**

### **License Entity**
```typescript
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

  // Бізнес-логіка
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

  public getRemainingActivations(): number {
    return Math.max(0, this.maxActivations - this.activationCount);
  }
}
```

### **UserLicense Entity**
```typescript
export class UserLicense {
  constructor(
    private readonly id: UserLicenseId,
    private readonly email: Email,
    private readonly licenseKey: LicenseKey,
    private readonly hardwareId: HardwareId,
    private readonly activatedAt: Date,
    private readonly lastHeartbeat: Date | null,
    private readonly offlineCount: number,
    private readonly maxOfflineHours: number,
    private readonly isActive: boolean
  ) {}

  public isOfflineLimitExceeded(): boolean {
    if (!this.lastHeartbeat) return false;
    
    const hoursSinceLastHeartbeat = TimeCalculationService.getHoursDifference(
      this.lastHeartbeat, 
      new Date()
    );
    
    return hoursSinceLastHeartbeat > this.maxOfflineHours;
  }

  public shouldShowOfflineWarning(): boolean {
    return this.offlineCount > (this.maxOfflineHours / 2);
  }

  public updateHeartbeat(): UserLicense {
    return new UserLicense(
      this.id,
      this.email,
      this.licenseKey,
      this.hardwareId,
      this.activatedAt,
      new Date(),
      0, // Reset offline count
      this.maxOfflineHours,
      this.isActive
    );
  }
}
```

### **Plugin Entity**
```typescript
export class Plugin {
  constructor(
    private readonly id: PluginId,
    private readonly name: string,
    private readonly version: string,
    private readonly userId: string,
    private readonly computerName: string,
    private readonly systemInfo: SystemInfo,
    private readonly ipAddress: string,
    private readonly lastHeartbeat: Date,
    private readonly state: PluginState,
    private readonly createdAt: Date,
    private readonly updatedAt: Date
  ) {}

  public isActive(): boolean {
    return this.state === PluginState.ACTIVE;
  }

  public isBlocked(): boolean {
    return this.state === PluginState.BLOCKED;
  }

  public updateState(newState: PluginState): Plugin {
    return new Plugin(
      this.id,
      this.name,
      this.version,
      this.userId,
      this.computerName,
      this.systemInfo,
      this.ipAddress,
      this.lastHeartbeat,
      newState,
      this.createdAt,
      new Date()
    );
  }
}
```

---

## 🔧 **USE CASES (Бізнес-логіка)**

### **ActivateLicenseUseCase**
```typescript
export class ActivateLicenseUseCase {
  constructor(
    private readonly licenseRepository: ILicenseRepository,
    private readonly userLicenseRepository: IUserLicenseRepository,
    private readonly timeService: ITimeService,
    private readonly logger: ILogger
  ) {}

  async execute(request: ActivateLicenseRequest): Promise<ActivateLicenseResponse> {
    try {
      // 1. Валідація вхідних даних
      const validationResult = this.validateRequest(request);
      if (!validationResult.isValid) {
        return ActivateLicenseResponse.failure(validationResult.error);
      }

      // 2. Перевірка існування ліцензії
      const license = await this.licenseRepository.findByKey(request.licenseKey);
      if (!license) {
        return ActivateLicenseResponse.failure('License not found');
      }

      // 3. Перевірка можливості активації
      if (!license.canActivate()) {
        return ActivateLicenseResponse.failure('License cannot be activated');
      }

      // 4. Перевірка на дублікат активації
      const existingActivation = await this.userLicenseRepository.findByLicenseAndHardware(
        request.licenseKey, 
        request.hardwareId
      );
      
      if (existingActivation) {
        return ActivateLicenseResponse.failure('License already activated on this device');
      }

      // 5. Створення користувацької ліцензії
      const userLicense = new UserLicense(
        UserLicenseId.generate(),
        new Email(request.email),
        new LicenseKey(request.licenseKey),
        new HardwareId(request.hardwareId),
        new Date(),
        null,
        0,
        license.features.maxOfflineHours,
        true
      );

      // 6. Транзакційне збереження
      await this.licenseRepository.transaction(async (tx) => {
        await this.userLicenseRepository.save(userLicense, tx);
        await this.licenseRepository.incrementActivationCount(license.id, tx);
      });

      this.logger.info('License activated successfully', {
        email: request.email,
        licenseKey: request.licenseKey.substring(0, 8) + '...',
        hardwareId: request.hardwareId
      });

      return ActivateLicenseResponse.success(userLicense);

    } catch (error) {
      this.logger.error('License activation failed', error);
      return ActivateLicenseResponse.failure('Internal server error');
    }
  }

  private validateRequest(request: ActivateLicenseRequest): ValidationResult {
    const errors: string[] = [];

    if (!request.email || !Email.isValid(request.email)) {
      errors.push('Invalid email');
    }

    if (!request.licenseKey || !LicenseKey.isValid(request.licenseKey)) {
      errors.push('Invalid license key');
    }

    if (!request.hardwareId || !HardwareId.isValid(request.hardwareId)) {
      errors.push('Invalid hardware ID');
    }

    return {
      isValid: errors.length === 0,
      error: errors.join(', ')
    };
  }
}
```

### **ValidateLicenseUseCase**
```typescript
export class ValidateLicenseUseCase {
  constructor(
    private readonly licenseRepository: ILicenseRepository,
    private readonly userLicenseRepository: IUserLicenseRepository,
    private readonly timeService: ITimeService,
    private readonly logger: ILogger
  ) {}

  async execute(request: ValidateLicenseRequest): Promise<ValidateLicenseResponse> {
    try {
      // 1. Отримання користувацької ліцензії
      const userLicense = await this.userLicenseRepository.findByLicenseAndHardware(
        request.licenseKey,
        request.hardwareId
      );

      if (!userLicense) {
        return ValidateLicenseResponse.invalid('User license not found');
      }

      // 2. Отримання майстер-ліцензії
      const license = await this.licenseRepository.findByKey(request.licenseKey);
      if (!license) {
        return ValidateLicenseResponse.invalid('Master license not found');
      }

      // 3. Перевірка активності майстер-ліцензії
      if (!license.isActive) {
        return ValidateLicenseResponse.invalid('Master license is inactive');
      }

      // 4. Перевірка терміну дії
      if (license.isExpired(userLicense.activatedAt)) {
        return ValidateLicenseResponse.invalid('License has expired');
      }

      // 5. Перевірка offline ліміту
      if (userLicense.isOfflineLimitExceeded()) {
        return ValidateLicenseResponse.invalid('Offline limit exceeded');
      }

      // 6. Оновлення heartbeat
      const updatedUserLicense = userLicense.updateHeartbeat();
      await this.userLicenseRepository.save(updatedUserLicense);

      return ValidateLicenseResponse.valid(license, updatedUserLicense);

    } catch (error) {
      this.logger.error('License validation failed', error);
      return ValidateLicenseResponse.invalid('Validation failed');
    }
  }
}
```

### **ProcessHeartbeatUseCase**
```typescript
export class ProcessHeartbeatUseCase {
  constructor(
    private readonly pluginRepository: IPluginRepository,
    private readonly validateLicenseUseCase: ValidateLicenseUseCase,
    private readonly timeService: ITimeService,
    private readonly logger: ILogger
  ) {}

  async execute(request: HeartbeatRequest): Promise<HeartbeatResponse> {
    try {
      // 1. Валідація вхідних даних
      const validationResult = this.validateHeartbeatRequest(request);
      if (!validationResult.isValid) {
        return HeartbeatResponse.failure(validationResult.error);
      }

      // 2. Визначення стану плагіна
      let pluginState = PluginState.INACTIVE;

      if (request.licenseInfo) {
        // Валідація ліцензії
        const licenseValidation = await this.validateLicenseUseCase.execute({
          email: request.licenseInfo.email,
          licenseKey: request.licenseInfo.licenseKey,
          hardwareId: request.licenseInfo.hardwareId
        });

        if (licenseValidation.isValid) {
          pluginState = PluginState.ACTIVE;
        } else {
          pluginState = PluginState.BLOCKED;
          this.logger.warn('License validation failed', {
            reason: licenseValidation.reason,
            email: request.licenseInfo.email
          });
        }
      }

      // 3. Оновлення плагіна
      const plugin = new Plugin(
        new PluginId(request.pluginId),
        request.pluginName,
        request.version,
        request.userId,
        request.computerName,
        new SystemInfo(request.systemInfo),
        request.ipAddress,
        new Date(request.timestamp),
        pluginState,
        new Date(),
        new Date()
      );

      const savedPlugin = await this.pluginRepository.save(plugin);

      return HeartbeatResponse.success(savedPlugin);

    } catch (error) {
      this.logger.error('Heartbeat processing failed', error);
      return HeartbeatResponse.failure('Internal server error');
    }
  }

  private validateHeartbeatRequest(request: HeartbeatRequest): ValidationResult {
    const errors: string[] = [];

    if (!request.pluginId) errors.push('Plugin ID is required');
    if (!request.pluginName) errors.push('Plugin name is required');
    if (!request.version) errors.push('Version is required');
    if (!request.userId) errors.push('User ID is required');
    if (!request.computerName) errors.push('Computer name is required');
    if (!request.timestamp) errors.push('Timestamp is required');

    return {
      isValid: errors.length === 0,
      error: errors.join(', ')
    };
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

### **Індекси для оптимізації**
```sql
-- Основні індекси
CREATE INDEX idx_licenses_license_key ON licenses(license_key);
CREATE INDEX idx_licenses_is_active ON licenses(is_active);
CREATE INDEX idx_licenses_license_type ON licenses(license_type);

CREATE INDEX idx_user_licenses_email ON user_licenses(email);
CREATE INDEX idx_user_licenses_license_key ON user_licenses(license_key);
CREATE INDEX idx_user_licenses_hardware_id ON user_licenses(hardware_id);
CREATE INDEX idx_user_licenses_is_active ON user_licenses(is_active);
CREATE INDEX idx_user_licenses_last_heartbeat ON user_licenses(last_heartbeat);

CREATE INDEX idx_plugins_plugin_id ON plugins(plugin_id);
CREATE INDEX idx_plugins_state ON plugins(state);
CREATE INDEX idx_plugins_last_heartbeat ON plugins(last_heartbeat);

-- Композитні індекси
CREATE INDEX idx_user_licenses_license_hardware ON user_licenses(license_key, hardware_id);
CREATE INDEX idx_user_licenses_active_heartbeat ON user_licenses(is_active, last_heartbeat);
CREATE INDEX idx_plugins_state_heartbeat ON plugins(state, last_heartbeat);
```

---

## 🔒 **БЕЗПЕКА ТА МОНІТОРИНГ**

### **Rate Limiting**
```typescript
export class RateLimiter {
  private static readonly LIMITS = {
    HEARTBEAT: { requests: 10, window: 60000 }, // 10/хв
    LICENSE_ACTIVATION: { requests: 3, window: 300000 }, // 3/5хв
    API_CALLS: { requests: 100, window: 60000 } // 100/хв
  };

  static async checkLimit(key: string, type: keyof typeof RateLimiter.LIMITS): Promise<boolean> {
    const limit = this.LIMITS[type];
    const current = await this.getCurrentCount(key, type);
    return current < limit.requests;
  }

  private static async getCurrentCount(key: string, type: string): Promise<number> {
    // Реалізація з використанням Redis або in-memory cache
  }
}
```

### **Безпечне логування**
```typescript
export class SecureLogger {
  static logLicenseActivity(activity: string, data: any): void {
    const maskedData = this.maskSensitiveData(data);
    console.log(`[LICENSE] ${activity}:`, maskedData);
  }

  private static maskSensitiveData(data: any): any {
    if (data.license_key) {
      data.license_key = data.license_key.substring(0, 8) + '...';
    }
    if (data.email) {
      const [user, domain] = data.email.split('@');
      data.email = user.substring(0, 2) + '***@' + domain;
    }
    return data;
  }
}
```

### **Health Check**
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

  it('should check activation limits', () => {
    const license = new License(/* maxActivations: 3, activationCount: 2 */);
    expect(license.canActivate()).toBe(true);
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

## 📊 **МЕТРИКИ ТА МОНІТОРИНГ**

### **Ключові метрики**
- **Ліцензії**: Загальна кількість, активні, прострочені, заблоковані
- **Плагіни**: Активні, заблоковані, offline
- **Продуктивність**: Час відгуку API, кількість помилок
- **Безпека**: Спроби неавторизованого доступу, rate limiting

### **Dashboard**
```typescript
export class MetricsDashboard {
  static async getLicenseMetrics(): Promise<LicenseMetrics> {
    return {
      totalLicenses: await this.getTotalLicenses(),
      activeLicenses: await this.getActiveLicenses(),
      expiredLicenses: await this.getExpiredLicenses(),
      blockedLicenses: await this.getBlockedLicenses()
    };
  }
}
```

---

## 🚀 **ПЛАН ВПРОВАДЖЕННЯ**

### **Фаза 1: Фундамент (Тижні 1-2)**
- [ ] Створення базової структури проекту
- [ ] Реалізація Domain Entities
- [ ] Створення базових Use Cases
- [ ] Налаштування тестового середовища

### **Фаза 2: Бізнес-логіка (Тижні 3-4)**
- [ ] Реалізація LicenseService
- [ ] Реалізація HeartbeatService
- [ ] Реалізація ValidationService
- [ ] Створення Repository implementations

### **Фаза 3: Інтеграція (Тижні 5-6)**
- [ ] Інтеграція з Supabase
- [ ] Реалізація API endpoints
- [ ] Створення Dashboard
- [ ] Інтеграція з SketchUp Plugin

### **Фаза 4: Безпека та моніторинг (Тижні 7-8)**
- [ ] Додавання Rate Limiting
- [ ] Реалізація Health Check
- [ ] Створення системи метрик
- [ ] Налаштування алертів

### **Фаза 5: Тестування та оптимізація (Тижні 9-10)**
- [ ] Написання автоматичних тестів
- [ ] Навантажувальне тестування
- [ ] Оптимізація продуктивності
- [ ] Документація

---

## 📈 **ОЧІКУВАНІ РЕЗУЛЬТАТИ**

### **Технічні покращення**
- ✅ Зменшення кількості помилок блокування на 90%
- ✅ Покращення часу відгуку API на 50%
- ✅ Зменшення false positive блокувань на 95%
- ✅ Підвищення стабільності Hardware ID на 100%

### **Бізнес покращення**
- ✅ Зменшення скарг користувачів на 80%
- ✅ Підвищення задоволеності на 70%
- ✅ Зменшення часу підтримки на 60%
- ✅ Підвищення надійності системи на 90%

---

**Останнє оновлення:** 27 вересня 2025 року  
**Версія архітектури:** 2.0  
**Автор:** ProGran3 Development Team




