# 🔒 Аналіз безпеки системи ліцензування ProGran3

## 🚨 **КРИТИЧНІ ПРОБЛЕМИ БЕЗПЕКИ**

### **1. Відсутність Rate Limiting**
**Ризик:** ВИСОКИЙ  
**Опис:** API endpoints не мають захисту від спаму та DDoS атак

**Поточний стан:**
```typescript
// Відсутність обмежень на кількість запитів
export async function POST(request: NextRequest) {
  // Пряма обробка без перевірки rate limits
}
```

**Рекомендації:**
```typescript
export class RateLimiter {
  private static readonly LIMITS = {
    HEARTBEAT: { requests: 10, window: 60000 }, // 10 запитів/хвилину
    LICENSE_ACTIVATION: { requests: 3, window: 300000 }, // 3 запити/5 хвилин
    API_CALLS: { requests: 100, window: 60000 } // 100 запитів/хвилину
  };

  static async checkLimit(ip: string, endpoint: string): Promise<boolean> {
    // Реалізація з Redis або in-memory cache
  }
}
```

### **2. Небезпечне логування чутливих даних**
**Ризик:** ВИСОКИЙ  
**Опис:** Ліцензійні ключі та email адреси можуть потрапити в логи

**Поточний стан:**
```typescript
// Небезпечне логування
console.log('License validation result:', {
  isValid: licenseValidation.isValid,
  email: data.license_info.email, // ❌ Чутливі дані в логах
  hardware_id: data.license_info.hardware_id
});
```

**Рекомендації:**
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

### **3. Відсутність валідації вхідних даних**
**Ризик:** СЕРЕДНІЙ  
**Опис:** Недостатня валідація може призвести до SQL injection або XSS

**Поточний стан:**
```typescript
// Мінімальна валідація
if (!email || !license_key || !hardware_id) {
  return NextResponse.json({ error: 'Missing fields' });
}
```

**Рекомендації:**
```typescript
export class InputValidator {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateLicenseKey(key: string): boolean {
    const keyRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return keyRegex.test(key);
  }

  static validateHardwareId(id: string): boolean {
    return id.length >= 8 && id.length <= 64 && /^[a-z0-9-]+$/.test(id);
  }

  static sanitizeString(input: string): string {
    return input.replace(/[<>\"'&]/g, (match) => {
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return escapeMap[match];
    });
  }
}
```

### **4. Небезпечне зберігання Hardware ID**
**Ризик:** СЕРЕДНІЙ  
**Опис:** Hardware ID може бути легко підроблений

**Поточний стан:**
```ruby
# Проста генерація Hardware ID
def get_hardware_id
  hostname = Socket.gethostname.downcase.gsub(/[^a-z0-9]/, '-')
  username = ENV['USERNAME'] || ENV['USER'] || 'sketchup-user'
  "#{hostname}-#{username}".downcase
end
```

**Рекомендації:**
```ruby
def get_secure_hardware_id
  begin
    # Використовуємо стабільні системні параметри
    hostname = Socket.gethostname.downcase.gsub(/[^a-z0-9]/, '-')
    username = get_stable_username
    mac_address = get_primary_mac_address
    cpu_id = get_cpu_serial_number
    
    # Створюємо хеш для безпеки
    combined = "#{hostname}-#{username}-#{mac_address}-#{cpu_id}"
    hash = Digest::SHA256.hexdigest(combined)
    
    # Додаємо сіль для ускладнення підробки
    salt = get_system_salt
    final_hash = Digest::SHA256.hexdigest(hash + salt)
    
    final_hash[0..31] # Перші 32 символи
  rescue => e
    puts "⚠️ [Security] Помилка генерації secure hardware_id: #{e.message}"
    generate_fallback_id
  end
end

private

def get_system_salt
  # Отримання унікальної солі з системи
  # Може включати MAC адресу, CPU ID, або інші стабільні параметри
  system_info = get_system_info
  Digest::SHA256.hexdigest(system_info)[0..15]
end
```

### **5. Відсутність шифрування чутливих даних**
**Ризик:** ВИСОКИЙ  
**Опис:** Ліцензійні ключі зберігаються в відкритому вигляді

**Рекомендації:**
```typescript
export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;

  static encrypt(text: string, key: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipher(this.ALGORITHM, key);
    cipher.setAAD(Buffer.from('license-data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedText: string, key: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(this.ALGORITHM, key);
    decipher.setAAD(Buffer.from('license-data'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

---

## 🛡️ **РЕКОМЕНДАЦІЇ ПО БЕЗПЕЦІ**

### **1. Додавання Rate Limiting**
```typescript
// middleware/rateLimiter.ts
export class RateLimiterMiddleware {
  private static cache = new Map<string, { count: number; resetTime: number }>();

  static async checkLimit(ip: string, endpoint: string): Promise<boolean> {
    const key = `${ip}:${endpoint}`;
    const now = Date.now();
    const limit = this.getLimitForEndpoint(endpoint);
    
    const current = this.cache.get(key);
    
    if (!current || now > current.resetTime) {
      this.cache.set(key, { count: 1, resetTime: now + limit.window });
      return true;
    }
    
    if (current.count >= limit.requests) {
      return false;
    }
    
    current.count++;
    return true;
  }

  private static getLimitForEndpoint(endpoint: string) {
    const limits = {
      '/api/heartbeat': { requests: 10, window: 60000 },
      '/api/license/activate': { requests: 3, window: 300000 },
      '/api/plugins': { requests: 20, window: 60000 }
    };
    
    return limits[endpoint] || { requests: 100, window: 60000 };
  }
}
```

### **2. Валідація та санітизація**
```typescript
export class SecurityValidator {
  static validateAndSanitize(input: any): ValidationResult {
    const errors: string[] = [];
    const sanitized: any = {};

    // Валідація email
    if (input.email) {
      if (!this.isValidEmail(input.email)) {
        errors.push('Invalid email format');
      } else {
        sanitized.email = this.sanitizeEmail(input.email);
      }
    }

    // Валідація license key
    if (input.license_key) {
      if (!this.isValidLicenseKey(input.license_key)) {
        errors.push('Invalid license key format');
      } else {
        sanitized.license_key = input.license_key.toUpperCase();
      }
    }

    // Валідація hardware ID
    if (input.hardware_id) {
      if (!this.isValidHardwareId(input.hardware_id)) {
        errors.push('Invalid hardware ID format');
      } else {
        sanitized.hardware_id = this.sanitizeHardwareId(input.hardware_id);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  private static isValidLicenseKey(key: string): boolean {
    const keyRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return keyRegex.test(key);
  }

  private static isValidHardwareId(id: string): boolean {
    return /^[a-z0-9-]{8,64}$/.test(id);
  }

  private static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private static sanitizeHardwareId(id: string): string {
    return id.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }
}
```

### **3. Безпечне зберігання в базі даних**
```sql
-- Додавання полів для безпеки
ALTER TABLE user_licenses ADD COLUMN encrypted_license_key TEXT;
ALTER TABLE user_licenses ADD COLUMN encryption_version VARCHAR(10) DEFAULT 'v1';

-- Створення функції для шифрування
CREATE OR REPLACE FUNCTION encrypt_license_key(license_key TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Використання pgcrypto для шифрування
  RETURN encode(
    encrypt(license_key::bytea, current_setting('app.encryption_key'), 'aes'),
    'base64'
  );
END;
$$ LANGUAGE plpgsql;

-- Створення функції для розшифрування
CREATE OR REPLACE FUNCTION decrypt_license_key(encrypted_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN convert_from(
    decrypt(decode(encrypted_key, 'base64'), current_setting('app.encryption_key'), 'aes'),
    'UTF8'
  );
END;
$$ LANGUAGE plpgsql;
```

### **4. Моніторинг безпеки**
```typescript
export class SecurityMonitor {
  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: event.type,
      severity: event.severity,
      ip: event.ip,
      userAgent: event.userAgent,
      details: this.sanitizeEventDetails(event.details)
    };

    // Логування в безпечне місце
    await this.writeToSecureLog(logEntry);
    
    // Відправка алерту для критичних подій
    if (event.severity === 'CRITICAL') {
      await this.sendSecurityAlert(logEntry);
    }
  }

  private static sanitizeEventDetails(details: any): any {
    // Видалення чутливих даних з деталей події
    const sanitized = { ...details };
    delete sanitized.license_key;
    delete sanitized.email;
    delete sanitized.password;
    return sanitized;
  }
}

interface SecurityEvent {
  type: 'RATE_LIMIT_EXCEEDED' | 'INVALID_LICENSE' | 'SUSPICIOUS_ACTIVITY' | 'UNAUTHORIZED_ACCESS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ip: string;
  userAgent: string;
  details: any;
}
```

### **5. HTTPS та безпечні заголовки**
```typescript
// middleware/securityHeaders.ts
export function securityHeaders(req: NextRequest, res: NextResponse) {
  // Заголовки безпеки
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.headers.set('Content-Security-Policy', "default-src 'self'");
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return res;
}
```

---

## 🔍 **ПЛАН АУДИТУ БЕЗПЕКИ**

### **Фаза 1: Аналіз поточної безпеки (Тиждень 1)**
- [ ] Аудит коду на наявність вразливостей
- [ ] Перевірка наявності rate limiting
- [ ] Аналіз логування чутливих даних
- [ ] Перевірка валідації вхідних даних

### **Фаза 2: Впровадження захисту (Тижні 2-3)**
- [ ] Додавання rate limiting
- [ ] Реалізація безпечного логування
- [ ] Покращення валідації даних
- [ ] Додавання шифрування

### **Фаза 3: Моніторинг та тестування (Тиждень 4)**
- [ ] Налаштування системи моніторингу
- [ ] Тестування на проникнення
- [ ] Навантажувальне тестування
- [ ] Перевірка ефективності захисту

---

## 📊 **МЕТРИКИ БЕЗПЕКИ**

### **Ключові показники**
- **Rate Limiting**: Кількість заблокованих запитів
- **Валідація**: Кількість відхилених запитів
- **Шифрування**: Відсоток зашифрованих даних
- **Моніторинг**: Кількість підозрілих подій

### **Dashboard безпеки**
```typescript
export class SecurityDashboard {
  static async getSecurityMetrics(): Promise<SecurityMetrics> {
    return {
      rateLimitBlocks: await this.getRateLimitBlocks(),
      validationFailures: await this.getValidationFailures(),
      encryptionCoverage: await this.getEncryptionCoverage(),
      suspiciousEvents: await this.getSuspiciousEvents()
    };
  }
}
```

---

## ⚠️ **КРИТИЧНІ РЕКОМЕНДАЦІЇ**

### **Негайні дії (Пріоритет: КРИТИЧНИЙ)**
1. **Додати rate limiting** до всіх API endpoints
2. **Маскувати чутливі дані** в логах
3. **Валідувати всі вхідні дані** перед обробкою
4. **Шифрувати ліцензійні ключі** в базі даних

### **Короткострокові дії (1-2 тижні)**
1. **Покращити Hardware ID** генерацію
2. **Додати моніторинг безпеки**
3. **Налаштувати HTTPS** заголовки
4. **Створити систему алертів**

### **Довгострокові дії (1-2 місяці)**
1. **Провести повний аудит безпеки**
2. **Впровадити автоматичне тестування безпеки**
3. **Створити план реагування на інциденти**
4. **Навчити команду безпеці**

---

**Останнє оновлення:** 27 вересня 2025 року  
**Версія аналізу:** 1.0  
**Автор:** ProGran3 Development Team




