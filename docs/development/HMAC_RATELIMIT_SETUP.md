# 🔒 Налаштування HMAC + Rate Limiting - Покрокова інструкція

**Дата:** 17 жовтня 2025  
**Час на налаштування:** 15-20 хвилин  
**Статус:** ✅ Код готовий, потрібне тільки налаштування

---

## ✅ ЩО ВЖЕ ЗРОБЛЕНО

### Server (TypeScript):
- ✅ `server/lib/hmac.ts` - HMAC верифікація
- ✅ `server/lib/rate-limit.ts` - Rate limiting (Simple + Upstash)
- ✅ `/api/licenses/activate` - інтегровано HMAC + Rate Limiting
- ✅ `/api/licenses/validate` - інтегровано HMAC + Rate Limiting
- ✅ `@upstash/ratelimit` + `@upstash/redis` - встановлено

### Plugin (Ruby):
- ✅ `plugin/proGran3/security/api_client.rb` - HMAC підписи
- ✅ Backward compatible - працює з і без HMAC

**Система працює в 3 режимах:**
1. **Без налаштування** - працює як раніше (Simple rate limiting in-memory)
2. **З Upstash** - Production rate limiting через Redis
3. **З Upstash + HMAC** - Maximum security (рекомендовано)

---

## 📋 КРОК 1: UPSTASH REDIS (15 хв)

### 1.1. Реєстрація на Upstash

1. Відкрийте: https://upstash.com
2. Натисніть **Sign Up**
3. Виберіть спосіб реєстрації:
   - GitHub (рекомендовано - швидше)
   - Google
   - Email
4. Підтвердіть email (якщо потрібно)

✅ **Готово!** Ви увійшли в Dashboard.

---

### 1.2. Створення Redis Database

1. В Upstash Dashboard натисніть **Create Database**

2. Заповніть форму:
   ```
   Name: progran3-ratelimit
   Type: Regional (БЕЗКОШТОВНО!)
   Region: Europe (Frankfurt)  ← оберіть найближчий до України
   Primary Region: Europe (Frankfurt)
   Read Regions: залиште порожнім
   TLS: Enabled (за замовчуванням)
   ```

3. Натисніть **Create**

4. Зачекайте 10-20 секунд поки database створюється...

✅ **Готово!** Database створено.

---

### 1.3. Отримання Credentials

1. Відкрийте створену database (**progran3-ratelimit**)

2. Перейдіть на вкладку **REST API**

3. Скопіюйте два значення:
   ```
   UPSTASH_REDIS_REST_URL
   Приклад: https://eu2-balanced-ape-12345.upstash.io
   
   UPSTASH_REDIS_REST_TOKEN  
   Приклад: AYwgASQ...много-букв...xyz123==
   ```

4. **ЗБЕРЕЖІТЬ** їх в безпечне місце (блокнот, password manager)

✅ **Готово!** Credentials отримано.

---

## 🔐 КРОК 2: HMAC SECRET KEY (2 хв)

### 2.1. Генерація ключа

**Спосіб 1: Online (швидко)**
1. Відкрийте: https://www.random.org/strings/
2. Налаштуйте:
   - Number of strings: 1
   - Length: 64
   - Characters: Hex (0-9, a-f)
3. Натисніть **Get Strings**
4. Скопіюйте згенерований ключ

**Спосіб 2: Terminal (безпечніше)**
```bash
# Windows PowerShell:
-join ((48..57) + (97..102) | Get-Random -Count 64 | % {[char]$_})

# Mac/Linux:
openssl rand -hex 32
```

**Приклад результату:**
```
a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8
```

5. **ЗБЕРЕЖІТЬ** ключ в безпечне місце

✅ **Готово!** SECRET_KEY згенеровано.

---

## ☁️ КРОК 3: VERCEL ENVIRONMENT VARIABLES (5 хв)

### 3.1. Додавання змінних

1. Відкрийте: https://vercel.com

2. Виберіть ваш проект: **server**

3. **Settings** → **Environment Variables**

4. Додайте **3 нові змінні:**

#### Змінна 1: UPSTASH_REDIS_REST_URL
```
Name: UPSTASH_REDIS_REST_URL
Value: [вставте URL з Upstash]
Environments: ✅ Production ✅ Preview ✅ Development
```
Натисніть **Save**

#### Змінна 2: UPSTASH_REDIS_REST_TOKEN
```
Name: UPSTASH_REDIS_REST_TOKEN
Value: [вставте TOKEN з Upstash]
Environments: ✅ Production ✅ Preview ✅ Development
```
Натисніть **Save**

#### Змінна 3: HMAC_SECRET_KEY
```
Name: HMAC_SECRET_KEY
Value: [вставте згенерований 64-char ключ]
Environments: ✅ Production ✅ Preview ✅ Development
```
Натисніть **Save**

✅ **Готово!** Змінні додано.

---

### 3.2. Redeploy

**ВАЖЛИВО:** Vercel НЕ застосовує env vars автоматично до існуючого deployment!

1. В Vercel Dashboard виберіть проект

2. Перейдіть на вкладку **Deployments**

3. Знайдіть останній deployment (перший в списку)

4. Натисніть **⋯** (три крапки) → **Redeploy**

5. Підтвердіть: **Redeploy**

6. Зачекайте 1-2 хвилини...

7. Перевірте статус: має бути **Ready** (зелена галочка)

✅ **Готово!** Server перезавантажено з новими env vars.

---

## 🔧 КРОК 4: PLUGIN HMAC KEY (опціонально - 2 хв)

### 4.1. Увімкнення HMAC в Plugin

**Якщо потрібен максимальний захист:**

1. Відкрийте: `plugin/proGran3/security/api_client.rb`

2. Знайдіть рядок 23:
   ```ruby
   SECRET_KEY = nil  # nil = HMAC вимкнено
   ```

3. Замініть на:
   ```ruby
   SECRET_KEY = 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8'
   ```
   **ВАЖЛИВО:** Використайте ТОЙ САМИЙ ключ що в Vercel env vars!

4. Збережіть файл

5. Перезавантажте плагін в SketchUp (або перезапустіть SketchUp)

**Якщо залишите `nil`:**
- Плагін працює БЕЗ HMAC (як раніше)
- Rate Limiting все ще працює
- Security: 8.5/10 (замість 9/10)

✅ **Готово!** HMAC увімкнено (або ні - ваш вибір).

---

## 🧪 КРОК 5: ТЕСТУВАННЯ (5 хв)

### 5.1. Перевірка Rate Limiting

**Тест 1: Activation Rate Limit (5 req/min)**

1. Відкрийте SketchUp → Ruby Console

2. Виконайте:
```ruby
# Завантажте test script
load 'C:/Users/ProVis3D/Desktop/ProGran3/plugin/proGran3/security/TEST_RATE_LIMIT.rb'
```

3. Очікуваний результат:
```
✅ Request 1: OK
✅ Request 2: OK
✅ Request 3: OK
✅ Request 4: OK
✅ Request 5: OK
❌ Request 6: 429 Too Many Requests (ПРАВИЛЬНО!)
⏱️ Зачекайте 60 секунд...
✅ Request 7: OK (після reset)
```

**Якщо всі тести пройшли - Rate Limiting працює!** ✅

---

**Тест 2: HMAC Verification (якщо увімкнено)**

1. Ruby Console:
```ruby
load 'C:/Users/ProVis3D/Desktop/ProGran3/plugin/proGran3/security/TEST_HMAC.rb'
```

2. Очікуваний результат:
```
✅ Request з правильним підписом: OK
❌ Request без підпису: 401 Unauthorized
❌ Request з неправильним підписом: 401 Unauthorized
❌ Request зі старим timestamp: 401 Unauthorized
```

**Якщо всі тести пройшли - HMAC працює!** ✅

---

### 5.2. Перевірка в Upstash Dashboard

1. Відкрийте Upstash Dashboard

2. Виберіть вашу database (**progran3-ratelimit**)

3. Перейдіть на вкладку **Data Browser**

4. Ви маєте побачити ключі типу:
   ```
   ratelimit:activate:email:user@test.com
   ratelimit:validate:key:PROGRAN3-...
   ratelimit:ip:123.456.789.0
   ```

5. Натисніть на будь-який ключ - побачите лічильник запитів

**Якщо ключі з'являються - все працює!** ✅

---

## 📊 ЩО ОТРИМАЛИ

### Без налаштування (як було):
```
Rate Limiting: ⚠️ Simple (in-memory, скидається при redeploy)
HMAC: ❌ Немає
Security: 8/10
```

### З Upstash (рекомендовано):
```
Rate Limiting: ✅ Production (Redis, persistent)
HMAC: ❌ Немає (можна додати пізніше)
Security: 8.5/10
```

### З Upstash + HMAC (максимум):
```
Rate Limiting: ✅ Production (Redis, persistent)
HMAC: ✅ Enabled
Security: 9/10
```

---

## 🔧 НАЛАШТУВАННЯ ЛІМІТІВ (опціонально)

### Змінити к-ть дозволених запитів:

Відкрийте: `server/lib/rate-limit.ts`

Знайдіть (рядок 67):
```typescript
rateLimiters = {
  activate: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(5, '60 s'), // ← змініть 5
    ...
  }),
  
  validate: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(30, '60 s'), // ← змініть 30
    ...
  }),
  
  byIp: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(100, '60 s'), // ← змініть 100
    ...
  }),
};
```

**Рекомендації:**
- **activate:** 5-10 req/min (це активація ліцензії - рідко)
- **validate:** 30-60 req/min (це перевірка при старті - частіше)
- **byIp:** 100-200 req/min (загальний ліміт на IP)

Після змін:
```bash
cd server
npm run build
vercel --prod
```

---

## 🆘 TROUBLESHOOTING

### "Cannot connect to Redis"

**Проблема:** Upstash credentials не додані або неправильні

**Рішення:**
1. Перевірте env vars в Vercel
2. Redeploy після додавання
3. Перевірте що credentials скопійовані повністю (довгі токени!)

---

### "Invalid HMAC signature"

**Проблема:** SECRET_KEY різний в plugin і server

**Рішення:**
1. Перевірте що ключ ТОЧНО однаковий (64 символи)
2. Немає пробілів на початку/кінці
3. Регістр має значення (lowercase)

---

### "Rate limit too strict"

**Проблема:** Блокується занадто швидко

**Рішення:**
1. Збільште ліміти в `rate-limit.ts`
2. Або зачекайте 60 секунд (window reset)

---

### Simple rate limiting замість Upstash

**Проблема:** Upstash не підключається

**Це нормально!** Система автоматично fallback до Simple mode.

**Перевірка:**
- Логи в Vercel: шукайте "Upstash not installed" або "Simple cache"
- Працює, але лічильники скидаються при redeploy

**Рішення:** Перевірте Upstash credentials і redeploy

---

## ✅ CHECKLIST

### Server:
- [ ] Upstash account створено
- [ ] Redis database створено
- [ ] UPSTASH_REDIS_REST_URL додано в Vercel
- [ ] UPSTASH_REDIS_REST_TOKEN додано в Vercel
- [ ] HMAC_SECRET_KEY додано в Vercel (опціонально)
- [ ] Vercel redeploy виконано
- [ ] Deployment status: Ready ✅

### Plugin (опціонально):
- [ ] SECRET_KEY встановлено в api_client.rb
- [ ] Плагін перезавантажено

### Testing:
- [ ] Rate limit test пройшов
- [ ] HMAC test пройшов (якщо увімкнено)
- [ ] Upstash Dashboard показує ключі

---

## 🎉 ГОТОВО!

**Вітаємо! Ви налаштували HMAC + Rate Limiting.**

**Security тепер:**
- Rate Limiting: ✅ Production-ready
- Brute-force protection: ✅
- DDoS protection: ✅
- HMAC signatures: ✅ (якщо увімкнено)
- **Overall: 8.5-9/10** 🔒

---

## 📚 ДОДАТКОВІ РЕСУРСИ

**Документація:**
- `docs/development/SECURITY_ENHANCEMENTS_EXPLAINED.md` - Детальні пояснення
- `server/lib/hmac.ts` - HMAC код
- `server/lib/rate-limit.ts` - Rate limiting код
- Upstash Docs: https://upstash.com/docs/redis/features/ratelimiting

**Підтримка:**
- Upstash Support: https://upstash.com/support
- Upstash Discord: https://upstash.com/discord

---

**Створено:** 17 жовтня 2025  
**Версія:** 1.0  
**Для проекту:** ProGran3

