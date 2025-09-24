# **ПЛАН СЕРВЕРНОЇ ВАЛІДАЦІЇ ЛІЦЕНЗІЙ**

## **ЕТАП 1: СТРУКТУРА БАЗИ ДАНИХ**

### **1.1 Таблиця ліцензій**
```sql
CREATE TABLE licenses (
  id SERIAL PRIMARY KEY,
  license_key VARCHAR(50) UNIQUE NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  license_type VARCHAR(20) NOT NULL, -- 'trial', 'basic', 'pro'
  status VARCHAR(20) NOT NULL, -- 'active', 'expired', 'suspended'
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  max_activations INTEGER DEFAULT 1,
  current_activations INTEGER DEFAULT 0,
  last_used TIMESTAMP,
  notes TEXT
);
```

### **1.2 Таблиця активацій**
```sql
CREATE TABLE license_activations (
  id SERIAL PRIMARY KEY,
  license_id INTEGER REFERENCES licenses(id),
  plugin_id VARCHAR(100) NOT NULL,
  computer_name VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  activated_at TIMESTAMP DEFAULT NOW(),
  last_heartbeat TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  ip_address INET,
  system_info JSONB
);
```

### **1.3 Таблиця логів ліцензій**
```sql
CREATE TABLE license_logs (
  id SERIAL PRIMARY KEY,
  license_id INTEGER REFERENCES licenses(id),
  action VARCHAR(50) NOT NULL, -- 'validate', 'activate', 'deactivate', 'expire'
  plugin_id VARCHAR(100),
  computer_name VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  details JSONB
);
```

## **ЕТАП 2: API ENDPOINTS**

### **2.1 Валідація ліцензії**
```typescript
// server/src/app/api/license/validate/route.ts
POST /api/license/validate
Body: { license_key, plugin_id, computer_name, user_id }
Response: { valid: boolean, license_type: string, expires_at: string, reason?: string }
```

### **2.2 Активація ліцензії**
```typescript
// server/src/app/api/license/activate/route.ts
POST /api/license/activate
Body: { license_key, plugin_id, computer_name, user_id, system_info }
Response: { success: boolean, message: string, activation_id?: number }
```

### **2.3 Деактивація ліцензії**
```typescript
// server/src/app/api/license/deactivate/route.ts
POST /api/license/deactivate
Body: { license_key, plugin_id, computer_name }
Response: { success: boolean, message: string }
```

### **2.4 Статус ліцензії**
```typescript
// server/src/app/api/license/status/route.ts
GET /api/license/status?license_key=xxx&plugin_id=xxx
Response: { valid: boolean, license_type: string, expires_at: string, activations: number }
```

### **2.5 Генерація ліцензій**
```typescript
// server/src/app/api/license/generate/route.ts
POST /api/license/generate
Body: { user_email, license_type, expires_at, max_activations }
Response: { license_key: string, success: boolean }
```

## **ЕТАП 3: БІЗНЕС-ЛОГІКА**

### **3.1 Валідація ліцензії**
```typescript
async function validateLicense(licenseKey: string, pluginId: string, computerName: string) {
  // 1. Перевірка існування ліцензії
  // 2. Перевірка статусу (active/expired/suspended)
  // 3. Перевірка терміну дії
  // 4. Перевірка кількості активацій
  // 5. Логування запиту
  // 6. Повернення результату
}
```

### **3.2 Активація ліцензії**
```typescript
async function activateLicense(licenseKey: string, pluginId: string, computerName: string, systemInfo: any) {
  // 1. Валідація ліцензії
  // 2. Перевірка кількості активацій
  // 3. Створення запису активації
  // 4. Оновлення лічильника активацій
  // 5. Логування активації
  // 6. Повернення результату
}
```

### **3.3 Деактивація ліцензії**
```typescript
async function deactivateLicense(licenseKey: string, pluginId: string, computerName: string) {
  // 1. Пошук активації
  // 2. Деактивація запису
  // 3. Зменшення лічильника активацій
  // 4. Логування деактивації
  // 5. Повернення результату
}
```

## **ЕТАП 4: БЕЗПЕКА**

### **4.1 Rate Limiting**
```typescript
// Обмеження кількості запитів
const rateLimiter = new Map();
const MAX_REQUESTS = 10;
const WINDOW_MS = 60000; // 1 хвилина
```

### **4.2 Валідація вхідних даних**
```typescript
// Валідація license_key формату
const LICENSE_KEY_REGEX = /^[A-Z0-9]{8}-[A-Z0-9]{8}-[A-Z0-9]{8}-[A-Z0-9]{8}$/;

// Валідація plugin_id
const PLUGIN_ID_REGEX = /^progran3-[a-z0-9-]+$/;
```

### **4.3 Шифрування чутливих даних**
```typescript
// Шифрування license_key в логах
const encryptedKey = encrypt(licenseKey);

// Хешування computer_name
const hashedComputerName = hash(computerName);
```

## **ЕТАП 5: ЛОГУВАННЯ ТА МОНІТОРИНГ**

### **5.1 Логування всіх операцій**
```typescript
async function logLicenseAction(action: string, licenseId: number, details: any) {
  await supabase.from('license_logs').insert({
    license_id: licenseId,
    action: action,
    details: details,
    timestamp: new Date().toISOString()
  });
}
```

### **5.2 Моніторинг підозрілої активності**
```typescript
// Виявлення підозрілої активності
- Багато запитів з одного IP
- Активації з різних країн
- Спроби використання недійсних ключів
- Активації з різних систем
```

## **ЕТАП 6: АДМІН ПАНЕЛЬ**

### **6.1 Управління ліцензіями**
```typescript
// server/src/app/admin/licenses/page.tsx
- Список всіх ліцензій
- Фільтрація за статусом/типом
- Пошук за email/license_key
- Масові операції
```

### **6.2 Статистика**
```typescript
// Метрики
- Кількість активних ліцензій
- Кількість активацій за день/тиждень/місяць
- Найпопулярніші типи ліцензій
- Географічний розподіл
```

### **6.3 Логи та аудит**
```typescript
// Перегляд логів
- Фільтрація за датою/дією
- Пошук за license_key/plugin_id
- Експорт логів
- Аналіз підозрілої активності
```

## **ЕТАП 7: ТЕСТУВАННЯ**

### **7.1 Unit тести**
```typescript
// Тести для кожної функції
- validateLicense()
- activateLicense()
- deactivateLicense()
- generateLicense()
```

### **7.2 Integration тести**
```typescript
// Тести API endpoints
- POST /api/license/validate
- POST /api/license/activate
- POST /api/license/deactivate
- GET /api/license/status
```

### **7.3 Load тести**
```typescript
// Тести навантаження
- 1000 одночасних запитів
- Довгострокове тестування
- Тести rate limiting
```

## **ЕТАП 8: РОЗГОРТАННЯ**

### **8.1 Міграції бази даних**
```sql
-- Міграція 005: Create license tables
-- Міграція 006: Add indexes
-- Міграція 007: Add constraints
```

### **8.2 Конфігурація**
```typescript
// Environment variables
LICENSE_SECRET_KEY=xxx
LICENSE_ENCRYPTION_KEY=xxx
LICENSE_RATE_LIMIT=10
LICENSE_WINDOW_MS=60000
```

### **8.3 Моніторинг**
```typescript
// Health checks
- Перевірка з'єднання з БД
- Перевірка API endpoints
- Моніторинг помилок
- Алерти при проблемах
```

## **ЕТАП 9: ДОКУМЕНТАЦІЯ**

### **9.1 API документація**
```markdown
# License API Documentation
- Endpoints
- Request/Response formats
- Error codes
- Examples
```

### **9.2 Інструкції для розробників**
```markdown
# License System Integration
- Як інтегрувати в плагін
- Приклади коду
- Обробка помилок
- Тестування
```

## **ЕТАП 10: ОПТИМІЗАЦІЯ**

### **10.1 Кешування**
```typescript
// Кешування валідних ліцензій
const licenseCache = new Map();
const CACHE_TTL = 300000; // 5 хвилин
```

### **10.2 Індекси бази даних**
```sql
-- Індекси для швидкого пошуку
CREATE INDEX idx_licenses_key ON licenses(license_key);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_activations_license ON license_activations(license_id);
CREATE INDEX idx_activations_plugin ON license_activations(plugin_id);
```

### **10.3 Моніторинг продуктивності**
```typescript
// Метрики продуктивності
- Час відповіді API
- Кількість запитів за секунду
- Використання пам'яті
- Навантаження на БД
```

---

## **ПРОГРЕС ВИКОНАННЯ**

- [ ] **ЕТАП 1:** Структура бази даних
- [ ] **ЕТАП 2:** API endpoints
- [ ] **ЕТАП 3:** Бізнес-логіка
- [ ] **ЕТАП 4:** Безпека
- [ ] **ЕТАП 5:** Логування та моніторинг
- [ ] **ЕТАП 6:** Адмін панель
- [ ] **ЕТАП 7:** Тестування
- [ ] **ЕТАП 8:** Розгортання
- [ ] **ЕТАП 9:** Документація
- [ ] **ЕТАП 10:** Оптимізація

---

**Створено:** 2025-09-24  
**Статус:** Планування  
**Пріоритет:** Високий
