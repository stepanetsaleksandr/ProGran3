# 📊 Activity Tracking System - Професійний моніторинг

**Дата:** 17 жовтня 2025  
**Версія:** 1.0  
**Статус:** ✅ РЕАЛІЗОВАНО

---

## 🎯 ЩО ЦЕ ТАКЕ?

**Activity Tracking** - професійна система моніторингу активності плагіна в реальному часі.

### Що відстежується:

```
📍 Startup Events      - коли користувач запустив плагін
💓 Periodic Heartbeats - що плагін активний (кожні 10 хв)
🕒 Session Duration    - скільки часу користувач працює
📦 Plugin Version      - яку версію плагіна використовує
💻 System Info         - SketchUp version, платформа
⏱️ Last Activity       - коли востаннє був активний
```

---

## 🏗️ АРХІТЕКТУРА

```
┌─────────────────────────────────────────────────┐
│           PLUGIN (SketchUp)                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  При завантаженні:                              │
│  ├─ Startup event → сервер                      │
│  └─ Запуск heartbeat timer (10 хв)              │
│                                                 │
│  Кожні 10 хвилин:                               │
│  └─ Heartbeat event → сервер                    │
│                                                 │
│  При закритті (опціонально):                    │
│  └─ Shutdown event → сервер                     │
│                                                 │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS
      ┌────────────▼────────────┐
      │    SERVER (Vercel)      │
      ├─────────────────────────┤
      │                         │
      │  POST /api/heartbeats   │
      │  ├─ event_type          │
      │  ├─ plugin_version      │
      │  ├─ session_start       │
      │  ├─ session_duration    │
      │  └─ system_data         │
      │                         │
      │  ↓ Зберігає в БД        │
      │                         │
      │  system_infos:          │
      │  ├─ last_seen           │
      │  ├─ system_data {       │
      │  │   plugin_version     │
      │  │   sketchup_version   │
      │  │   platform           │
      │  │   session_start      │
      │  │   session_duration   │
      │  │   last_startup       │
      │  └─ }                   │
      │                         │
      │  heartbeats:            │
      │  └─ timestamp records   │
      │                         │
      └────────┬────────────────┘
               │
      ┌────────▼────────────┐
      │   DASHBOARD         │
      ├─────────────────────┤
      │                     │
      │  System Monitor:    │
      │  ├─ User email      │
      │  ├─ PC ID           │
      │  ├─ Plugin version  │
      │  ├─ Last active     │
      │  ├─ Session time    │
      │  └─ Status badge    │
      │                     │
      └─────────────────────┘
```

---

## 📦 КОМПОНЕНТИ

### Plugin (Ruby):

#### 1. activity_tracker.rb (новий модуль)

**Локація:** `plugin/proGran3/activity_tracker.rb`

**Функції:**
```ruby
ProGran3::ActivityTracker.start_tracking   # Запуск відстеження
ProGran3::ActivityTracker.stop_tracking    # Зупинка
ProGran3::ActivityTracker.force_heartbeat  # Примусовий heartbeat
ProGran3::ActivityTracker.session_info     # Інформація про сесію
```

**Що робить:**
- Відправляє startup event при завантаженні
- Запускає heartbeat timer (кожні 10 хв)
- Відслідковує тривалість сесії
- Відправляє shutdown event (опціонально)

**Інтеграція:**
```ruby
# Автоматично викликається в proGran3.rb:
ProGran3.start_tracking  # При відкритті UI
```

---

#### 2. api_client.rb (оновлено)

**Що додано:**
- Підтримка додаткових полів heartbeat (event_type, plugin_version, session_*)
- HMAC підписи для всіх запитів
- Silent mode для heartbeat (не спамити console)

---

### Server (TypeScript):

#### 1. /api/heartbeats (оновлено)

**Endpoint:** `POST /api/heartbeats`

**Приймає:**
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

**Зберігає:**
- `system_infos.last_seen` - час останнього heartbeat
- `system_infos.system_data` - детальна інформація
- `heartbeats` table - історія всіх events

---

#### 2. SystemMonitor.tsx (покращено)

**Компонент:** `server/app/components/SystemMonitor.tsx`

**Що показує:**
- Email користувача
- PC ID (fingerprint)
- Plugin version
- Platform + SketchUp version
- Остання активність (відносний час)
- Тривалість сесії
- Статус активності (з кольоровим badge)

**Features:**
- Auto-refresh кожні 30 секунд
- Відносний час ("5 хв тому", "2 год тому")
- Статус badges з анімацією
- Детальна інформація в кожному рядку

**Статуси активності:**
```
Активна зараз      - < 15 хв   (зелений, pulse)
Активна нещодавно  - < 1 год   (синій)
Активна сьогодні   - < 24 год  (жовтий)
Неактивна          - > 24 год  (червоний)
```

---

## 🔧 НАЛАШТУВАННЯ

### Інтервал Heartbeat:

**Файл:** `plugin/proGran3/activity_tracker.rb`

```ruby
# Рядок 6:
HEARTBEAT_INTERVAL = 600  # секунд (10 хвилин)
```

**Рекомендації:**
- **5 хв** (300s) - часті оновлення, більше навантаження
- **10 хв** (600s) - оптимально (рекомендовано)
- **15 хв** (900s) - рідкі оновлення, менше навантаження

---

### Auto-refresh Dashboard:

**Файл:** `server/app/components/SystemMonitor.tsx`

```typescript
// Рядок 30:
const interval = setInterval(() => {
  if (autoRefresh) {
    fetchSystems();
  }
}, 30000); // 30 секунд
```

**Можна змінити:**
- `15000` - кожні 15 секунд
- `30000` - кожні 30 секунд (рекомендовано)
- `60000` - кожну хвилину

---

## 📊 ЩО ЗБЕРІГАЄТЬСЯ В БД

### Таблиця: system_infos

```sql
system_infos {
  id: UUID
  license_id: UUID
  fingerprint_hash: VARCHAR(64)
  last_seen: TIMESTAMP  ← Оновлюється при кожному heartbeat
  system_data: JSONB {
    -- Базова інформація
    plugin_version: "1.0.0"
    sketchup_version: "24.0.553"
    platform: "Windows"
    
    -- Activity tracking
    last_heartbeat: 1729177200
    last_startup: "2025-10-17T10:00:00Z"
    event_type: "heartbeat|startup|shutdown"
    
    -- Session info
    session_start: "2025-10-17T10:00:00Z"
    session_duration: 3600  // секунд
    
    updated_at: "2025-10-17T11:00:00Z"
  }
  created_at: TIMESTAMP
}
```

---

### Таблиця: heartbeats

```sql
heartbeats {
  id: UUID
  license_id: UUID
  system_info_id: UUID
  status: VARCHAR  ← "startup", "active", "shutdown"
  created_at: TIMESTAMP
}
```

**Призначення:** Історія всіх heartbeat events (для analytics)

---

## 📈 ВИКОРИСТАННЯ ДАНИХ

### В Dashboard:

**System Monitor показує:**
- Скільки користувачів активні зараз
- Коли користувач востаннє використовував плагін
- Як довго триває поточна сесія
- Які версії плагіна використовуються
- На яких платформах (Windows/Mac)

**Analytics (майбутнє):**
- Графік активності по годинах
- Середня тривалість сесій
- Retention rate (скільки повертаються)
- Popular SketchUp versions

---

### Приклади запитів:

#### Активні користувачі (< 15 хв):
```sql
SELECT COUNT(*) 
FROM system_infos 
WHERE last_seen > NOW() - INTERVAL '15 minutes';
```

#### Середня тривалість сесій:
```sql
SELECT AVG((system_data->>'session_duration')::int) / 60 as avg_session_minutes
FROM system_infos 
WHERE system_data->>'session_duration' IS NOT NULL;
```

#### Популярні версії плагіна:
```sql
SELECT 
  system_data->>'plugin_version' as version,
  COUNT(*) as count
FROM system_infos 
GROUP BY version
ORDER BY count DESC;
```

---

## 🧪 ТЕСТУВАННЯ

### Тест 1: Startup Event

```ruby
# SketchUp Ruby Console:
require_relative 'C:/Users/ProVis3D/Desktop/ProGran3/plugin/proGran3/activity_tracker.rb'
ProGran3::ActivityTracker.start_tracking
```

**Очікується:**
```
📊 Запуск Activity Tracker...
   📤 Відправка startup event...
   ✅ Startup event відправлено
   ⏱️ Heartbeat timer запущено
   ✅ Activity Tracker запущено
   📍 Session start: 2025-10-17 10:00:00
   ⏱️ Heartbeat interval: 600s (10 хв)
```

**В Dashboard:**
- System Monitor → з'явиться новий запис
- Status: "Активна зараз" (зелений)
- Plugin Version: "1.0.0"
- Last Activity: "Щойно"

---

### Тест 2: Periodic Heartbeat

```ruby
# Зачекайте 10 хвилин або примусово:
ProGran3::ActivityTracker.force_heartbeat
```

**Очікується:**
```
💓 Heartbeat відправлено (session: 15хв)
```

**В Dashboard:**
- Last Activity оновиться
- Session Duration оновиться
- Status: "Активна зараз"

---

### Тест 3: Session Info

```ruby
# Перевірка поточної сесії:
info = ProGran3::ActivityTracker.session_info
puts info.inspect
```

**Очікується:**
```ruby
{
  enabled: true,
  session_start: 2025-10-17 10:00:00,
  session_duration: 900,  # 15 хвилин в секундах
  last_heartbeat: 2025-10-17 10:15:00,
  heartbeat_interval: 600,
  plugin_version: "1.0.0"
}
```

---

## 📊 DASHBOARD FEATURES

### System Monitor покращення:

**Було (старий):**
```
Fingerprint | License Key | Last Active | Status
a1b2c3...  | PROGRAN3-... | 10/17 10:00 | Активна
```

**Стало (новий):**
```
Користувач / Система     | Версія | Остання активність    | Статус
user@test.com           | 1.0.0  | 5 хв тому            | [Активна зараз]
PC: a1b2c3...           |        | 17.10.2025 10:00     |
Windows | SketchUp 24   | Старт: | Сесія: 45хв          |
                        | 15 хв  |                      |
```

**Покращення:**
- Показує email користувача
- Версія плагіна
- Відносний час ("5 хв тому")
- Тривалість сесії
- Кольорові badges з анімацією
- Auto-refresh кожні 30 сек

---

## 💡 ПЕРЕВАГИ

### Для бізнесу:

✅ **Active Users Tracking**
- Скільки користувачів активні зараз
- Які години найбільш активні
- Retention rate

✅ **Version Adoption**
- Скільки користувачів оновились
- Які версії популярні
- Коли можна deprecate старі версії

✅ **Support Insights**
- На яких платформах проблеми
- Які версії SketchUp підтримувати
- Коли користувач востаннє був активний (для support requests)

✅ **License Utilization**
- Чи використовується ліцензія
- Чи варто продовжувати
- Dead licenses (не використовуються > 30 днів)

---

### Для користувачів:

✅ **Прозорість**
- Видно що плагін працює
- Статус ліцензії актуальний

✅ **Offline Support**
- Heartbeat не блокує роботу
- Працює в background
- При offline - просто не відправляє (grace period працює)

✅ **Privacy**
- Не збираємо персональні дані
- Тільки технічна інформація
- Fingerprint - анонімний hash

---

## 🔧 НАЛАШТУВАННЯ

### Увімкнення/вимкнення:

**За замовчуванням:** Увімкнено автоматично при старті плагіна

**Вимкнути:**
```ruby
# В proGran3.rb або в Ruby Console:
ProGran3::ActivityTracker.stop_tracking
```

**Увімкнути знову:**
```ruby
ProGran3::ActivityTracker.start_tracking
```

**Перевірка статусу:**
```ruby
ProGran3::ActivityTracker.tracking_enabled?  # true/false
```

---

### Privacy Mode (якщо потрібен):

**Опція 1: Вимкнути повністю**
```ruby
# В activity_tracker.rb, рядок 25:
# Закоментуйте start_tracking:
# def start_tracking
#   return  # Disabled
# end
```

**Опція 2: Тільки startup events (без periodic)**
```ruby
# В activity_tracker.rb:
# Закоментуйте start_heartbeat_timer в методі start_tracking
```

**Опція 3: Більший інтервал**
```ruby
# Змініть HEARTBEAT_INTERVAL:
HEARTBEAT_INTERVAL = 1800  # 30 хвилин замість 10
```

---

## 📈 ANALYTICS (майбутнє)

### Можливі покращення:

#### 1. Activity Dashboard
```
График активності:
   100 |     *
    75 |    **  *
    50 |   *  ****
    25 |  *      **
     0 |_*________**___
       00:00   12:00   24:00
```

#### 2. Session Analytics
```
Середня тривалість сесії: 45 хв
Найдовша сесія: 3 год 20 хв
Всього сесій сьогодні: 24
```

#### 3. Version Distribution
```
v1.0.0: █████████ 45%
v0.9.5: ████ 20%
v0.9.0: ███ 15%
Інші:   ████ 20%
```

#### 4. Platform Stats
```
Windows: 80%
Mac:     15%
Linux:   5%
```

---

## 🎯 USE CASES

### Use Case 1: Support Request

**Сценарій:**
Користувач пише: "Плагін не працює вже 2 дні"

**Перевірка в Dashboard:**
```
System Monitor → знайти email
Last Active: 10 днів тому
Status: Неактивна

→ Користувач не запускав плагін 10 днів
→ Проблема не в плагіні, а в тому що він не запускає
```

---

### Use Case 2: License Renewal

**Сценарій:**
Ліцензія закінчується через тиждень

**Перевірка активності:**
```
Last Active: 2 години тому
Status: Активна зараз
Session Duration: 3 години

→ Користувач активно використовує
→ Швидше за все продовжить ліцензію
→ Відправити reminder email
```

vs

```
Last Active: 25 днів тому
Status: Неактивна

→ Користувач не використовує
→ Навіщо продовжувати?
→ Можна не відправляти reminder
```

---

### Use Case 3: Version Adoption

**Сценарій:**
Випущена нова версія 1.1.0

**Перевірка в Dashboard:**
```
v1.1.0: 5 користувачів (10%)
v1.0.0: 45 користувачів (90%)

→ Adoption повільний
→ Можливо треба нагадати про оновлення
→ Або є проблеми з новою версією
```

---

## 🔒 PRIVACY & SECURITY

### Що НЕ збираємо:
- ❌ Імена файлів користувача
- ❌ Геолокацію
- ❌ Скриншоти
- ❌ Персональні дані (крім email)

### Що збираємо:
- ✅ Технічна інформація (plugin version, platform)
- ✅ Часові мітки (коли активний)
- ✅ Session duration (як довго працює)
- ✅ Fingerprint (анонімний hash)

### GDPR Compliance:
- ✅ Мінімальні дані
- ✅ Тільки необхідна інформація
- ✅ Можна вимкнути
- ✅ Дані видаляються разом з ліцензією (CASCADE)

---

## 🎉 РЕЗУЛЬТАТ

**Що отримали:**

✅ **Професійний моніторинг активності**
- Startup events
- Periodic heartbeats (10 хв)
- Session tracking
- Version tracking

✅ **Покращений Dashboard**
- Real-time status
- Детальна інформація
- Auto-refresh
- Красиві badges

✅ **Analytics Ready**
- Всі дані збираються
- Готово для майбутніх графіків
- Історія в heartbeats table

✅ **Privacy Friendly**
- Мінімальні дані
- Можна вимкнути
- GDPR compliant

**Security:** Без змін (8-9/10)  
**UX:** Не впливає (працює в background)  
**Business Value:** Високий (insights для decisions)

---

## 📚 ФАЙЛИ

**Plugin:**
- `plugin/proGran3/activity_tracker.rb` - Головний модуль
- `plugin/proGran3.rb` - Інтеграція
- `plugin/proGran3/security/api_client.rb` - Оновлено для heartbeat
- `plugin/proGran3/security/TEST_ACTIVITY_TRACKING.rb` - Тести (новий)

**Server:**
- `server/app/api/heartbeats/route.ts` - Оновлено
- `server/app/components/SystemMonitor.tsx` - Повністю перероблено
- `server/app/api/systems/route.ts` - Без змін (працює)

**Документація:**
- `docs/development/ACTIVITY_TRACKING_SYSTEM.md` - Цей файл
- `IMPLEMENTATION_SUMMARY_ACTIVITY_TRACKING.md` - Summary

---

**Дата:** 17 жовтня 2025  
**Версія:** 1.0  
**Статус:** ✅ ГОТОВО ДО ВИКОРИСТАННЯ

