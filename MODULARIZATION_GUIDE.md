# 📦 Гід по модуляризації ProGran3

## 🎯 Мета
Цей документ описує правильний підхід до модуляризації JavaScript коду в проекті ProGran3 з урахуванням обмежень SketchUp.

---

## ⚠️ **КРИТИЧНЕ ОБМЕЖЕННЯ: ES6 МОДУЛІ НЕ ПРАЦЮЮТЬ В SKETCHUP**

### 🚨 **Проблема:**
- SketchUp використовує **CEF (Chromium Embedded Framework)** з обмеженою підтримкою
- ES6 модулі вимагають протокол `http://` або `https://`
- SketchUp завантажує файли через протокол `file://`
- **CORS обмеження** не дозволяють завантажувати модулі локально

### 🔍 **Докази з коду:**
В `index.html` вже є спроба використання ES6 модулів:
```html
<script type="module" src="src/index.js"></script>  <!-- ❌ НЕ ПРАЦЮЄ -->
<script src="script.js"></script>                   <!-- ✅ ПРАЦЮЄ -->
```

---

## ✅ **ПРАВИЛЬНИЙ ПІДХІД: NAMESPACE PATTERN**

### 🏗️ **Архітектура модулів:**

```
proGran3/web/
├── index.html
├── script.js                    # Головний файл (2800+ рядків)
├── modules/                     # Модульна структура
│   ├── core/
│   │   ├── StateManager.js      # ProGran3.Core.StateManager
│   │   ├── Logger.js           # ProGran3.Core.Logger
│   │   └── Config.js           # ProGran3.Core.Config
│   ├── ui/
│   │   ├── Tabs.js             # ProGran3.UI.Tabs
│   │   ├── Panels.js           # ProGran3.UI.Panels
│   │   └── Carousel.js         # ProGran3.UI.Carousel
│   ├── builders/
│   │   ├── Foundation.js       # ProGran3.Builders.Foundation
│   │   ├── Tiling.js          # ProGran3.Builders.Tiling
│   │   ├── Cladding.js        # ProGran3.Builders.Cladding
│   │   └── BlindArea.js       # ProGran3.Builders.BlindArea
│   ├── communication/
│   │   ├── SketchUpBridge.js  # ProGran3.Communication.SketchUpBridge
│   │   └── Callbacks.js       # ProGran3.Communication.Callbacks
│   └── utils/
│       ├── Units.js           # ProGran3.Utils.Units
│       ├── Validation.js      # ProGran3.Utils.Validation
│       └── Helpers.js         # ProGran3.Utils.Helpers
```

---

## 🔧 **ПАТЕРН РЕАЛІЗАЦІЇ**

### 📝 **Структура модуля:**

```javascript
// modules/core/Logger.js
(function(global) {
  'use strict';
  
  // Створюємо namespace
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.Core = global.ProGran3.Core || {};
  
  // Приватні змінні (інкапсуляція)
  let logLevel = 'info';
  let logHistory = [];
  
  // Приватні функції
  function formatMessage(message, type, context) {
    const timestamp = new Date().toLocaleTimeString();
    return `[${timestamp}] ${type.toUpperCase()}: ${message}`;
  }
  
  function shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[logLevel];
  }
  
  // Публічні функції
  function debugLog(message, type = 'info', context = null) {
    if (!shouldLog(type)) return;
    
    const formattedMessage = formatMessage(message, type, context);
    logHistory.push(formattedMessage);
    
    // Виводимо в консоль
    console.log(formattedMessage);
    
    // Виводимо в UI (якщо є debug-log елемент)
    const debugLogElement = document.getElementById('debug-log');
    if (debugLogElement) {
      const logEntry = document.createElement('div');
      logEntry.className = `log-entry log-${type}`;
      logEntry.textContent = formattedMessage;
      debugLogElement.appendChild(logEntry);
      debugLogElement.scrollTop = debugLogElement.scrollHeight;
    }
  }
  
  function clearDebugLog() {
    logHistory = [];
    const debugLogElement = document.getElementById('debug-log');
    if (debugLogElement) {
      debugLogElement.innerHTML = '<div>🔍 Очікування логів...</div>';
    }
  }
  
  function setLogLevel(level) {
    logLevel = level;
  }
  
  function getLogHistory() {
    return [...logHistory]; // Повертаємо копію
  }
  
  // Експорт публічного API
  global.ProGran3.Core.Logger = {
    debugLog: debugLog,
    clearDebugLog: clearDebugLog,
    setLogLevel: setLogLevel,
    getLogHistory: getLogHistory
  };
  
  // Зворотна сумісність - функції доступні глобально
  global.debugLog = debugLog;
  global.clearDebugLog = clearDebugLog;
  
})(window);
```

---

## 📋 **ПІДКЛЮЧЕННЯ МОДУЛІВ**

### 🔗 **Правильний порядок в HTML:**

```html
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <title>proGran3 Конструктор</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- HTML контент -->
  
  <!-- ✅ Підключаємо модулі в правильному порядку -->
  <!-- 1. Core модулі (залежності) -->
  <script src="modules/core/Config.js"></script>
  <script src="modules/core/Logger.js"></script>
  <script src="modules/core/StateManager.js"></script>
  
  <!-- 2. Utils модулі -->
  <script src="modules/utils/Helpers.js"></script>
  <script src="modules/utils/Validation.js"></script>
  <script src="modules/utils/Units.js"></script>
  
  <!-- 3. Communication модулі -->
  <script src="modules/communication/Callbacks.js"></script>
  <script src="modules/communication/SketchUpBridge.js"></script>
  
  <!-- 4. UI модулі -->
  <script src="modules/ui/Tabs.js"></script>
  <script src="modules/ui/Panels.js"></script>
  <script src="modules/ui/Carousel.js"></script>
  
  <!-- 5. Builder модулі -->
  <script src="modules/builders/Foundation.js"></script>
  <script src="modules/builders/Tiling.js"></script>
  <script src="modules/builders/Cladding.js"></script>
  <script src="modules/builders/BlindArea.js"></script>
  
  <!-- 6. Головний файл в кінці -->
  <script src="script.js"></script>
</body>
</html>
```

---

## 🎯 **ПЕРЕВАГИ NAMESPACE PATTERN**

### ✅ **Для розробки:**
- **Модульність** - код розділений логічно
- **Інкапсуляція** - приватні змінні та функції
- **Зворотна сумісність** - існуючий код не зламається
- **Простота** - не потребує додаткових налаштувань

### ✅ **Для SketchUp:**
- **Працює в CEF** - без проблем з протоколом
- **Глобальна доступність** - функції доступні як раніше
- **Швидке завантаження** - немає затримок на модулі
- **Стабільність** - перевірений підхід

### ✅ **Для підтримки:**
- **Легко знайти код** - чіткі namespace
- **Простий рефакторинг** - зміни в одному місці
- **Кращий IntelliSense** - IDE розуміє структуру
- **Документація** - зрозуміла архітектура

---

## 🚀 **ПЛАН МІГРАЦІЇ**

### 📅 **Етап 1: Підготовка (1-2 години)**
- [ ] Створити структуру папок `modules/`
- [ ] Налаштувати базові файли
- [ ] Створити шаблон модуля

### 📅 **Етап 2: Core модулі (2-3 години)**
- [ ] `StateManager.js` - глобальний стан
- [ ] `Logger.js` - система логування
- [ ] `Config.js` - конфігурація

### 📅 **Етап 3: Utils модулі (1-2 години)**
- [ ] `Units.js` - система одиниць
- [ ] `Validation.js` - валідація
- [ ] `Helpers.js` - допоміжні функції

### 📅 **Етап 4: UI модулі (3-4 години)**
- [ ] `Tabs.js` - система табів
- [ ] `Panels.js` - панелі
- [ ] `Carousel.js` - каруселі

### 📅 **Етап 5: Builder модулі (2-3 години)**
- [ ] `Foundation.js` - фундамент
- [ ] `Tiling.js` - плитка
- [ ] `Cladding.js` - облицювання
- [ ] `BlindArea.js` - відмостка

### 📅 **Етап 6: Communication модулі (2-3 години)**
- [ ] `SketchUpBridge.js` - зв'язок з SketchUp
- [ ] `Callbacks.js` - система колбеків

### 📅 **Етап 7: Інтеграція (2-3 години)**
- [ ] Оновити `index.html`
- [ ] Налаштувати порядок підключення
- [ ] Тестування
- [ ] Очищення `script.js`

---

## 🔍 **ПРИКЛАДИ ВИКОРИСТАННЯ**

### 📝 **До модуляризації:**
```javascript
// В script.js (2800+ рядків)
function debugLog(message, type = 'info') {
  // 50+ рядків коду
}

function changeUnit(newUnit) {
  // 100+ рядків коду
}

function switchTab(tabName) {
  // 80+ рядків коду
}
```

### 📝 **Після модуляризації:**
```javascript
// modules/core/Logger.js
ProGran3.Core.Logger.debugLog('Повідомлення', 'info');

// modules/utils/Units.js
ProGran3.Utils.Units.changeUnit('cm');

// modules/ui/Tabs.js
ProGran3.UI.Tabs.switchTab('monument');

// Зворотна сумісність
debugLog('Повідомлення', 'info');  // ✅ Працює як раніше
changeUnit('cm');                   // ✅ Працює як раніше
switchTab('monument');              // ✅ Працює як раніше
```

---

## ⚠️ **ВАЖЛИВІ ПРАВИЛА**

### ❌ **НЕ РОБИТИ:**
- Використовувати ES6 модулі (`import`/`export`)
- Підключати модулі з `type="module"`
- Використовувати `require()` (Node.js)
- Порушувати порядок підключення

### ✅ **ОБОВ'ЯЗКОВО:**
- Використовувати IIFE (Immediately Invoked Function Expression)
- Створювати namespace `ProGran3.*`
- Експортувати функції в глобальний scope
- Зберігати зворотну сумісність
- Підключати модулі в правильному порядку

---

## 🧪 **ТЕСТУВАННЯ**

### 🔍 **Перевірка роботи:**
```javascript
// Перевіряємо namespace
console.log(ProGran3.Core.Logger);        // ✅ Має бути об'єкт
console.log(ProGran3.Utils.Units);        // ✅ Має бути об'єкт
console.log(ProGran3.UI.Tabs);            // ✅ Має бути об'єкт

// Перевіряємо зворотну сумісність
console.log(typeof debugLog);             // ✅ Має бути 'function'
console.log(typeof changeUnit);           // ✅ Має бути 'function'
console.log(typeof switchTab);            // ✅ Має бути 'function'

// Тестуємо функціональність
debugLog('Тест модуляризації', 'info');   // ✅ Має працювати
changeUnit('cm');                         // ✅ Має працювати
switchTab('monument');                    // ✅ Має працювати
```

---

## 📚 **ДОДАТКОВІ РЕСУРСИ**

### 🔗 **Корисні посилання:**
- [IIFE Pattern](https://developer.mozilla.org/en-US/docs/Glossary/IIFE)
- [Namespace Pattern](https://addyosmani.com/blog/essential-js-namespacing/)
- [SketchUp CEF Limitations](https://forums.sketchup.com/t/htmldialog-cef-support-for-es-modules/219349)

### 📖 **Документація проекту:**
- [ARCHITECTURE.md](ARCHITECTURE.md) - загальна архітектура
- [ARCHITECTURE_README.md](ARCHITECTURE_README.md) - швидкий старт
- [ARCHITECTURE_CHECKLIST.md](ARCHITECTURE_CHECKLIST.md) - контрольний список

---

## 🎯 **ВИСНОВОК**

**Namespace Pattern** - це оптимальне рішення для модуляризації JavaScript коду в SketchUp:

1. **✅ Працює** в CEF без проблем
2. **✅ Модульний** - код розділений логічно
3. **✅ Сумісний** - існуючий код не зламається
4. **✅ Простий** - не потребує додаткових налаштувань
5. **✅ Ефективний** - швидке завантаження та виконання

**Час реалізації:** 12-18 годин  
**Складність:** Середня  
**Пріоритет:** Високий  

---

*Останнє оновлення: 2024-12-19*  
*Версія: 1.0*  
*Автор: ProGran3 Development Team*  
*Статус: Готово до реалізації*
