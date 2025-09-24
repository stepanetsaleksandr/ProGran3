# 🔧 ГІД ВІДНОВЛЕННЯ СИСТЕМИ ProGran3

## 📋 ЗМІСТ
1. [Загальна архітектура](#загальна-архітектура)
2. [Структура файлів](#структура-файлів)
3. [Ключові модулі](#ключові-модулі)
4. [API та комунікація](#api-та-комунікація)
5. [База даних](#база-даних)
6. [Конфігурація](#конфігурація)
7. [Деплой](#деплой)
8. [Відновлення](#відновлення)

---

## 🏗️ ЗАГАЛЬНА АРХІТЕКТУРА

### Архітектурні шари:
```
┌─────────────────────────────────────────┐
│              FRONTEND (JavaScript)      │
│  ┌─────────────┬─────────────────────┐  │
│  │   UI Layer  │   Business Logic    │  │
│  │   (Tabs,    │   (StateManager,    │  │
│  │  Panels)    │    Validation)      │  │
│  └─────────────┴─────────────────────┘  │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│            SKETCHUP BRIDGE              │
│         (JavaScript ↔ Ruby)             │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│              BACKEND (Ruby)             │
│  ┌─────────────┬─────────────────────┐  │
│  │   Core      │   Builders          │  │
│  │   (Model,   │   (Foundation,      │  │
│  │  Loader)    │    Tiling, etc)     │  │
│  └─────────────┴─────────────────────┘  │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│              SERVER (Next.js)           │
│  ┌─────────────┬─────────────────────┐  │
│  │   API       │   Database          │  │
│  │   (Heartbeat│   (Supabase)        │  │
│  │    Plugins) │                     │  │
│  └─────────────┴─────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 📁 СТРУКТУРА ФАЙЛІВ

```
ProGran3/
├── plugin/                              # SketchUp Plugin
│   ├── proGran3.rb                      # Головний модуль (802 рядки)
│   ├── deploy_simple.bat                # Скрипт деплою
│   └── proGran3/                        # Основний код
│       ├── assets/                      # 3D компоненти
│       │   ├── stands/                  # Підставки
│       │   ├── steles/                  # Стели
│       │   ├── flowerbeds/              # Квітники
│       │   ├── gravestones/             # Надгробні плити
│       │   ├── lamps/                   # Лампадки
│       │   ├── fence_decor/             # Декор огорожі
│       │   └── pavement_tiles/          # Плитка
│       ├── builders/                    # Будівельники компонентів
│       │   ├── foundation_builder.rb    # Фундамент
│       │   ├── blind_area_builder.rb    # Відмостка
│       │   ├── cladding_builder.rb      # Облицювання
│       │   ├── fence_builder.rb         # Огорожа
│       │   └── tiling_builder.rb        # Плитка
│       ├── carousel/                    # Система каруселей
│       │   ├── carousel_manager.rb      # Менеджер каруселей
│       │   └── carousel_ui.rb           # UI каруселей
│       ├── security/                    # Система безпеки
│       │   ├── anti_tampering.rb        # Захист від модифікації
│       │   ├── crypto_utils.rb          # Криптографічні утиліти
│       │   ├── integrity_checker.rb     # Перевірка цілісності
│       │   ├── license_manager.rb       # Менеджер ліцензій
│       │   ├── security_manager.rb      # Головний менеджер безпеки
│       │   └── security_monitor.rb      # Моніторинг безпеки
│       ├── web/                         # Frontend
│       │   ├── index.html               # Головна сторінка
│       │   ├── script.js                # Основний скрипт (2800+ рядків)
│       │   ├── style.css                # Стилі
│       │   ├── blocking-functions.js    # Функції блокування
│       │   ├── css/                     # Стилі
│       │   │   ├── base.css
│       │   │   ├── components.css
│       │   │   └── layout.css
│       │   ├── i18n/                    # Інтернаціоналізація
│       │   │   ├── I18nManager.js
│       │   │   └── locales/
│       │   │       ├── en.json
│       │   │       ├── pl.json
│       │   │       └── uk.json
│       │   └── modules/                 # Модульна структура
│       │       ├── core/                # Основні модулі
│       │       │   ├── Config.js        # Конфігурація
│       │       │   ├── DebugManager.js  # Менеджер налагодження
│       │       │   ├── GlobalState.js   # Глобальний стан
│       │       │   ├── I18nManager.js   # Менеджер локалізації
│       │       │   ├── Logger.js        # Система логування
│       │       │   └── StateManager.js  # Менеджер стану
│       │       ├── communication/       # Комунікація
│       │       │   └── SketchUpBridge.js # Міст з SketchUp
│       │       ├── ui/                  # UI модулі
│       │       │   ├── AccordionManager.js # Менеджер акордеонів
│       │       │   ├── LanguageSwitcher.js # Перемикач мови
│       │       │   ├── Panels.js        # Панелі
│       │       │   ├── SummaryTable.js  # Таблиця підсумків
│       │       │   └── Tabs.js          # Таби
│       │       ├── utils/               # Утиліти
│       │       │   ├── Helpers.js       # Допоміжні функції
│       │       │   └── Validation.js    # Валідація
│       │       └── builders/            # Будівельники
│       │           └── FoundationBuilder.js # Будівельник фундаменту
│       ├── callback_manager.rb          # Менеджер callback'ів
│       ├── constants.rb                 # Константи
│       ├── coordination_manager.rb      # Координаційний менеджер
│       ├── dimensions_manager.rb        # Менеджер розмірів
│       ├── error_handler.rb             # Обробка помилок
│       ├── loader.rb                    # Завантажувач (1295 рядків)
│       ├── logger.rb                    # Система логування
│       ├── model_state_manager.rb       # Менеджер стану моделі (672 рядки)
│       ├── skp_preview_extractor.rb     # Генератор превью
│       ├── ui.rb                        # UI менеджер
│       └── validation.rb                # Валідація
├── server/                              # Серверна частина
│   ├── src/                             # Вихідний код
│   │   ├── app/                         # Next.js App Router
│   │   │   ├── api/                     # API endpoints
│   │   │   │   ├── heartbeat/           # Heartbeat API
│   │   │   │   │   └── route.ts         # POST /api/heartbeat
│   │   │   │   ├── init/                # Ініціалізація
│   │   │   │   │   └── route.ts         # GET /api/init
│   │   │   │   ├── plugins/             # Плагіни API
│   │   │   │   │   ├── route.ts         # GET /api/plugins
│   │   │   │   │   ├── block/           # Блокування
│   │   │   │   │   │   └── route.ts     # POST /api/plugins/block
│   │   │   │   │   └── check-email/     # Перевірка email
│   │   │   │   │       └── route.ts     # POST /api/plugins/check-email
│   │   │   │   └── license/             # Ліцензійна система
│   │   │   │       ├── activate/        # Активація ліцензії
│   │   │   │       ├── generate/        # Генерація ліцензії
│   │   │   │       ├── types/           # Типи ліцензій
│   │   │   │       └── validate/        # Валідація ліцензії
│   │   │   ├── admin/                   # Адмін панель
│   │   │   │   └── licenses/            # Управління ліцензіями
│   │   │   │       └── page.tsx
│   │   │   ├── dashboard/               # Dashboard
│   │   │   │   └── page.tsx             # Головна сторінка
│   │   │   ├── globals.css              # Глобальні стилі
│   │   │   ├── layout.tsx               # Основний layout
│   │   │   └── page.tsx                 # Головна сторінка
│   │   └── lib/                         # Бібліотеки
│   │       ├── database.ts              # Робота з БД
│   │       ├── license-generator.ts     # Генератор ліцензій
│   │       └── types.ts                 # TypeScript типи
│   ├── migrations/                      # Міграції БД
│   │   ├── 003_create_all_tables.sql    # Створення таблиць
│   │   ├── 004_add_mac_address.sql      # Додавання MAC адреси
│   │   └── 005_remove_mac_address.sql   # Видалення MAC адреси
│   ├── package.json                     # Залежності
│   ├── next.config.js                   # Конфігурація Next.js
│   ├── tailwind.config.js               # Конфігурація Tailwind
│   └── tsconfig.json                    # Конфігурація TypeScript
├── docs/                                # Документація
│   ├── ACTION_PLAN.md                   # План дій
│   ├── ARCHITECTURE.md                  # Архітектура
│   ├── ARCHITECTURE_DIAGRAMS.md         # Діаграми архітектури
│   ├── LICENSE_SYSTEM_PLAN.md           # План ліцензійної системи
│   └── SERVER_INTEGRATION.md            # Інтеграція сервера
├── DEVELOPMENT_LOG.md                   # Лог розробки
├── README.md                            # Головний README
├── SERVER_INTEGRATION.md                # Інтеграція сервера
└── vercel.json                          # Конфігурація Vercel
```

---

## 🔧 КЛЮЧОВІ МОДУЛІ

### 1. Головний модуль (`proGran3.rb`)
```ruby
module ProGran3
  # Основні константи
  PLUGIN_VERSION = "1.0.0"
  PLUGIN_NAME = "ProGran3"
  
  # Головні методи:
  # - initialize_tracker() - ініціалізація трекера
  # - start_tracking() - запуск відстеження
  # - stop_tracking() - зупинка відстеження
  # - send_heartbeat() - відправка heartbeat
  # - check_blocking_status() - перевірка статусу блокування
end
```

### 2. Model State Manager (`model_state_manager.rb`)
```ruby
class ModelStateManager
  # Управління станом моделі SketchUp
  # - component_added() - додавання компонента
  # - component_removed() - видалення компонента
  # - save_state_before_update() - збереження стану
  # - restore_state_after_update() - відновлення стану
  # - can_add_component?() - перевірка можливості додавання
end
```

### 3. UI Manager (`ui.rb`)
```ruby
class UI
  # Управління UI SketchUp
  # - show_dialog() - показ діалогу
  # - register_callbacks() - реєстрація callback'ів
  # - generate_web_preview() - генерація превью
  # - add_blocking_status_callback() - callback блокування
end
```

### 4. Loader (`loader.rb`)
```ruby
class Loader
  # Завантаження компонентів SketchUp
  # - insert_component() - вставка компонента
  # - load_skp_file() - завантаження .skp файлу
  # - cleanup_component() - очищення компонента
end
```

### 5. Validation (`validation.rb`)
```ruby
module Validation
  # Валідація даних
  # - validate_dimensions() - валідація розмірів
  # - validate_file() - валідація файлів
  # - validate_component_data() - валідація даних компонента
end
```

### 6. Error Handler (`error_handler.rb`)
```ruby
module ErrorHandler
  # Обробка помилок
  # - handle_error() - обробка помилки
  # - safe_execute() - безпечне виконання
  # - show_user_friendly_error() - показ помилки користувачу
end
```

---

## 🌐 API ТА КОМУНІКАЦІЯ

### Frontend (JavaScript)
```javascript
// Namespace Pattern для сумісності з SketchUp CEF
(function(global) {
  'use strict';
  
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.Core = global.ProGran3.Core || {};
  
  // Модулі:
  // - ProGran3.Core.Config - конфігурація
  // - ProGran3.Core.Logger - логування
  // - ProGran3.Core.StateManager - управління станом
  // - ProGran3.Utils.Validation - валідація
  // - ProGran3.Communication.SketchUpBridge - міст з SketchUp
  
})(window);
```

### SketchUp Bridge
```javascript
// Комунікація між JavaScript та Ruby
window.sketchup = {
  add_foundation: function(depth, width, height) { /* ... */ },
  add_tiles: function(mode, seam) { /* ... */ },
  generate_web_preview: function(component_path) { /* ... */ },
  ready: function() { /* ... */ }
};
```

### Server API
```typescript
// POST /api/heartbeat
interface HeartbeatRequest {
  plugin_id: string;
  plugin_name: string;
  version: string;
  user_id: string;
  computer_name: string;
  system_info: object;
  timestamp: string;
  action: string;
  source: string;
  update_existing: boolean;
  force_update: boolean;
}

// GET /api/plugins
interface PluginsResponse {
  success: boolean;
  data: {
    plugins: PluginRecord[];
    stats: PluginStats;
    last_updated: string;
  };
}
```

---

## 🗄️ БАЗА ДАНИХ

### Supabase Tables
```sql
-- Таблиця плагінів
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
  is_active BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Індекси
CREATE INDEX idx_plugins_plugin_id ON plugins(plugin_id);
CREATE INDEX idx_plugins_last_heartbeat ON plugins(last_heartbeat);
CREATE INDEX idx_plugins_is_active ON plugins(is_active);
CREATE INDEX idx_plugins_is_blocked ON plugins(is_blocked);
```

### Database Functions
```typescript
// database.ts
export async function upsertPlugin(data: any, ipAddress: string): Promise<UpsertResult>
export async function getAllPlugins(): Promise<PluginRecord[]>
export async function markPluginInactive(pluginId: string): Promise<UpsertResult>
export async function deletePlugin(pluginId: string): Promise<boolean>
export async function blockPlugin(pluginId: string): Promise<boolean>
export async function unblockPlugin(pluginId: string): Promise<boolean>
```

---

## ⚙️ КОНФІГУРАЦІЯ

### Plugin Configuration
```ruby
# constants.rb
module ProGran3
  module Constants
    PLUGIN_ROOT = File.dirname(File.dirname(__FILE__))
    ASSETS_PATH = File.join(PLUGIN_ROOT, 'assets')
    WEB_PATH = File.join(PLUGIN_ROOT, 'proGran3', 'web')
    
    DEFAULT_PREVIEW_SIZE = 256
    MAX_PREVIEW_SIZE = 512
    MIN_PREVIEW_SIZE = 64
    
    SUPPORTED_UNITS = [:mm, :cm]
    DEFAULT_UNIT = :mm
    
    DEFAULT_DIALOG_WIDTH = 500
    DEFAULT_DIALOG_HEIGHT = 850
  end
end
```

### Server Configuration
```typescript
// next.config.js
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    STORAGE_SUPABASE_URL: process.env.STORAGE_SUPABASE_URL,
    STORAGE_SUPABASE_SERVICE_ROLE_KEY: process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY,
  },
}
```

### Environment Variables
```env
# .env.local
STORAGE_SUPABASE_URL=https://your-project.supabase.co
STORAGE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
```

---

## 🚀 ДЕПЛОЙ

### Plugin Deploy
```batch
REM deploy_simple.bat
@echo off
echo Deploying ProGran3 Plugin...

REM Copy files to SketchUp Plugins directory
xcopy /E /I /Y "proGran3" "%APPDATA%\SketchUp\SketchUp 2024\SketchUp\Plugins\progran3"

echo Plugin deployed successfully!
pause
```

### Server Deploy (Vercel)
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "env": {
    "STORAGE_SUPABASE_URL": "@storage_supabase_url",
    "STORAGE_SUPABASE_SERVICE_ROLE_KEY": "@storage_supabase_service_role_key"
  }
}
```

### Deploy Commands
```bash
# Plugin
cd plugin
./deploy_simple.bat

# Server
cd server
npm run build
vercel --prod
```

---

## 🔄 ВІДНОВЛЕННЯ

### 1. Відновлення Plugin
```bash
# 1. Створити структуру папок
mkdir -p plugin/proGran3/{assets,builders,carousel,security,web/{css,i18n,modules/{core,communication,ui,utils,builders}}}

# 2. Відновити основні файли
# - proGran3.rb (802 рядки)
# - ui.rb
# - loader.rb (1295 рядків)
# - model_state_manager.rb (672 рядки)
# - constants.rb
# - validation.rb
# - error_handler.rb
# - logger.rb

# 3. Відновити builders
# - foundation_builder.rb
# - blind_area_builder.rb
# - cladding_builder.rb
# - fence_builder.rb
# - tiling_builder.rb

# 4. Відновити web модулі
# - index.html
# - script.js (2800+ рядків)
# - style.css
# - blocking-functions.js
# - modules/*.js (всі модулі)

# 5. Відновити assets
# - Всі .skp файли в assets/
```

### 2. Відновлення Server
```bash
# 1. Створити Next.js проект
npx create-next-app@latest server --typescript --tailwind --app

# 2. Встановити залежності
cd server
npm install @supabase/supabase-js

# 3. Відновити файли
# - src/app/api/heartbeat/route.ts
# - src/app/api/plugins/route.ts
# - src/app/dashboard/page.tsx
# - src/lib/database.ts
# - src/lib/types.ts

# 4. Налаштувати Supabase
# - Створити проект в Supabase
# - Виконати міграції
# - Налаштувати змінні середовища

# 5. Деплой на Vercel
vercel --prod
```

### 3. Відновлення Бази Даних
```sql
-- 1. Створити таблицю plugins
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
  is_active BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Створити індекси
CREATE INDEX idx_plugins_plugin_id ON plugins(plugin_id);
CREATE INDEX idx_plugins_last_heartbeat ON plugins(last_heartbeat);
CREATE INDEX idx_plugins_is_active ON plugins(is_active);
CREATE INDEX idx_plugins_is_blocked ON plugins(is_blocked);
```

---

## 📊 КЛЮЧОВІ ФУНКЦІЇ

### Plugin Functions
```ruby
# Основні функції
ProGran3.initialize_tracker()      # Ініціалізація трекера
ProGran3.start_tracking()          # Запуск відстеження
ProGran3.stop_tracking()           # Зупинка відстеження
ProGran3.send_heartbeat()          # Відправка heartbeat
ProGran3.check_blocking_status()   # Перевірка статусу блокування

# UI функції
UI.show_dialog()                   # Показ діалогу
UI.register_callbacks()            # Реєстрація callback'ів
UI.generate_web_preview()          # Генерація превью

# Builders
FoundationBuilder.create()         # Створення фундаменту
TilingBuilder.create()             # Створення плитки
CladdingBuilder.create()           # Створення облицювання
FenceBuilder.create()              # Створення огорожі
```

### JavaScript Functions
```javascript
// Основні функції
switchTab(tabName)                 # Переключення табів
updateCarouselsInActiveTab()       # Оновлення каруселей
initializeApp()                    # Ініціалізація додатку

// Builders
addFoundation()                    # Додавання фундаменту
addTiles()                         # Додавання плитки
addSideCladding()                  # Додавання облицювання
addFenceCorner()                   # Додавання кутової огорожі

// Preview
generateModelPreview()             # Генерація превью моделі
receiveWebPreview()                # Отримання превью
```

### Server Functions
```typescript
// API Endpoints
POST /api/heartbeat                # Відстеження активності
GET /api/plugins                   # Статистика плагінів
POST /api/plugins/block            # Блокування плагіна
POST /api/plugins/unblock          # Розблокування плагіна

// Database Functions
upsertPlugin()                     # Оновлення/створення плагіна
getAllPlugins()                    # Отримання всіх плагінів
markPluginInactive()               # Позначення як неактивний
blockPlugin()                      # Блокування плагіна
```

---

## 🔒 БЕЗПЕКА

### Security Features
```ruby
# Anti-tampering
ProGran3::Security::AntiTampering.check_integrity()

# Crypto utils
ProGran3::Security::CryptoUtils.encrypt_data()
ProGran3::Security::CryptoUtils.decrypt_data()

# License management
ProGran3::Security::LicenseManager.validate_license()
ProGran3::Security::LicenseManager.generate_license()

# Security monitoring
ProGran3::Security::SecurityMonitor.monitor_activity()
```

### Validation
```ruby
# Валідація розмірів
Validation.validate_dimensions(width, height, thickness)

# Валідація файлів
Validation.validate_file(file_path)

# Валідація компонентів
Validation.validate_component_data(data)
```

---

## 📈 МОНІТОРИНГ

### Heartbeat System
```ruby
# Відправка heartbeat кожні 5 хвилин
def send_heartbeat_with_retry
  data = {
    plugin_id: @plugin_id,
    plugin_name: "ProGran3",
    version: get_plugin_version,
    user_id: get_user_identifier,
    computer_name: Socket.gethostname,
    system_info: get_system_info,
    timestamp: Time.now.iso8601,
    action: "heartbeat_update",
    source: "sketchup_plugin",
    update_existing: true,
    force_update: false
  }
  
  # Відправка до сервера
  response = send_http_request(data)
  
  # Обробка відповіді
  if response[:success]
    handle_heartbeat_response(response)
  else
    handle_heartbeat_error(response)
  end
end
```

### Dashboard
```typescript
// Реальний час моніторингу
const Dashboard = () => {
  const [plugins, setPlugins] = useState<PluginRecord[]>([]);
  const [stats, setStats] = useState<PluginStats | null>(null);
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch('/api/plugins');
      const data = await response.json();
      setPlugins(data.data.plugins);
      setStats(data.data.stats);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      {/* Dashboard UI */}
    </div>
  );
};
```

---

## 🎯 ВИСНОВОК

Цей гід містить всю необхідну інформацію для відновлення системи ProGran3:

1. **Архітектура** - повна структура системи
2. **Файли** - детальний список всіх файлів
3. **Модулі** - опис всіх ключових модулів
4. **API** - всі endpoints та функції
5. **База даних** - структура та міграції
6. **Конфігурація** - всі налаштування
7. **Деплой** - інструкції розгортання
8. **Відновлення** - покрокові інструкції

**З цим гідом можна повністю відновити систему ProGran3!** 🚀
