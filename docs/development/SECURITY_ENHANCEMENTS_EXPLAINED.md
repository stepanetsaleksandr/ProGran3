# 🔒 Покращення безпеки - пояснення для початківців

**Дата:** 17 жовтня 2025  
**Для кого:** Розробники без досвіду в безпеці  
**Час реалізації:** 5-7 годин загалом

---

## 📚 ВСТУП

Ваша система ліцензування **вже працює** і має захист **8/10**. Це добре!

Але є два механізми, які можуть підвищити безпеку до **9/10** і захистити від специфічних атак:

1. **HMAC Request Signatures** - захист від підробки запитів
2. **Rate Limiting** - захист від brute-force атак (спроб вгадати ключ)

Давайте розберемо кожен механізм простою мовою.

---

## 1️⃣ HMAC REQUEST SIGNATURES

### 🤔 Що це таке простими словами?

Уявіть, що ви відправляєте лист поштою. Як отримувач може бути впевнений, що:
1. Лист дійсно від вас (не хтось інший прикинувся вами)
2. Лист не змінили по дорозі

**HMAC** - це "цифровий підпис" для ваших HTTP запитів. Це як печатка, яку неможливо підробити.

---

### 🎯 Навіщо це потрібно?

**Без HMAC:**
```
Хакер перехоплює ваш запит:
POST /api/licenses/activate
{ "email": "user@test.com", "license_key": "KEY123" }

Хакер може:
❌ Змінити email на свій
❌ Спробувати багато різних ключів
❌ Відправити запит знову (replay attack)
```

**З HMAC:**
```
POST /api/licenses/activate
{ "email": "user@test.com", "license_key": "KEY123" }
Headers:
  X-Signature: "a7b8c9d..."  ← Цифровий підпис
  X-Timestamp: 1729177200

Сервер перевіряє:
✅ Підпис правильний? (значить запит справжній)
✅ Timestamp свіжий? (не старий запит)
✅ Дані не змінені? (hash збігається)

Якщо хакер змінить хоч одну букву - підпис стане невірним!
```

---

### 🔧 Як це працює технічно?

#### Крок 1: Створення підпису (Plugin)

```ruby
# plugin/proGran3/security/api_client.rb

require 'openssl'
require 'json'

class ApiClient
  SECRET_KEY = "ваш-секретний-ключ-256-біт"  # Той самий на сервері!
  
  def self.create_signature(data)
    # 1. Перетворюємо дані в рядок
    body = data.to_json
    
    # 2. Додаємо timestamp (щоб запит був "свіжим")
    timestamp = Time.now.to_i
    
    # 3. Створюємо "відбиток" з body + timestamp
    message = "#{body}#{timestamp}"
    
    # 4. Створюємо HMAC підпис (як печатка)
    signature = OpenSSL::HMAC.hexdigest(
      'SHA256',           # Алгоритм хешування
      SECRET_KEY,         # Секретний ключ (знає тільки ваш код і сервер)
      message             # Що підписуємо
    )
    
    # 5. Повертаємо всі дані для відправки
    {
      body: body,
      timestamp: timestamp,
      signature: signature
    }
  end
  
  # Приклад використання:
  def self.activate(email, license_key, fingerprint)
    data = {
      user_email: email,
      license_key: license_key,
      system_fingerprint: fingerprint
    }
    
    # Створюємо підпис
    signed = create_signature(data)
    
    # Відправляємо з headers
    uri = URI("#{API_BASE_URL}/api/licenses/activate")
    request = Net::HTTP::Post.new(uri)
    
    # Додаємо headers з підписом
    request['Content-Type'] = 'application/json'
    request['X-Signature'] = signed[:signature]
    request['X-Timestamp'] = signed[:timestamp].to_s
    request.body = signed[:body]
    
    # Відправляємо...
    response = Net::HTTP.start(uri.host, uri.port, use_ssl: true) do |http|
      http.request(request)
    end
    
    # Обробляємо відповідь...
  end
end
```

---

#### Крок 2: Перевірка підпису (Server)

```typescript
// server/lib/hmac.ts

import crypto from 'crypto';

const SECRET_KEY = process.env.HMAC_SECRET_KEY; // Той самий що в плагіні!

/**
 * Перевіряє HMAC підпис запиту
 */
export function verifyHMAC(
  body: string,        // Тіло запиту (JSON string)
  timestamp: number,   // Коли запит створено
  signature: string    // Підпис з header
): { valid: boolean; error?: string } {
  
  // 1. Перевірка: Timestamp не старіше 5 хвилин
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;
  
  if (age > 300) {  // 300 секунд = 5 хвилин
    return {
      valid: false,
      error: 'Request expired (timestamp too old)'
    };
  }
  
  if (age < -60) {  // Не може бути з майбутнього
    return {
      valid: false,
      error: 'Invalid timestamp (from future)'
    };
  }
  
  // 2. Перевірка: Створюємо підпис з отриманих даних
  const message = `${body}${timestamp}`;
  
  const expectedSignature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(message)
    .digest('hex');
  
  // 3. Порівнюємо підписи (безпечне порівняння)
  const valid = crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
  
  if (!valid) {
    return {
      valid: false,
      error: 'Invalid signature (data tampered or wrong key)'
    };
  }
  
  // ✅ Все добре!
  return { valid: true };
}
```

---

#### Крок 3: Використання в API endpoint

```typescript
// server/app/api/licenses/activate/route.ts

import { verifyHMAC } from '@/lib/hmac';

export async function POST(request: NextRequest) {
  try {
    // 1. Отримуємо headers
    const signature = request.headers.get('X-Signature');
    const timestamp = request.headers.get('X-Timestamp');
    
    if (!signature || !timestamp) {
      return apiError('Missing HMAC signature', 401);
    }
    
    // 2. Читаємо body
    const body = await request.text();
    
    // 3. Перевіряємо підпис
    const hmacResult = verifyHMAC(
      body,
      parseInt(timestamp),
      signature
    );
    
    if (!hmacResult.valid) {
      console.warn('[HMAC] Verification failed:', hmacResult.error);
      return apiError(`Invalid signature: ${hmacResult.error}`, 401);
    }
    
    // 4. Парсимо JSON (тепер впевнені що дані валідні)
    const data = JSON.parse(body);
    
    // 5. Продовжуємо звичайну логіку...
    const { user_email, license_key, system_fingerprint } = data;
    
    // ... активація ліцензії ...
    
  } catch (error) {
    return apiError(error);
  }
}
```

---

### 📊 Що це дає?

| Загроза | Без HMAC | З HMAC |
|---------|----------|--------|
| **Підробка запиту** | ❌ Легко | ✅ Неможливо (потрібен SECRET_KEY) |
| **Replay attack** | ❌ Можливо | ✅ Блокується (timestamp) |
| **Зміна даних** | ❌ Не виявляється | ✅ Виявляється (signature invalid) |
| **Brute-force** | ⚠️ Можливо | ⚠️ Все ще можливо (rate limiting потрібен) |

**Security score:** 8/10 → **9/10** ✅

---

### ⚙️ Налаштування

#### 1. Згенеруйте SECRET_KEY (один раз):

```bash
# В терміналі (Linux/Mac):
openssl rand -hex 32

# Результат (приклад):
a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8
```

#### 2. Додайте в Vercel Environment Variables:

```
HMAC_SECRET_KEY=a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8
```

#### 3. Додайте в Plugin:

```ruby
# plugin/proGran3/security/api_client.rb
SECRET_KEY = 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8'
```

**⚠️ ВАЖЛИВО:** Не публікуйте SECRET_KEY у відкритому коді! Тримайте його в `.env` файлі.

---

### ⏱️ Час реалізації

- **Ruby код (plugin):** 30-45 хв
- **TypeScript код (server):** 45-60 хв
- **Тестування:** 30-45 хв
- **Загалом:** **2-3 години**

---

## 2️⃣ RATE LIMITING

### 🤔 Що це таке простими словами?

Уявіть, що ви охоронець на вході в клуб. Ви дозволяєте кожній людині входити **тільки раз на хвилину**.

Якщо хтось намагається увійти **100 разів за хвилину** - це підозріло! Швидше за все, це робот який намагається підібрати пароль.

**Rate Limiting** - це обмеження кількості запитів від одного користувача за певний час.

---

### 🎯 Навіщо це потрібно?

**Без Rate Limiting:**
```
Хакер пише скрипт:
for i in 1..1000000:
  try_activate("email@test.com", f"KEY{i}")

❌ Може спробувати 1,000,000 ключів
❌ За 1 годину перебере величезну кількість варіантів
❌ Може зламати слабкі ключі типу "KEY123"
❌ Ваш сервер падає від навантаження
```

**З Rate Limiting:**
```
Хакер пише той самий скрипт:
for i in 1..1000000:
  try_activate("email@test.com", f"KEY{i}")

Але після 10 спроб за хвилину:
✅ Сервер блокує на 15 хвилин
✅ Хакер може спробувати тільки 10 * 60 = 600 ключів/год
✅ Замість 1,000,000 за годину - тільки 600!
✅ Ви отримуєте alert про атаку
```

---

### 🔧 Як це працює технічно?

Rate Limiting потребує **пам'ять** для зберігання лічильників. Для цього використовуємо **Redis** (швидка in-memory база даних).

#### Варіант 1: Простий (самописний)

```typescript
// server/lib/simple-rate-limit.ts

// Тимчасове сховище в пам'яті (для простоти)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

/**
 * Перевіряє rate limit
 * @param identifier - Унікальний ідентифікатор (IP, license_key, email)
 * @param maxRequests - Максимум запитів
 * @param windowSeconds - За скільки секунд
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowSeconds: number = 60
): { allowed: boolean; resetAt: number; remaining: number } {
  
  const now = Math.floor(Date.now() / 1000);
  const existing = requestCounts.get(identifier);
  
  // Якщо запис застарів - видаляємо
  if (existing && existing.resetAt < now) {
    requestCounts.delete(identifier);
  }
  
  // Якщо немає запису - створюємо
  if (!requestCounts.has(identifier)) {
    requestCounts.set(identifier, {
      count: 1,
      resetAt: now + windowSeconds
    });
    
    return {
      allowed: true,
      resetAt: now + windowSeconds,
      remaining: maxRequests - 1
    };
  }
  
  // Інкрементуємо лічильник
  const record = requestCounts.get(identifier)!;
  record.count++;
  
  // Перевірка: Не перевищено ліміт?
  if (record.count > maxRequests) {
    return {
      allowed: false,
      resetAt: record.resetAt,
      remaining: 0
    };
  }
  
  return {
    allowed: true,
    resetAt: record.resetAt,
    remaining: maxRequests - record.count
  };
}
```

---

#### Варіант 2: Production (Upstash Redis)

**Чому Upstash?**
- ✅ Безкоштовний tier (10,000 запитів/день)
- ✅ Працює на Vercel edge network
- ✅ Не потрібно налаштовувати сервер
- ✅ Готова бібліотека `@upstash/ratelimit`

**Налаштування (5 хвилин):**

1. Реєстрація: https://upstash.com
2. Створіть Redis database (безкоштовно)
3. Скопіюйте: `UPSTASH_REDIS_REST_URL` та `UPSTASH_REDIS_REST_TOKEN`
4. Додайте в Vercel env vars

```typescript
// server/lib/rate-limit.ts

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Створюємо Redis клієнт (з env vars)
const redis = Redis.fromEnv();

// Конфігурація rate limiters
export const rateLimiters = {
  // Для активації (строгий)
  activate: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 запитів за хвилину
    analytics: true, // Збирає статистику
  }),
  
  // Для валідації (м'який)
  validate: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(30, "60 s"), // 30 запитів за хвилину
  }),
  
  // Для IP адрес (загальний)
  byIp: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(100, "60 s"), // 100 запитів за хвилину
  }),
};

/**
 * Перевіряє rate limit і повертає результат
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit
): Promise<{ allowed: boolean; limit: number; remaining: number; reset: number }> {
  
  const result = await limiter.limit(identifier);
  
  return {
    allowed: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset  // Timestamp коли скинеться
  };
}
```

---

#### Використання в API endpoint

```typescript
// server/app/api/licenses/activate/route.ts

import { rateLimiters, checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_email, license_key } = body;
    
    // 1️⃣ Rate limit по email (5 спроб/хв)
    const emailLimit = await checkRateLimit(
      `activate:email:${user_email}`,
      rateLimiters.activate
    );
    
    if (!emailLimit.allowed) {
      console.warn(`[Rate Limit] Email blocked: ${user_email}`);
      
      return apiError(
        `Too many activation attempts. Try again in ${Math.ceil((emailLimit.reset - Date.now()) / 1000)}s`,
        429,  // HTTP 429 Too Many Requests
        {
          resetAt: emailLimit.reset,
          remaining: emailLimit.remaining
        }
      );
    }
    
    // 2️⃣ Rate limit по IP (100 спроб/хв - загальний)
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ipLimit = await checkRateLimit(
      `activate:ip:${ip}`,
      rateLimiters.byIp
    );
    
    if (!ipLimit.allowed) {
      console.warn(`[Rate Limit] IP blocked: ${ip}`);
      return apiError('Too many requests from your IP', 429);
    }
    
    // 3️⃣ Продовжуємо звичайну логіку активації...
    // ...
    
  } catch (error) {
    return apiError(error);
  }
}
```

---

### 📊 Що це дає?

| Сценарій | Без Rate Limit | З Rate Limit (5/min) |
|----------|----------------|----------------------|
| **Brute-force атака** | ❌ 1,000,000 спроб/год | ✅ 300 спроб/год (5 × 60 хв) |
| **DDoS атака** | ❌ Сервер падає | ✅ Блокується автоматично |
| **Помилки користувача** | ⚠️ Може випадково накликати багато запитів | ✅ Захищено |
| **Витрати сервера** | ❌ Високі | ✅ Зменшені на 99% |

**Security score:** 8/10 → **8.5-9/10** (в комбінації з HMAC)

---

### ⚙️ Налаштування Upstash (крок за кроком)

#### Крок 1: Реєстрація
```
1. Відкрийте: https://upstash.com
2. Sign Up (безкоштовно)
3. Підтвердіть email
```

#### Крок 2: Створення Redis database
```
1. Dashboard → Create Database
2. Name: "progran3-ratelimit"
3. Type: Regional (безкоштовно)
4. Region: оберіть найближчий до ваших користувачів
   (напр. Europe/Frankfurt для України)
5. Click "Create"
```

#### Крок 3: Отримання credentials
```
1. Відкрийте створену базу
2. Скопіюйте:
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN
```

#### Крок 4: Додати в Vercel
```
1. Vercel Dashboard → Your Project → Settings
2. Environment Variables
3. Додайте:
   Name: UPSTASH_REDIS_REST_URL
   Value: [ваш URL]
   
   Name: UPSTASH_REDIS_REST_TOKEN
   Value: [ваш token]
   
4. Environments: ✅ Production ✅ Preview ✅ Development
5. Save
```

#### Крок 5: Встановити бібліотеку
```bash
cd server
npm install @upstash/ratelimit @upstash/redis
```

#### Крок 6: Deploy
```bash
vercel --prod
```

✅ Готово! Rate limiting працює.

---

### ⏱️ Час реалізації

**Варіант 1 (Simple):**
- Написати код: 1 година
- Тестування: 30 хв
- **Загалом: 1.5 години**
- ⚠️ Обмеження: Працює тільки в одному instance, скидається при redeploy

**Варіант 2 (Upstash - РЕКОМЕНДОВАНО):**
- Реєстрація Upstash: 10 хв
- Написати код: 1 година
- Інтеграція в endpoints: 1.5 години
- Тестування: 30 хв
- **Загалом: 3-4 години**
- ✅ Production-ready, працює на всіх instances

---

## 📊 ПОРІВНЯЛЬНА ТАБЛИЦЯ

| Параметр | Зараз (8/10) | + HMAC (8.5/10) | + Rate Limit (8.5/10) | + HMAC + Rate Limit (9/10) |
|----------|--------------|-----------------|----------------------|---------------------------|
| **Підробка запитів** | ⚠️ Можлива | ✅ Неможлива | ⚠️ Можлива | ✅ Неможлива |
| **Replay attacks** | ⚠️ Можливі | ✅ Блокуються | ⚠️ Можливі | ✅ Блокуються |
| **Brute-force** | ❌ Можливий | ❌ Можливий | ✅ Блокується | ✅ Блокується |
| **DDoS** | ❌ Можливий | ❌ Можливий | ✅ Блокується | ✅ Блокується |
| **Час реалізації** | - | 2-3 год | 3-4 год | 5-7 год |
| **Складність** | - | Середня | Середня | Середня |
| **Витрати** | $0 | $0 | $0 (free tier) | $0 (free tier) |

---

## 🎯 РЕКОМЕНДАЦІЇ

### Варіант A: Мінімум (тільки Rate Limiting)
**Якщо час обмежений:**
- ✅ Реалізуйте Rate Limiting (3-4 год)
- ✅ Захистить від brute-force та DDoS
- ✅ Security: 8/10 → 8.5/10

### Варіант B: Оптимальний (обидва)
**Якщо маєте час:**
- ✅ Реалізуйте HMAC (2-3 год)
- ✅ Реалізуйте Rate Limiting (3-4 год)
- ✅ Security: 8/10 → 9/10
- ✅ Комплексний захист

### Варіант C: Мінімум зараз, решта пізніше
**Поетапно:**
- Week 1: Rate Limiting (захист від brute-force)
- Week 2: HMAC (захист від підробки)

---

## 📝 ЧЕКЛІСТ РЕАЛІЗАЦІЇ

### HMAC Signatures (2-3 години):

**Plugin (Ruby):**
- [ ] Додати `create_signature()` в `api_client.rb`
- [ ] Оновити `activate()` метод
- [ ] Оновити `validate()` метод
- [ ] Оновити `heartbeat()` метод
- [ ] Додати SECRET_KEY (з env або константа)

**Server (TypeScript):**
- [ ] Створити `server/lib/hmac.ts`
- [ ] Реалізувати `verifyHMAC()`
- [ ] Інтегрувати в `/api/licenses/activate`
- [ ] Інтегрувати в `/api/licenses/validate`
- [ ] Додати `HMAC_SECRET_KEY` в Vercel env vars

**Тестування:**
- [ ] Тест: правильний підпис → success
- [ ] Тест: неправильний підпис → 401
- [ ] Тест: старий timestamp → 401
- [ ] Тест: змінені дані → 401

---

### Rate Limiting (3-4 години):

**Setup:**
- [ ] Зареєструватись на Upstash.com
- [ ] Створити Redis database
- [ ] Додати credentials в Vercel env vars
- [ ] Встановити `@upstash/ratelimit` та `@upstash/redis`

**Server (TypeScript):**
- [ ] Створити `server/lib/rate-limit.ts`
- [ ] Налаштувати rate limiters (activate, validate, byIp)
- [ ] Інтегрувати в `/api/licenses/activate` (5 req/min per email)
- [ ] Інтегрувати в `/api/licenses/validate` (30 req/min per key)
- [ ] Інтегрувати в `/api/licenses/generate` (10 req/min per IP)
- [ ] Додати error responses (429 Too Many Requests)

**Тестування:**
- [ ] Тест: 5 запитів → OK
- [ ] Тест: 6-й запит → 429 (blocked)
- [ ] Тест: після 1 хвилини → знову працює
- [ ] Тест: різні emails → не впливають один на одного

---

## 🆘 TROUBLESHOOTING

### HMAC не працює

**Проблема:** "Invalid signature"
```
✅ Перевірте: SECRET_KEY однаковий в plugin і server
✅ Перевірте: timestamp в секундах (не мілісекундах)
✅ Перевірте: body відправляється як JSON string
✅ Перевірте: алгоритм SHA256 (не SHA1, не MD5)
```

---

### Rate Limiting не працює

**Проблема:** "Cannot connect to Redis"
```
✅ Перевірте: UPSTASH credentials в Vercel env vars
✅ Перевірте: Vercel redeploy після додавання env vars
✅ Перевірте: Network не блокує Upstash (firewall)
```

**Проблема:** Занадто строгий ліміт
```
✅ Збільште maxRequests: 5 → 10
✅ Збільште window: 60s → 120s
✅ Різні limiters для різних endpoints
```

---

## 📚 КОРИСНІ РЕСУРСИ

**HMAC:**
- [RFC 2104 - HMAC Specification](https://datatracker.ietf.org/doc/html/rfc2104)
- [OWASP - HMAC Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

**Rate Limiting:**
- [Upstash Documentation](https://upstash.com/docs/redis/features/ratelimiting)
- [OWASP - Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)

---

## ✅ ВИСНОВОК

Обидва механізми **прості у реалізації** і **значно підвищують безпеку**:

**HMAC (2-3 год):**
- Захист від підробки запитів
- Захист від replay attacks
- Security: 8/10 → 8.5/10

**Rate Limiting (3-4 год):**
- Захист від brute-force
- Захист від DDoS
- Security: 8/10 → 8.5/10

**HMAC + Rate Limiting (5-7 год):**
- Комплексний захист
- Security: 8/10 → **9/10** ✅

**Рекомендація:** Реалізуйте обидва механізми для максимальної безпеки.

---

**Дата:** 17 жовтня 2025  
**Версія:** 1.0  
**Для проекту:** ProGran3

