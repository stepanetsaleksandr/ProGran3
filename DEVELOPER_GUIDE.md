# 💻 ProGran3 - Developer Guide

**Version:** 3.1.0 (Activity Tracking Edition)  
**Updated:** 17 жовтня 2025  
**Production:** https://server-qf9qtpsf0-provis3ds-projects.vercel.app

> **Це єдине джерело правди для розробників.** Вся критична інформація тут.

---

## 📑 ЗМІСТ

1. [CRITICAL - Обов'язково прочитати](#1-critical)
2. [ARCHITECTURE - Як влаштована система](#2-architecture)
3. [DEVELOPMENT - Робота з кодом](#3-development)
4. [DEPLOYMENT - Процес деплою](#4-deployment)
5. [TESTING - Тестування](#5-testing)
6. [REFERENCE - Довідкова інформація](#6-reference)

---

# 1. CRITICAL

## 🚨 Що треба знати ОБОВ'ЯЗКОВО

### Координатна система (КРИТИЧНО!)

**Єдине джерело правди:** `plugin/proGran3/COORDINATE_SYSTEM_STANDARD.md`

```
North/South (Північ/Південь) = X axis
East/West (Схід/Захід)       = Y axis  
Up/Down (Вгору/Вниз)         = Z axis
```

**НІКОЛИ не міняйте це!** Вся логіка builders базується на цьому.

---

### Production URLs

**Server:** `https://server-qf9qtpsf0-provis3ds-projects.vercel.app`

**Де оновлювати при зміні:**
- `plugin/proGran3/security/api_client.rb` (рядок 14)
- Vercel project: `server` (назва проекту)

**⚠️ ВАЖЛИВО:** URL міняється при кожному deploy. Завжди оновлюйте в plugin!

---

### Environment Variables (КРИТИЧНО!)

**Vercel (обов'язкові):**
```bash
# Supabase
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-key]

# Security
API_KEYS=c5a768b83ceaf3eea4987d8c8eb059daf328e21ed5f204bb75ac48c901b3893e
NEXT_PUBLIC_ADMIN_API_KEY=c5a768b83ceaf3eea4987d8c8eb059daf328e21ed5f204bb75ac48c901b3893e

# Optional (для HMAC + Rate Limiting)
HMAC_SECRET_KEY=[64-char-hex]                    # Для 9/10 security
UPSTASH_REDIS_REST_URL=[upstash-url]             # Для production rate limiting
UPSTASH_REDIS_REST_TOKEN=[upstash-token]         # Для production rate limiting
```

**⚠️ БЕЗ env vars система НЕ ПРАЦЮВАТИМЕ!**

---

### Database Schema (критичні таблиці)

```sql
licenses (головна)
├─ id, license_key, user_id
├─ status: generated → active → expired/revoked
├─ duration_days, activated_at, expires_at
└─ CASCADE видаляє: system_infos, heartbeats

users
├─ id, email, name
└─ Зв'язок: licenses.user_id → users.id

system_infos (hardware binding)
├─ id, license_id, fingerprint_hash
├─ last_seen (оновлюється heartbeat)
└─ system_data (JSONB: plugin_version, session_*, platform)

heartbeats (activity tracking)
├─ license_id, system_info_id
├─ status: startup | active | shutdown
└─ created_at (timestamp кожного event)
```

**⚠️ НЕ ЧІПАЙТЕ структуру без міграцій!**

---

### Security Layers (КРИТИЧНО!)

**8 рівнів захисту:**

```
1. Hardware Fingerprinting     → прив'язка до ПК (неможливо копіювати)
2. AES-256 Encryption          → файл ліцензії зашифрований
3. PBKDF2 Key Derivation       → ключ базується на fingerprint
4. Grace Period (7 днів)       → offline підтримка
5. Server Validation           → remote control
6. API Key Protection          → захист dashboard operations
7. HMAC Signatures (опціонально) → захист від підробки
8. Rate Limiting               → захист від brute-force

Поточний рейтинг: 8/10 (з налаштуванням HMAC+Upstash → 9/10)
```

**⚠️ НЕ ВИДАЛЯЙТЕ жоден layer - кожен важливий!**

---

## 🚀 ПРОЦЕС ЗАВАНТАЖЕННЯ ПЛАГІНА

### Детальний покроковий flow:

**Швидка версія (з ліцензією):**
```
1. SketchUp завантажує proGran3.rb (~700ms)
2. Створюється menu + toolbar
3. Користувач клікає → Splash screen (~200ms)
4. Progress animation (2 сек)
5. License validation локально (~250ms)
6. Main UI показується (~800ms)
7. Activity Tracker запускається (~500ms)
8. Готово! (~4 сек загалом)
```

**Повна версія (без ліцензії):**
```
1-4. Те саме (~3 сек)
5. License не знайдена
6. License UI показується (~300ms)
7. Користувач вводить email + key (~5-10 сек)
8. Activation через server (~2.5 сек)
9. Main UI показується (~800ms)
10. Activity Tracker запускається (~500ms)
11. Готово! (~10-15 сек загалом)
```

**Критичні точки:**
- Hardware Fingerprint генерація (~100ms) - КРИТИЧНО
- License file decryption (~200ms) - КРИТИЧНО
- Server communication (~500-2000ms) - з fallback (grace period)
- Activity startup event (~500ms) - async, не блокує

**Детальний опис:** `PLUGIN_STARTUP_FLOW.md` (повний timeline з кожним кроком)

---

# 2. ARCHITECTURE

## 🏗️ Загальна архітектура

```
┌────────────────────────────────────────────────────────────┐
│                     SKETCHUP PLUGIN                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   UI Layer   │  │   Security   │  │    Builders     │  │
│  │              │  │              │  │                 │  │
│  │ • Splash     │  │ • License    │  │ • Foundation    │  │
│  │ • License UI │  │ • Fingerprint│  │ • Tiling        │  │
│  │ • Main UI    │  │ • Storage    │  │ • Fence         │  │
│  │ • Activity   │  │ • API Client │  │ • Cladding      │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────────────┘  │
│         │                 │                                │
│         └─────────────────┼────────────────────────────────┤
│                           │ HTTPS (REST API)               │
└───────────────────────────┼────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────┐
│                    VERCEL SERVER (Next.js)                 │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │   API Routes   │  │   Middleware   │  │  Dashboard   │ │
│  │                │  │                │  │              │ │
│  │ • /licenses/*  │  │ • CORS         │  │ • Stats      │ │
│  │ • /heartbeats  │  │ • Headers      │  │ • License    │ │
│  │ • /systems     │  │ • HMAC check   │  │ • Systems    │ │
│  │ • /dashboard   │  │ • Rate limit   │  │ • Monitor    │ │
│  └────────┬───────┘  └────────────────┘  └──────────────┘ │
│           │                                                │
│  ┌────────▼────────────────────────────────────────────┐  │
│  │              Supabase Client                        │  │
│  └────────┬────────────────────────────────────────────┘  │
└───────────┼─────────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────────┐
│                SUPABASE (PostgreSQL)                        │
│  ┌─────────┐  ┌─────────┐  ┌──────────────┐  ┌──────────┐ │
│  │licenses │→ │  users  │  │ system_infos │  │heartbeats│ │
│  └─────────┘  └─────────┘  └──────────────┘  └──────────┘ │
│  RLS Enabled | Service Role | Indexes Optimized           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Структура проекту

### Критичні директорії:

```
ProGran3/
├── server/                          # Next.js server
│   ├── app/
│   │   ├── api/                     # 7 API endpoints (CORE)
│   │   │   ├── licenses/            # CRUD + generate + activate + validate
│   │   │   ├── heartbeats/          # Activity tracking
│   │   │   ├── systems/             # System monitoring
│   │   │   └── dashboard/stats/     # Statistics
│   │   ├── components/              # Dashboard UI
│   │   │   ├── Dashboard.tsx        # Main dashboard
│   │   │   ├── LicenseManager.tsx   # License CRUD
│   │   │   └── SystemMonitor.tsx    # Activity monitor (ENHANCED)
│   │   └── hooks/                   # React hooks
│   │
│   └── lib/                         # Utilities (КРИТИЧНО!)
│       ├── supabase.ts              # DB client
│       ├── api-handler.ts           # Request wrapper
│       ├── api-response.ts          # Response helpers
│       ├── auth.ts                  # API Key validation
│       ├── hmac.ts                  # HMAC signatures (NEW)
│       ├── rate-limit.ts            # Rate limiting (NEW)
│       ├── cache.ts                 # Response caching
│       ├── query-optimizer.ts       # DB optimization
│       └── validation/schemas.ts    # Zod validation
│
├── plugin/
│   ├── proGran3.rb                  # Entry point
│   └── proGran3/
│       ├── security/                # License system (CORE)
│       │   ├── hardware_fingerprint.rb    # SHA256 fingerprint
│       │   ├── license_storage.rb         # AES-256 encryption
│       │   ├── api_client.rb              # HTTP client (UPDATED)
│       │   ├── license_manager.rb         # Main controller
│       │   └── TEST_*.rb                  # 5 test scripts
│       │
│       ├── activity_tracker.rb      # Activity monitoring (NEW)
│       ├── builders/                # Geometry builders
│       │   ├── foundation_builder.rb
│       │   ├── tiling_builder.rb
│       │   ├── fence_builder.rb
│       │   ├── cladding_builder.rb
│       │   └── blind_area_builder.rb
│       │
│       ├── ui.rb                    # Main UI dialog
│       ├── splash_screen.rb         # Startup + validation
│       ├── license_ui.rb            # Activation UI
│       ├── callback_manager.rb      # All callbacks (1,310 lines)
│       ├── coordination_manager.rb  # Element coordination
│       ├── model_state_manager.rb   # State management
│       │
│       └── web/                     # Web UI
│           ├── index.html
│           ├── script.js
│           ├── modules/             # 16 JS modules
│           ├── css/                 # 3 CSS files
│           └── i18n/                # UK/PL/EN translations
│
└── vercel.json                      # Vercel config (КРИТИЧНО!)
```

---

## 🔑 Ключові модулі

### Plugin (Ruby):

**1. Security Layer** (найважливіший)
```ruby
hardware_fingerprint.rb  # Генерує унікальний PC ID
license_storage.rb       # Шифрує/дешифрує ліцензію
api_client.rb            # HTTP комунікація з сервером
license_manager.rb       # Координує всю security логіку
```

**2. Activity Tracking** (моніторинг)
```ruby
activity_tracker.rb      # Startup events + periodic heartbeats
```

**3. UI Layer** (користувацький інтерфейс)
```ruby
ui.rb              # Main UI (HtmlDialog)
splash_screen.rb   # Startup + license validation
license_ui.rb      # License activation form
```

**4. Business Logic** (функціональність)
```ruby
callback_manager.rb      # Всі UI callbacks (1,310 lines)
coordination_manager.rb  # Координація елементів моделі
builders/*.rb            # Створення геометрії
```

---

### Server (TypeScript):

**1. API Endpoints** (core functionality)
```typescript
/api/licenses/activate   # Активація ліцензії (PUBLIC)
/api/licenses/validate   # Валідація ліцензії (PUBLIC)
/api/licenses/generate   # Генерація (API KEY required)
/api/licenses/[id]       # CRUD operations
/api/heartbeats          # Activity tracking
/api/systems             # System info
/api/dashboard/stats     # Statistics (API KEY required)
```

**2. Security Middleware**
```typescript
lib/auth.ts         # API Key validation
lib/hmac.ts         # HMAC signature verification
lib/rate-limit.ts   # Brute-force protection
middleware.ts       # CORS + Security headers
```

**3. Database Layer**
```typescript
lib/supabase.ts           # Supabase client
lib/query-optimizer.ts    # Parallel queries
lib/cache.ts              # Response caching
```

---

# 3. DEVELOPMENT

## 🔧 Setup (перший раз)

### Prerequisites:
```bash
Node.js 18+
Ruby 2.7+ (вбудований в SketchUp)
SketchUp 2020+
Vercel CLI (для deploy)
Git
```

### Server Setup:
```bash
# 1. Clone repo
git clone <repo-url>
cd ProGran3/server

# 2. Install dependencies
npm install

# 3. Configure env
cp env.template .env.local
# Відредагуйте .env.local з credentials

# 4. Run dev server
npm run dev
# → http://localhost:3000

# 5. Test build
npm run build
```

### Plugin Setup:
```bash
# 1. Скопіюйте в SketchUp Plugins:
C:/Users/[USER]/AppData/Roaming/SketchUp/SketchUp 2024/SketchUp/Plugins/
├── proGran3.rb
└── proGran3/ (вся директорія)

# 2. Перезапустіть SketchUp

# 3. Тест:
# SketchUp → Plugins → proGran3 Конструктор
```

---

## 💻 Робота з кодом

### Git Workflow:

```bash
# Завжди працюйте з dev
git checkout dev
git pull origin dev

# Створіть feature branch
git checkout -b feature/your-feature-name

# Після завершення
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name

# Створіть PR: feature → dev
# Після review: merge в dev
# Deploy з dev гілки
```

**⚠️ НІКОЛИ не push --force в main/dev без дозволу!**

---

### Код стандарти:

**TypeScript:**
```typescript
// Завжди типізація
interface MyData {
  field: string;
}

// Zod validation для всіх inputs
const schema = z.object({...});

// Використовуйте api-response helpers
return apiSuccess(data, 'message');
return apiError('error', 400);

// Try-catch everywhere
try {
  // код
} catch (error) {
  console.error('[Context] Error:', error);
  return apiError(error as Error);
}
```

**Ruby:**
```ruby
# Модулі, не класи
module ProGran3
  module MyModule
    extend self
    
    def my_method
      # код
    end
  end
end

# Error handling
begin
  # код
rescue => e
  puts "❌ Помилка: #{e.message}"
  ErrorHandler.handle_error(e, context, action)
end

# Логування
puts "✅ Success message"
puts "⚠️ Warning message"
puts "❌ Error message"
```

---

## 🔐 Security Development

### Додавання нового захищеного endpoint:

```typescript
// server/app/api/my-endpoint/route.ts
import { requireApiKey } from '@/lib/auth';
import { withPublicApi } from '@/lib/api-handler';
import { apiSuccess, apiError } from '@/lib/api-response';
import { verifyHMAC, isHMACEnabled } from '@/lib/hmac';
import { checkRateLimit } from '@/lib/rate-limit';

const handler = withPublicApi(async ({ supabase, request }) => {
  try {
    // 1. HMAC (якщо налаштовано)
    if (isHMACEnabled()) {
      const signature = request.headers.get('X-Signature');
      const timestamp = request.headers.get('X-Timestamp');
      
      if (!signature || !timestamp) {
        return apiError('HMAC signature required', 401);
      }
      
      const body = await request.text();
      const hmacResult = verifyHMAC(body, parseInt(timestamp), signature);
      
      if (!hmacResult.valid) {
        return apiError(`Invalid HMAC: ${hmacResult.error}`, 401);
      }
      
      // @ts-ignore
      request.json = async () => JSON.parse(body);
    }
    
    // 2. Rate Limiting
    const emailLimit = await checkRateLimit('endpoint:email:...', 'activate');
    if (!emailLimit.allowed) {
      return apiError('Too many requests', 429);
    }
    
    // 3. Валідація
    const body = await request.json();
    // ... validation з Zod
    
    // 4. Логіка
    // ... ваш код
    
    return apiSuccess(data);
    
  } catch (error) {
    return apiError(error as Error);
  }
});

// Якщо потрібен API Key:
export const POST = requireApiKey(handler);

// Якщо public:
export const POST = handler;
```

---

### Додавання нового security модуля (Plugin):

```ruby
# plugin/proGran3/security/my_module.rb
module ProGran3
  module Security
    module MyModule
      extend self
      
      def my_secure_method
        # 1. Перевірка fingerprint
        fp = HardwareFingerprint.generate[:fingerprint]
        
        # 2. Перевірка ліцензії
        license = LicenseStorage.load
        return { success: false } unless license
        
        # 3. Ваша логіка
        # ...
        
        { success: true, data: result }
      rescue => e
        { success: false, error: e.message }
      end
    end
  end
end
```

---

## 🎨 UI Development

### Додавання нового UI елемента:

**1. HTML** (`web/index.html`):
```html
<div id="my-section" class="section">
  <h3>My Section</h3>
  <div id="my-content"></div>
</div>
```

**2. CSS** (`web/css/components.css`):
```css
#my-section {
  /* стилі */
}
```

**3. JavaScript** (`web/modules/my-module.js`):
```javascript
(function(global) {
  'use strict';
  
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.MyModule = {
    init: function() {
      // ініціалізація
    }
  };
  
})(window);
```

**4. Ruby callback** (`callback_manager.rb`):
```ruby
def my_callback(dialog, param1, param2)
  # Валідація
  return false unless validate_params(param1, param2)
  
  # Логіка
  result = do_something(param1, param2)
  
  # Оновлення UI
  dialog.execute_script("updateUI(#{result.to_json})")
  
  result[:success]
end
```

**5. Реєстрація** (`ui.rb`):
```ruby
@dialog.add_action_callback("my_action") do |d, p1, p2|
  CallbackManager.my_callback(d, p1, p2)
end
```

---

# 4. DEPLOYMENT

## 🚀 Production Deployment

### Checklist перед deploy:

```bash
# 1. Тести пройшли?
cd server
npm run build  # Має бути успішно

# 2. Env vars налаштовані?
# Vercel → Settings → Environment Variables
# Перевірте всі обов'язкові змінні

# 3. Git committed?
git status  # Має бути clean або committed

# 4. Deploy
vercel --prod --yes

# 5. Перевірка
curl https://[new-url]/api/licenses
# Має повернути JSON з ліцензіями
```

---

### Post-Deploy (ОБОВ'ЯЗКОВО!):

**1. Оновити URL в plugin:**
```ruby
# plugin/proGran3/security/api_client.rb (рядок 14)
API_BASE_URL = 'https://server-[new-id]-provis3ds-projects.vercel.app'.freeze
```

**2. Redeploy plugin:**
```bash
# Скопіюйте оновлений файл в SketchUp Plugins
# Перезапустіть SketchUp
```

**3. Тест:**
```ruby
# Ruby Console:
load 'C:/Users/.../proGran3/security/TEST_STEP_3.rb'  # API Client test
# Має показати успішне підключення до нового URL
```

---

### Vercel Configuration:

**vercel.json:**
```json
{
  "buildCommand": "cd server && npm run build",
  "outputDirectory": "server/.next",
  "installCommand": "cd server && npm install",
  "framework": "nextjs"
}
```

**⚠️ НЕ МІНЯЙТЕ** без потреби - це працює!

**Deployment Protection:**
- **OFF** для Production (плагін не може пройти Vercel SSO)
- АБО: Protection Bypass для `/api/*`

---

# 5. TESTING

## 🧪 Automated Tests

### Plugin Tests (Ruby):

**Запуск в SketchUp Ruby Console:**

```ruby
# Hardware Fingerprint
load 'C:/Users/ProVis3D/Desktop/ProGran3/plugin/proGran3/security/TEST_STEP_1.rb'

# License Storage
load '.../TEST_STEP_2.rb'

# API Client
load '.../TEST_STEP_3.rb'

# License Manager
load '.../TEST_STEP_4.rb'

# Integration
load '.../TEST_STEP_5_INTEGRATION.rb'

# Activity Tracking (NEW)
load '.../TEST_ACTIVITY_TRACKING.rb'

# Rate Limiting (NEW)
load '.../TEST_RATE_LIMIT.rb'

# HMAC (NEW)
load '.../TEST_HMAC.rb'
```

**Всі тести мають закінчуватись "✅ ТЕСТИ ПРОЙДЕНО"**

---

### Server Tests (manual):

```bash
# Build test
cd server
npm run build
# → Має бути успішно

# API tests
curl https://[url]/api/licenses
# → { "success": true, "data": [...] }

curl -X POST https://[url]/api/licenses/generate \
  -H "X-API-Key: [key]" \
  -H "Content-Type: application/json" \
  -d '{"duration_days": 30}'
# → { "success": true, "data": {...} }
```

---

## 🐛 Debugging

### Plugin (Ruby):

**Логи:**
```ruby
# Завжди використовуйте puts з емодзі
puts "✅ Success"
puts "⚠️ Warning"
puts "❌ Error"
puts "📊 Info"

# Ruby Console показує всі puts
```

**Breakpoints:**
```ruby
# Додайте для зупинки:
debugger  # (якщо є Ruby debugger)

# Або просто:
puts "DEBUG: #{variable.inspect}"
```

**Error Handling:**
```ruby
begin
  # код
rescue => e
  puts "❌ Exception: #{e.message}"
  puts e.backtrace.first(5)  # Перші 5 рядків stack trace
end
```

---

### Server (TypeScript):

**Логи:**
```typescript
console.log('[Context] Message:', data);
console.warn('[Context] Warning:', warning);
console.error('[Context] Error:', error);
```

**Vercel Logs:**
```bash
# Real-time logs:
vercel logs --prod --follow

# Specific deployment:
vercel inspect [deployment-url] --logs
```

**Local Debugging:**
```bash
npm run dev
# → http://localhost:3000
# Console показує всі console.log
```

---

# 6. REFERENCE

## 📖 API Documentation

### License Lifecycle:

```
1. Generate (Dashboard)
   POST /api/licenses/generate
   → status: "generated"
   
2. Activate (Plugin)
   POST /api/licenses/activate
   → status: "active"
   → Прив'язує fingerprint
   → Створює system_info
   
3. Validate (Plugin при старті)
   POST /api/licenses/validate
   → Перевіряє: active, не expired, fingerprint match
   → Оновлює last_seen
   
4. Heartbeat (Plugin кожні 10 хв)
   POST /api/heartbeats
   → Оновлює last_seen
   → Зберігає activity events
```

---

### Endpoints Reference:

#### POST /api/licenses/activate

**Public endpoint** (plugin може викликати)

**Request:**
```json
{
  "license_key": "PROGRAN3-2025-ABC123-XYZ789",
  "user_email": "user@example.com",
  "system_fingerprint": "a1b2c3d4e5f6...(64 chars SHA256)"
}
```

**Headers (опціонально):**
```
X-Signature: [HMAC підпис]  # Якщо HMAC налаштовано
X-Timestamp: [unix timestamp]
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "license_id": "uuid",
    "license_key": "PROGRAN3-...",
    "user_email": "user@example.com",
    "activated_at": "2025-10-17T10:00:00Z",
    "expires_at": "2025-11-16T10:00:00Z",
    "status": "active"
  }
}
```

**Errors:**
```json
400 - Invalid key або вже активована
429 - Rate limit (> 5 спроб/хв з того самого email)
401 - Invalid HMAC (якщо HMAC налаштовано)
```

**Security:**
- Rate limiting: 5 req/min per email, 100 req/min per IP
- HMAC: опціонально (якщо HMAC_SECRET_KEY налаштовано)

---

#### POST /api/licenses/validate

**Public endpoint**

**Request:**
```json
{
  "license_key": "PROGRAN3-...",
  "system_fingerprint": "a1b2c3d4e5f6..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "license_id": "uuid",
    "status": "active",
    "expires_at": "2025-11-16T10:00:00Z",
    "fingerprint_match": true
  }
}
```

**Errors:**
```json
404 - License not found
403 - License not active / expired / fingerprint mismatch
429 - Rate limit (> 30 спроб/хв з того самого key)
```

**Security:**
- Rate limiting: 30 req/min per key, 100 req/min per IP
- HMAC: опціонально

---

#### POST /api/licenses/generate

**Protected endpoint** (API Key required)

**Headers:**
```
X-API-Key: c5a768b83ceaf3eea4987d8c8eb059daf328e21ed5f204bb75ac48c901b3893e
```

**Request:**
```json
{
  "duration_days": 30,
  "description": "Test license"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "license_key": "PROGRAN3-2025-...",
    "duration_days": 30,
    "status": "generated"
  }
}
```

**Errors:**
```json
401 - Missing або invalid API Key
400 - Invalid duration_days (має бути 1-3650)
```

---

#### POST /api/heartbeats

**Public endpoint** (для activity tracking)

**Request:**
```json
{
  "license_key": "PROGRAN3-...",
  "system_fingerprint": "a1b2c3...",
  "event_type": "startup|heartbeat|shutdown",
  "plugin_version": "1.0.0",
  "session_start": "2025-10-17T10:00:00Z",
  "session_duration": 3600,
  "sketchup_version": "24.0.553",
  "platform": "Windows",
  "timestamp": 1729177200
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "active",
    "last_seen": "2025-10-17T11:00:00Z"
  }
}
```

**Використання:**
- Startup: відправляється при завантаженні плагіна
- Heartbeat: кожні 10 хвилин автоматично
- Shutdown: при закритті (опціонально)

---

## 🗄️ Database Queries

### Корисні запити:

**Active users зараз:**
```sql
SELECT COUNT(*)
FROM system_infos
WHERE last_seen > NOW() - INTERVAL '15 minutes';
```

**Licenses по статусу:**
```sql
SELECT 
  status,
  COUNT(*) as count
FROM licenses
GROUP BY status;
```

**Неактивні ліцензії (> 30 днів):**
```sql
SELECT 
  l.license_key,
  u.email,
  s.last_seen
FROM licenses l
JOIN users u ON l.user_id = u.id
LEFT JOIN system_infos s ON l.id = s.license_id
WHERE l.status = 'active'
  AND (s.last_seen < NOW() - INTERVAL '30 days' OR s.last_seen IS NULL);
```

**Activity по годинах (сьогодні):**
```sql
SELECT 
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as events
FROM heartbeats
WHERE DATE(created_at) = CURRENT_DATE
  AND status = 'startup'
GROUP BY hour
ORDER BY hour;
```

---

## 🔧 Common Tasks

### Task 1: Генерація ліцензії

```typescript
// Dashboard → License Manager → Generate
// АБО через API:

const response = await fetch('/api/licenses/generate', {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.NEXT_PUBLIC_ADMIN_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    duration_days: 365,
    description: 'Annual license for premium user'
  })
});

const data = await response.json();
// data.data.license_key → відправити користувачу
```

---

### Task 2: Деактивація ліцензії

```sql
-- В Supabase або через Dashboard:
UPDATE licenses 
SET status = 'revoked', 
    updated_at = NOW()
WHERE license_key = 'PROGRAN3-...';

-- Автоматично через CASCADE видаляє system_infos та heartbeats
```

---

### Task 3: Перенесення ліцензії на інший ПК

```sql
-- 1. Видалити старий fingerprint binding:
DELETE FROM system_infos 
WHERE license_id = (SELECT id FROM licenses WHERE license_key = '...');

-- 2. Користувач активує знову з новим fingerprint
-- Автоматично створить новий system_info
```

---

### Task 4: Подовження ліцензії

```sql
-- Додати ще 30 днів:
UPDATE licenses 
SET expires_at = expires_at + INTERVAL '30 days',
    updated_at = NOW()
WHERE license_key = 'PROGRAN3-...';
```

---

## 🆘 Troubleshooting

### "Vercel deployment failed"

**Перевірте:**
1. `npm run build` локально → має бути успішно
2. Env vars в Vercel → всі обов'язкові є?
3. `vercel.json` → правильна конфігурація?
4. Logs: `vercel logs --prod`

---

### "License activation failed"

**Перевірте:**
1. License існує в БД? Status = "generated"?
2. Server URL правильний в `api_client.rb`?
3. Deployment Protection вимкнено для `/api/*`?
4. Internet connection є?
5. Logs в Ruby Console → що конкретно?

---

### "Hardware mismatch"

**Це НЕ помилка - це захист!**
- Ліцензія прив'язана до іншого ПК
- Треба деактивувати на старому ПК або видалити system_info в БД

---

### "Rate limit exceeded"

**Це працює як задумано!**
- Зачекайте 60 секунд
- Або змініть ліміти в `server/lib/rate-limit.ts`

---

### "HMAC signature invalid"

**Перевірте:**
1. `HMAC_SECRET_KEY` в Vercel env vars
2. `SECRET_KEY` в `api_client.rb` (рядок 23)
3. Ключі ТОЧНО однакові (64 символи)
4. Vercel redeploy після додавання env vars

---

## 🔐 Security Best Practices

### DO:
- ✅ Завжди валідуйте inputs (Zod на server, Ruby validation на plugin)
- ✅ Використовуйте env vars для secrets
- ✅ Логуйте всі security events
- ✅ Rate limit всі публічні endpoints
- ✅ Перевіряйте fingerprint при кожній валідації
- ✅ Використовуйте HTTPS (автоматично на Vercel)

### DON'T:
- ❌ НЕ hardcode API keys в коді
- ❌ НЕ пропускайте валідацію inputs
- ❌ НЕ ігноруйте errors (завжди handle)
- ❌ НЕ зберігайте паролі в plaintext
- ❌ НЕ видаляйте існуючі security layers

---

## 📊 Performance Optimization

### Вже оптимізовано:

```typescript
// Parallel queries
const [licenses, users] = await Promise.all([
  supabase.from('licenses').select(),
  supabase.from('users').select()
]);

// Response caching
return cachedApiSuccess(data, 'short');  // 1-min cache

// Database indexes (створені)
CREATE INDEX idx_licenses_key ON licenses(license_key);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_system_infos_fingerprint ON system_infos(fingerprint_hash);
```

**⚠️ НЕ оптимізуйте без benchmark - працює швидко!**

---

## 🔄 Activity Tracking

### Як працює:

```
1. Plugin завантажується
   ↓
2. activity_tracker.rb автоматично запускається (через 5 сек)
   ↓
3. Відправляє startup event → server
   {
     event_type: "startup",
     session_start: "2025-10-17T10:00:00Z",
     plugin_version: "1.0.0",
     ...
   }
   ↓
4. Server зберігає в system_infos.system_data
   last_seen = now
   system_data.last_startup = now
   ↓
5. Кожні 10 хвилин: heartbeat event
   session_duration += 600
   ↓
6. Dashboard показує в real-time:
   "Активна зараз" (зелений badge)
   "Сесія: 45хв"
```

### Налаштування:

**Інтервал heartbeat:**
```ruby
# activity_tracker.rb (рядок 6)
HEARTBEAT_INTERVAL = 600  # 10 хвилин (рекомендовано)
```

**Dashboard auto-refresh:**
```typescript
// SystemMonitor.tsx (рядок 30)
}, 30000);  // 30 секунд
```

---

## 🎯 Important Code Locations

### Критичні файли які ТРЕБА знати:

**Security:**
```
plugin/proGran3/security/license_manager.rb    # Головний контролер
plugin/proGran3/security/api_client.rb         # HTTP клієнт (+ URL тут!)
server/lib/auth.ts                             # API Key validation
server/lib/hmac.ts                             # HMAC verification
server/lib/rate-limit.ts                       # Rate limiting
```

**API Endpoints:**
```
server/app/api/licenses/activate/route.ts      # Активація
server/app/api/licenses/validate/route.ts      # Валідація
server/app/api/heartbeats/route.ts             # Activity tracking
```

**UI:**
```
plugin/proGran3/ui.rb                          # Main UI
plugin/proGran3/splash_screen.rb               # Startup + validation
plugin/proGran3/callback_manager.rb            # Всі UI callbacks
server/app/components/SystemMonitor.tsx        # Activity dashboard
```

**Configuration:**
```
vercel.json                                    # Vercel config
server/package.json                            # Dependencies
plugin/proGran3/config.rb                      # Plugin config
```

---

## 📚 Code Examples

### Example 1: Додавання нового builder

```ruby
# plugin/proGran3/builders/my_builder.rb
module ProGran3
  module MyBuilder
    extend self
    
    def create(param1, param2)
      model = Sketchup.active_model
      entities = model.active_entities
      
      # 1. Validation
      return false unless validate_params(param1, param2)
      
      # 2. Start operation
      model.start_operation('Create My Element', true)
      
      begin
        # 3. Create geometry
        # ... ваш код створення геометрії
        
        # 4. Commit
        model.commit_operation
        true
        
      rescue => e
        # 5. Rollback on error
        model.abort_operation
        ErrorHandler.handle_error(e, 'MyBuilder', 'create')
        false
      end
    end
  end
end
```

**Інтеграція:**
```ruby
# callback_manager.rb
def add_my_element_callback(dialog, param1, param2)
  success = MyBuilder.create(param1, param2)
  
  if success
    ModelStateManager.component_added(:my_element, {p1: param1, p2: param2})
  end
  
  success
end

# ui.rb
@dialog.add_action_callback("add_my_element") do |d, p1, p2|
  CallbackManager.add_my_element_callback(d, p1, p2)
end
```

---

### Example 2: Додавання нового API endpoint

```typescript
// server/app/api/my-endpoint/route.ts
import { withPublicApi, ApiContext } from '@/lib/api-handler';
import { apiSuccess, apiError, apiValidationError } from '@/lib/api-response';
import { requireApiKey } from '@/lib/auth';
import { z } from 'zod';

// Schema
const MySchema = z.object({
  field: z.string().min(1),
  number: z.number().int().positive()
});

// Handler
const handler = withPublicApi(async ({ supabase, request }: ApiContext) => {
  try {
    // 1. Parse body
    const body = await request.json();
    
    // 2. Validate
    const validated = MySchema.parse(body);
    
    // 3. Database query
    const { data, error } = await supabase
      .from('my_table')
      .insert(validated)
      .select()
      .single();
    
    if (error) throw error;
    
    // 4. Return
    return apiSuccess(data, 'Created successfully');
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiValidationError(error.issues);
    }
    return apiError(error as Error);
  }
});

// Export з або без API Key
export const POST = requireApiKey(handler);  // Protected
// або
export const POST = handler;  // Public
```

---

### Example 3: HMAC підписи (Plugin → Server)

**Plugin side:**
```ruby
# Вже реалізовано в api_client.rb
# Просто увімкніть:

# api_client.rb (рядок 23)
SECRET_KEY = 'your-64-char-hex-key'  # Той самий що на сервері

# Всі post_request автоматично додають HMAC headers
```

**Server side:**
```typescript
// Вже інтегровано в activate/validate
// Просто додайте env var:

// Vercel env vars
HMAC_SECRET_KEY=your-64-char-hex-key

// Готово! HMAC автоматично перевіряється
```

---

## 📈 Monitoring & Analytics

### Dashboard Metrics:

**Вже доступно:**
```typescript
GET /api/dashboard/stats

Response:
{
  "totalLicenses": 50,
  "activeLicenses": 40,
  "generatedLicenses": 5,
  "expiredLicenses": 5,
  "totalUsers": 35,
  "activeSystemsNow": 12  // < 15 хв
}
```

**System Monitor:**
- Real-time activity status
- Session duration
- Plugin versions distribution
- Platform distribution
- Last startup time

---

### Готово до analytics (треба тільки UI):

**Active users timeline:**
```sql
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(DISTINCT system_info_id) as active_users
FROM heartbeats
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND status = 'startup'
GROUP BY hour
ORDER BY hour;
```

**Avg session duration:**
```sql
SELECT 
  AVG((system_data->>'session_duration')::int) / 60 as avg_minutes
FROM system_infos
WHERE system_data->>'session_duration' IS NOT NULL;
```

---

## 🔐 Security Configuration Matrix

### Configuration States:

| Upstash | HMAC | Security | Rate Limiting | Використання |
|---------|------|----------|---------------|--------------|
| ❌ | ❌ | 8/10 | Simple (in-memory) | Розробка |
| ✅ | ❌ | 8.5/10 | Production (Redis) | Рекомендовано |
| ❌ | ✅ | 8.5/10 | Simple | Можливо |
| ✅ | ✅ | 9/10 | Production | **Максимум** ⭐ |

**Налаштування:** `docs/development/HMAC_RATELIMIT_SETUP.md` (25 хв)

---

## 🗂️ File Organization

### Що НЕ треба чіпати:

```
✋ plugin/proGran3/assets/         # SKP моделі компонентів
✋ plugin/proGran3/previews/        # Згенеровані thumbnails
✋ server/.next/                     # Build output
✋ server/node_modules/              # Dependencies
✋ .vercel/                          # Vercel config
```

### Що можна міняти:

```
✅ plugin/proGran3/*.rb             # Plugin логіка
✅ plugin/proGran3/web/*            # UI файли
✅ server/app/                      # Server код
✅ server/lib/                      # Utilities
✅ docs/                            # Документація
```

---

## 📞 Quick Commands

### Development:
```bash
# Server dev
cd server && npm run dev              # http://localhost:3000

# Server build
cd server && npm run build            # Production build

# Plugin reload (SketchUp Ruby Console)
load 'C:/Users/.../proGran3.rb'      # Reload plugin
```

### Deployment:
```bash
# Deploy to Vercel
vercel --prod --yes                  # Production

# View logs
vercel logs --prod --follow          # Real-time

# Inspect deployment
vercel inspect [url] --logs          # Specific deployment
```

### Testing:
```bash
# Server
npm run build                        # Build test

# Plugin (Ruby Console)
load '.../TEST_ACTIVITY_TRACKING.rb' # Activity test
load '.../TEST_RATE_LIMIT.rb'        # Rate limit test
load '.../TEST_HMAC.rb'               # HMAC test
```

---

## 🎯 Quick Start для нових розробників

### День 1 (Setup):
1. Clone repo
2. Встановити dependencies (`npm install`)
3. Налаштувати `.env.local` (з credentials)
4. Запустити dev server (`npm run dev`)
5. Скопіювати plugin в SketchUp Plugins
6. Протестувати (load тести в Ruby Console)

### День 2 (Розуміння):
1. Прочитати цей файл повністю (1-2 год)
2. Подивитись Database schema в Supabase
3. Прогнати всі тести (TEST_STEP_*.rb)
4. Відкрити Dashboard, подивитись System Monitor

### День 3 (Coding):
1. Вибрати task з backlog
2. Створити feature branch
3. Зробити зміни з дотриманням code standards
4. Протестувати локально
5. Push → PR → Review → Merge → Deploy

---

## 💡 Tips & Tricks

### Plugin Development:

**Швидкий reload без перезапуску SketchUp:**
```ruby
# Ruby Console:
Object.send(:remove_const, :ProGran3) if defined?(ProGran3)
load 'C:/Users/.../proGran3.rb'
ProGran3::UI.show_dialog
```

**Debug mode:**
```ruby
$debug = true  # Увімкнути debug logs
$debug = false # Вимкнути
```

**Check що активно:**
```ruby
ProGran3::ActivityTracker.session_info      # Session info
ProGran3::Security::LicenseManager.new.license_info  # License info
```

---

### Server Development:

**Hot reload:**
```bash
npm run dev  # Автоматично перезавантажується при змінах
```

**Quick DB query:**
```typescript
// В API route:
const { data } = await supabase.from('licenses').select().limit(5);
console.log('Quick check:', data);
```

**Clear cache:**
```typescript
// cache.ts не персистентний - просто redeploy
```

---

## 🚀 Production Checklist

### Pre-Deploy:
- [ ] `npm run build` успішно
- [ ] Всі тести пройшли
- [ ] Env vars налаштовані
- [ ] Git committed
- [ ] Feature branch merged в dev

### Deploy:
- [ ] `vercel --prod --yes`
- [ ] Deployment status: Ready ✅
- [ ] Оновити URL в plugin
- [ ] Redeploy plugin

### Post-Deploy:
- [ ] Протестувати activation
- [ ] Протестувати validation
- [ ] Перевірити Dashboard
- [ ] Перевірити System Monitor
- [ ] Перевірити logs (немає errors)

---

## 📚 External Dependencies

### NPM Packages (Server):
```json
{
  "@supabase/supabase-js": "^2.58.0",    # Database
  "next": "14.0.0",                       # Framework
  "react": "^18",                         # UI
  "zod": "^4.1.12",                       # Validation
  "@upstash/ratelimit": "latest",         # Rate limiting (NEW)
  "@upstash/redis": "latest"              # Redis client (NEW)
}
```

**⚠️ При додаванні нових packages:**
1. `npm install --save [package]`
2. Test build
3. Deploy
4. Оновити цей документ

---

### Ruby Gems (Plugin):

**Built-in в SketchUp:**
- `net/http` - HTTP requests
- `uri` - URL parsing
- `json` - JSON parsing
- `openssl` - Encryption + HMAC
- `digest/sha2` - SHA256 hashing

**⚠️ НЕ МОЖНА** використовувати зовнішні gems - тільки built-in!

---

## 🎓 Learning Resources

### Supabase:
- Docs: https://supabase.com/docs
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security
- Realtime: https://supabase.com/docs/guides/realtime

### Next.js:
- Docs: https://nextjs.org/docs
- App Router: https://nextjs.org/docs/app
- API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

### SketchUp API:
- Ruby API: https://ruby.sketchup.com/
- HtmlDialog: https://ruby.sketchup.com/UI/HtmlDialog.html

### Security:
- HMAC: https://en.wikipedia.org/wiki/HMAC
- Rate Limiting: https://upstash.com/docs/redis/features/ratelimiting
- AES Encryption: https://en.wikipedia.org/wiki/Advanced_Encryption_Standard

---

## ✅ FINAL NOTES

### Версіонування:

**Semantic Versioning:**
```
v3.1.0
  │ │ │
  │ │ └─ Patch (bug fixes)
  │ └─── Minor (нові features, backward compatible)
  └───── Major (breaking changes)
```

**Поточна:** v3.1.0 (Activity Tracking)  
**Наступна:** v3.2.0 (запланована: automated testing)

---

### Known Issues:

1. **Fingerprint не відображається в UI footer** (косметичний)
   - Priority: Low
   - Fix: 30 хв

2. **Upstash + HMAC не налаштовано** (опціонально)
   - Priority: Medium (для 9/10 security)
   - Setup: 25 хв

3. **TODO коментар в licenses/[id]/route.ts** (непотрібний)
   - Priority: Low
   - Fix: видалити рядок 48

---

### Contact:

**Code Issues:** GitHub Issues  
**Security:** Відразу повідомити team lead  
**Questions:** Цей документ → якщо немає відповіді → team chat

---

## 🎯 TL;DR (Коротко)

**Система працює так:**
1. Plugin перевіряє ліцензію при старті (validate)
2. Якщо немає → показує License UI
3. Користувач активує (activate)
4. Ліцензія зберігається зашифровано локально
5. Кожні 10 хв heartbeat → сервер
6. Dashboard показує activity в real-time
7. Grace period: 7 днів offline

**Security:** Hardware binding + AES-256 + Server validation + Rate limiting + HMAC  
**Rating:** 8/10 (можна 9/10 з налаштуванням)

**Production URL:** https://server-qf9qtpsf0-provis3ds-projects.vercel.app

**При проблемах:** Troubleshooting розділ вище або logs (Vercel/Ruby Console)

---

**Document Version:** 1.0  
**Last Updated:** 17 жовтня 2025  
**Maintainer:** ProGran3 Development Team  
**Status:** ✅ PRODUCTION READY

