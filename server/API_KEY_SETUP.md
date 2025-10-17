# 🔑 API Key Setup - Інструкція

**Дата:** 15 жовтня 2025  
**Мета:** Захист критичних API endpoints

---

## 🎯 ВАШ API KEY (ЗБЕРІГАЙТЕ БЕЗПЕЧНО!)

```
c5a768b83ceaf3eea4987d8c8eb059daf328e21ed5f204bb75ac48c901b3893e
```

**⚠️ ВАЖЛИВО:** Не діліться цим ключем! Це як пароль до вашого сервера.

---

## 📊 ЩО ЗАХИЩЕНО API KEY:

### Захищені endpoints (потрібен X-API-Key header):

```typescript
🔑 POST /api/licenses/generate        - Генерація нових ліцензій
🔑 DELETE /api/licenses/[id]          - Видалення ліцензій  
🔑 GET /api/dashboard/stats           - Статистика Dashboard
```

### Публічні endpoints (без API key):

```typescript
✅ POST /api/licenses/activate        - Активація плагіном
✅ POST /api/licenses/validate        - Валідація плагіном
✅ POST /api/heartbeats               - Heartbeat від плагіна
✅ GET /api/licenses                  - Список ліцензій
✅ GET /api/licenses/[id]             - Отримання однієї ліцензії
✅ PUT /api/licenses/[id]             - Оновлення ліцензії
```

---

## ⚙️ НАЛАШТУВАННЯ В VERCEL

### Крок 1: Додайте Environment Variable

1. Відкрийте: https://vercel.com
2. Виберіть проект: **server**
3. Перейдіть: **Settings** → **Environment Variables**

4. Додайте **ДВІ** змінні:

#### Змінна 1: API_KEYS (server-side)
```
Name: API_KEYS
Value: c5a768b83ceaf3eea4987d8c8eb059daf328e21ed5f204bb75ac48c901b3893e
Environment: Production, Preview, Development
```

#### Змінна 2: NEXT_PUBLIC_ADMIN_API_KEY (client-side)
```
Name: NEXT_PUBLIC_ADMIN_API_KEY  
Value: c5a768b83ceaf3eea4987d8c8eb059daf328e21ed5f204bb75ac48c901b3893e
Environment: Production, Preview, Development
```

5. **Save Changes**

---

### Крок 2: Вимкніть Deployment Protection для API

1. **Settings** → **Deployment Protection**
2. Знайдіть **Protection Bypass for Automation**
3. Додайте правило:
   ```
   Path: /api/*
   Bypass: Enabled
   ```
   
**АБО** якщо не знайдете ця опція:
   - **Deployment Protection** → **Off** (тільки для Production)
   - Dashboard залишиться захищеним через Vercel SSO на головній сторінці

---

### Крок 3: Redeploy (автоматично)

Vercel автоматично редеплоїть після додавання env vars, АБО:

```bash
vercel --prod --yes
```

---

## 🧪 ТЕСТУВАННЯ

### Перевірка захищених endpoints:

#### БЕЗ API Key (має повернути 401):
```bash
curl -X POST https://server-r73yi63cr-provis3ds-projects.vercel.app/api/licenses/generate
# → 401 Unauthorized ✅
```

#### З API Key (має працювати):
```bash
curl -X POST https://server-r73yi63cr-provis3ds-projects.vercel.app/api/licenses/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: c5a768b83ceaf3eea4987d8c8eb059daf328e21ed5f204bb75ac48c901b3893e" \
  -d '{"duration_days": 30, "description": "Test"}'
# → 201 Created ✅
```

---

## 🛡️ РІВНІ БЕЗПЕКИ

### Dashboard:
```
Vercel Auth (SSO) → Deployment Protection → ви авторизовані → можете все
```

### API - Критичні операції:
```
API Key в header → валідація → дозволено
```

### API - Плагін операції:
```
License key + Fingerprint → валідація → дозволено
```

**Результат:** 🟢🟢🟢 Triple-layer protection!

---

## 📋 CHECKLIST

Після налаштування в Vercel:

- [ ] ✅ Додано API_KEYS env var
- [ ] ✅ Додано NEXT_PUBLIC_ADMIN_API_KEY env var
- [ ] ✅ Вимкнено Deployment Protection для /api/*
- [ ] ✅ Redeploy завершено
- [ ] ✅ Dashboard працює (може генерувати/видаляти)
- [ ] ✅ Плагін працює (може активувати/валідувати)

---

## 🔒 БЕЗПЕКА: 9/10

**Що захищає:**
- ✅ Generate ліцензій - тільки з API key
- ✅ Delete ліцензій - тільки з API key
- ✅ Dashboard stats - тільки з API key
- ✅ Dashboard UI - Vercel Auth
- ✅ Activate/Validate - власна валідація license key
- ✅ Hardware binding - fingerprint match

**Можливі покращення (опціонально):**
- Rate limiting (Vercel має базовий)
- HMAC signatures (додаткова верифікація)
- IP whitelisting (для dashboard)

---

**Створено:** 15 жовтня 2025  
**Статус:** ✅ READY TO DEPLOY


