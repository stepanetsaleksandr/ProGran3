# 🔧 План виправлення архітектури системи ліцензування ProGran3

## 📋 Огляд проблем

### ❌ **КРИТИЧНІ ПРОБЛЕМИ ПОТОЧНОЇ АРХІТЕКТУРИ**

#### 1. **Порушення принципів SOLID**
- **Single Responsibility**: `LicenseValidator` виконує валідацію, оновлення heartbeat, управління статистикою
- **Open/Closed**: Неможливо розширити функціональність без зміни існуючого коду
- **Dependency Inversion**: Прямі залежності від Supabase замість абстракцій

#### 2. **Неузгодженість в обробці часу**
```typescript
// Проблема: days_valid використовується як дні і як хвилини
const expirationDate = new Date(activatedAt.getTime() + (license.days_valid * 60 * 1000)); // хвилини
// Але в інших місцях як дні
const hoursSinceLastHeartbeat = (Date.now() - lastHeartbeat.getTime()) / (1000 * 60 * 60);
```

#### 3. **Небезпечне управління станом**
```typescript
// Проблема: undefined для збереження стану
let isBlocked: boolean | undefined = false;
isBlocked = undefined; // Непередбачувана поведінка
```

#### 4. **Агресивна логіка блокування**
- Майстер-ліцензія деактивується при будь-якій помилці
- Блокує всіх користувачів цієї ліцензії
- Відсутність транзакційності операцій

#### 5. **Проблеми з Hardware ID**
- Залежність від змінних середовища
- Можливість різних ID на тому ж комп'ютері
- Відсутність fallback механізмів

---

## 🎯 **ПЛАН ВИПРАВЛЕНЬ**

### **ЕТАП 1: РЕФАКТОРИНГ АРХІТЕКТУРИ (Пріоритет: ВИСОКИЙ)**

#### 1.1 **Створення Domain Services**
```
src/domain/
├── services/
│   ├── LicenseService.ts          # Управління ліцензіями
│   ├── HeartbeatService.ts        # Обробка heartbeat
│   ├── ValidationService.ts       # Валідація даних
│   └── TimeService.ts             # Уніфікована обробка часу
├── entities/
│   ├── License.ts                 # Сущність ліцензії
│   ├── UserLicense.ts             # Сущність користувацької ліцензії
│   └── Plugin.ts                  # Сущність плагіна
└── repositories/
    ├── LicenseRepository.ts       # Абстракція для роботи з ліцензіями
    └── PluginRepository.ts        # Абстракція для роботи з плагінами
```

#### 1.2 **Створення Infrastructure Layer**
```
src/infrastructure/
├── database/
│   ├── SupabaseRepository.ts      # Реалізація репозиторіїв
│   └── DatabaseConnection.ts      # Управління підключеннями
├── security/
│   ├── HardwareIdGenerator.ts    # Стабільна генерація Hardware ID
│   └── LicenseKeyValidator.ts    # Валідація ліцензійних ключів
└── monitoring/
    ├── MetricsCollector.ts        # Збір метрик
    └── HealthChecker.ts          # Перевірка здоров'я системи
```

#### 1.3 **Створення Application Layer**
```
src/application/
├── use-cases/
│   ├── ActivateLicenseUseCase.ts  # Активація ліцензії
│   ├── ValidateLicenseUseCase.ts # Валідація ліцензії
│   ├── ProcessHeartbeatUseCase.ts # Обробка heartbeat
│   └── BlockPluginUseCase.ts      # Блокування плагіна
├── dto/
│   ├── LicenseDto.ts              # DTO для ліцензій
│   └── HeartbeatDto.ts           # DTO для heartbeat
└── interfaces/
    ├── ILicenseRepository.ts      # Інтерфейси репозиторіїв
    └── ITimeService.ts            # Інтерфейси сервісів
```

### **ЕТАП 2: ВИПРАВЛЕННЯ ПРОБЛЕМ ЧАСУ (Пріоритет: ВИСОКИЙ)**

#### 2.1 **Створення TimeService**
```typescript
export class TimeService {
  static readonly TIME_UNITS = {
    MINUTES: 'minutes',
    HOURS: 'hours',
    DAYS: 'days'
  } as const;

  static convertToMilliseconds(value: number, unit: string): number {
    switch (unit) {
      case this.TIME_UNITS.MINUTES:
        return value * 60 * 1000;
      case this.TIME_UNITS.HOURS:
        return value * 60 * 60 * 1000;
      case this.TIME_UNITS.DAYS:
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`Unknown time unit: ${unit}`);
    }
  }

  static calculateExpirationDate(activatedAt: Date, duration: number, unit: string): Date {
    const milliseconds = this.convertToMilliseconds(duration, unit);
    return new Date(activatedAt.getTime() + milliseconds);
  }
}
```

#### 2.2 **Уніфікація схемы бази даних**
```sql
-- Додавання поля time_unit для уніфікації
ALTER TABLE licenses ADD COLUMN time_unit VARCHAR(10) DEFAULT 'days';
ALTER TABLE licenses ADD COLUMN time_value INTEGER DEFAULT 365;

-- Міграція існуючих даних
UPDATE licenses SET time_unit = 'days', time_value = days_valid;
```

### **ЕТАП 3: ПОКРАЩЕННЯ БЕЗПЕКИ (Пріоритет: ВИСОКИЙ)**

#### 3.1 **Rate Limiting**
```typescript
export class RateLimiter {
  private static readonly RATE_LIMITS = {
    HEARTBEAT: { requests: 10, window: 60000 }, // 10 запитів на хвилину
    LICENSE_ACTIVATION: { requests: 3, window: 300000 }, // 3 запити на 5 хвилин
    API_CALLS: { requests: 100, window: 60000 } // 100 запитів на хвилину
  };

  static async checkLimit(key: string, type: keyof typeof RateLimiter.RATE_LIMITS): Promise<boolean> {
    // Реалізація rate limiting
  }
}
```

#### 3.2 **Безпечне логування**
```typescript
export class SecureLogger {
  static logLicenseActivity(activity: string, data: any): void {
    // Маскування чутливих даних
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

### **ЕТАП 4: СТАБІЛІЗАЦІЯ HARDWARE ID (Пріоритет: СЕРЕДНІЙ)**

#### 4.1 **Покращена генерація Hardware ID**
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

private

def get_stable_username
  # Пріоритет: USERNAME > USER > fallback
  ENV['USERNAME'] || ENV['USER'] || 'sketchup-user'
end

def get_primary_mac_address
  # Отримання MAC адреси основного мережевого інтерфейсу
  # Реалізація залежить від ОС
end
```

### **ЕТАП 5: ПОКРАЩЕННЯ УПРАВЛІННЯ СТАНОМ (Пріоритет: ВИСОКИЙ)**

#### 5.1 **Явні стани замість undefined**
```typescript
export enum PluginState {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}

export class PluginStateManager {
  static determineState(licenseValid: boolean, hasLicense: boolean, currentState: PluginState): PluginState {
    if (!hasLicense) {
      return PluginState.INACTIVE;
    }
    
    if (licenseValid) {
      return PluginState.ACTIVE;
    }
    
    return PluginState.BLOCKED;
  }
}
```

#### 5.2 **Транзакційність операцій**
```typescript
export class LicenseTransactionService {
  static async activateLicenseWithTransaction(licenseData: LicenseActivationData): Promise<ActivationResult> {
    return await supabase.rpc('activate_license_transaction', {
      p_email: licenseData.email,
      p_license_key: licenseData.licenseKey,
      p_hardware_id: licenseData.hardwareId
    });
  }
}
```

### **ЕТАП 6: МОНІТОРИНГ ТА ДІАГНОСТИКА (Пріоритет: СЕРЕДНІЙ)**

#### 6.1 **Система метрик**
```typescript
export class MetricsCollector {
  static async collectLicenseMetrics(): Promise<LicenseMetrics> {
    return {
      totalLicenses: await this.getTotalLicenses(),
      activeLicenses: await this.getActiveLicenses(),
      expiredLicenses: await this.getExpiredLicenses(),
      blockedLicenses: await this.getBlockedLicenses(),
      averageActivationTime: await this.getAverageActivationTime()
    };
  }
}
```

#### 6.2 **Health Check система**
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

## 📅 **КАЛЕНДАРНИЙ ПЛАН ВПРОВАДЖЕННЯ**

### **Тиждень 1-2: Критичні виправлення**
- [ ] Створення TimeService та уніфікація обробки часу
- [ ] Виправлення агресивної логіки блокування
- [ ] Додавання транзакційності до операцій з ліцензіями
- [ ] Створення явних станів замість undefined

### **Тиждень 3-4: Рефакторинг архітектури**
- [ ] Створення Domain Services
- [ ] Розділення LicenseValidator на окремі сервіси
- [ ] Створення Infrastructure Layer
- [ ] Реалізація Repository Pattern

### **Тиждень 5-6: Безпека та стабілізація**
- [ ] Додавання Rate Limiting
- [ ] Покращення безпечного логування
- [ ] Стабілізація Hardware ID генерації
- [ ] Додавання fallback механізмів

### **Тиждень 7-8: Моніторинг та тестування**
- [ ] Створення системи метрик
- [ ] Додавання Health Check
- [ ] Написання автоматичних тестів
- [ ] Створення dashboard для моніторингу

---

## 🧪 **ПЛАН ТЕСТУВАННЯ**

### **Unit Tests**
- [ ] Тестування TimeService
- [ ] Тестування LicenseService
- [ ] Тестування HeartbeatService
- [ ] Тестування ValidationService

### **Integration Tests**
- [ ] Тестування активації ліцензій
- [ ] Тестування heartbeat логіки
- [ ] Тестування блокування плагінів
- [ ] Тестування транзакцій

### **End-to-End Tests**
- [ ] Повний цикл активації ліцензії
- [ ] Тестування offline сценаріїв
- [ ] Тестування rate limiting
- [ ] Тестування fallback механізмів

---

## 📊 **КРИТЕРІЇ УСПІХУ**

### **Технічні метрики**
- [ ] Зменшення кількості помилок блокування на 90%
- [ ] Покращення часу відгуку API на 50%
- [ ] Зменшення кількості false positive блокувань на 95%
- [ ] Підвищення стабільності Hardware ID на 100%

### **Бізнес метрики**
- [ ] Зменшення кількості скарг користувачів на 80%
- [ ] Підвищення задоволеності користувачів на 70%
- [ ] Зменшення часу на підтримку на 60%
- [ ] Підвищення надійності системи на 90%

---

## ⚠️ **РИЗИКИ ТА МІТИГАЦІЯ**

### **Високі ризики**
1. **Втрата даних при міграції**
   - *Мітигація*: Повне резервне копіювання перед міграцією
   - *План відновлення*: Rollback до попередньої версії

2. **Порушення роботи існуючих користувачів**
   - *Мітигація*: Поетапне впровадження з можливістю rollback
   - *Моніторинг*: Реальний час відстеження помилок

### **Середні ризики**
1. **Збільшення складності коду**
   - *Мітигація*: Детальна документація та навчання команди
   - *Підтримка*: Code review та pair programming

2. **Продуктивність після рефакторингу**
   - *Мітигація*: Профілювання та оптимізація
   - *Моніторинг*: Метрики продуктивності

---

**Останнє оновлення:** 27 вересня 2025 року  
**Версія плану:** 1.0  
**Автор:** ProGran3 Development Team




