# 📦 Модулі ProGran3

## 🎯 **Огляд**

Ця папка містить модулі ProGran3, організовані за **Namespace Pattern** для сумісності з SketchUp CEF.

## ⚠️ **КРИТИЧНЕ ОБМЕЖЕННЯ**

**ES6 модулі (`import`/`export`) НЕ ПРАЦЮЮТЬ в SketchUp!**

SketchUp використовує Chromium Embedded Framework (CEF) з `file://` протоколом, який не підтримує ES6 модулі.

## 🏗️ **Архітектура модулів**

### **Namespace Pattern**
```javascript
(function(global) {
  'use strict';
  
  // Створюємо namespace
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.Core = global.ProGran3.Core || {};
  
  // Публічні функції
  function myFunction() { /* ... */ }
  
  // Експорт
  global.ProGran3.Core.MyModule = { myFunction };
  
  // Зворотна сумісність
  global.myFunction = myFunction;
  
})(window);
```

## 📁 **Структура модулів**

```
modules/
├── core/                    # Основні модулі
│   ├── Config.js           # Конфігурація
│   ├── Logger.js           # Система логування
│   └── StateManager.js     # Управління станом
├── utils/                   # Допоміжні модулі
│   ├── Helpers.js          # Допоміжні функції
│   ├── Validation.js       # Валідація даних
│   └── Units.js            # Одиниці вимірювання
├── communication/           # Комунікація
│   └── SketchUpBridge.js   # Міст з SketchUp
├── ui/                      # UI модулі
│   ├── Tabs.js             # Система табів
│   └── Panels.js           # Система панелей
└── builders/                # Будівельники
    └── FoundationBuilder.js # Будівельник фундаменту
```

## 🔄 **Порядок завантаження**

**КРИТИЧНО:** Модулі повинні завантажуватися в правильному порядку!

```html
<!-- ✅ ПРАВИЛЬНИЙ порядок -->
<!-- 1. Core модулі (залежності) -->
<script src="modules/core/Config.js"></script>
<script src="modules/core/Logger.js"></script>
<script src="modules/core/StateManager.js"></script>

<!-- 2. Utils модулі -->
<script src="modules/utils/Helpers.js"></script>
<script src="modules/utils/Validation.js"></script>
<script src="modules/utils/Units.js"></script>

<!-- 3. Communication модулі -->
<script src="modules/communication/SketchUpBridge.js"></script>

<!-- 4. UI модулі -->
<script src="modules/ui/Tabs.js"></script>
<script src="modules/ui/Panels.js"></script>

<!-- 5. Builder модулі -->
<script src="modules/builders/FoundationBuilder.js"></script>

<!-- 6. Головний файл в кінці -->
<script src="script.js"></script>
```

## 📋 **Детальний опис модулів**

### **Core модулі**

#### **Config.js**
- Конфігурація ProGran3
- Налаштування логування, каруселей, UI
- Валідація конфігурації
- **API:** `ProGran3.Core.Config`

#### **Logger.js**
- Система логування з рівнями
- Історія логів
- Статистика логування
- **API:** `ProGran3.Core.Logger`

#### **StateManager.js**
- Управління глобальним станом
- modelLists, carouselState, activeTab
- Експорт/імпорт стану
- **API:** `ProGran3.Core.StateManager`

### **Utils модулі**

#### **Helpers.js**
- Допоміжні функції (debounce, throttle)
- Робота з DOM
- LocalStorage, Cookies
- **API:** `ProGran3.Utils.Helpers`

#### **Validation.js**
- Валідація розмірів, товщини, файлів
- Sanitization вхідних даних
- Валідація даних компонентів
- **API:** `ProGran3.Utils.Validation`

#### **Units.js**
- Управління одиницями вимірювання
- Конвертація mm ↔ cm
- Форматування значень
- **API:** `ProGran3.Utils.Units`

### **Communication модулі**

#### **SketchUpBridge.js**
- Міст для комунікації з SketchUp
- Виклики SketchUp методів
- Генерація превью
- **API:** `ProGran3.Communication.SketchUpBridge`

### **UI модулі**

#### **Tabs.js**
- Система табів
- Переключення між табами
- Ініціалізація каруселей
- **API:** `ProGran3.UI.Tabs`

#### **Panels.js**
- Система панелей
- Розгортання/згортання
- Floating labels
- **API:** `ProGran3.UI.Panels`

### **Builder модулі**

#### **FoundationBuilder.js**
- Будівельник фундаменту
- Валідація даних
- Виклики SketchUp
- **API:** `ProGran3.Builders.FoundationBuilder`

## 🔧 **Використання модулів**

### **В коді:**
```javascript
// Використання через namespace
ProGran3.Core.Logger.debugLog('Повідомлення', 'info');
ProGran3.Utils.Validation.validateDimension('100');
ProGran3.Utils.Units.changeUnit('cm');

// Зворотна сумісність (глобальні функції)
debugLog('Повідомлення', 'info');
changeUnit('cm');
```

### **Додавання нового модуля:**
1. Створити файл в відповідній папці
2. Використати Namespace Pattern
3. Додати в HTML в правильному порядку
4. Забезпечити зворотну сумісність

## 🧪 **Тестування**

### **Тестовий раннер:**
- `test-modules.html` - простий тест завантаження
- `tests/test-runner.html` - повний тестовий раннер
- `tests/unit/` - unit тести для кожного модуля

### **Запуск тестів:**
1. Відкрити `test-modules.html` в браузері
2. Перевірити завантаження модулів
3. Запустити функціональні тести

## ⚠️ **Важливі правила**

### **✅ ОБОВ'ЯЗКОВО:**
- Використовувати Namespace Pattern
- Підключати модулі в правильному порядку
- Забезпечувати зворотну сумісність
- Додавати логування в кожен модуль
- Тестувати після додавання модуля

### **❌ ЗАБОРОНЕНО:**
- Використовувати ES6 модулі (`import`/`export`)
- Порушувати порядок завантаження
- Створювати глобальні змінні без namespace
- Ігнорувати зворотну сумісність

## 🚀 **Розвиток**

### **Додавання нового модуля:**
1. Створити файл в відповідній папці
2. Використати шаблон Namespace Pattern
3. Додати в `index.html` в правильному порядку
4. Створити unit тести
5. Оновити документацію

### **Приклад нового модуля:**
```javascript
// modules/ui/NewModule.js
(function(global) {
  'use strict';
  
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.UI = global.ProGran3.UI || {};
  
  function myFunction() {
    // Логіка модуля
  }
  
  global.ProGran3.UI.NewModule = { myFunction };
  global.myFunction = myFunction; // Зворотна сумісність
  
  if (global.ProGran3.Core.Logger) {
    global.ProGran3.Core.Logger.debugLog('NewModule завантажено', 'info', 'NewModule');
  }
  
})(window);
```

## 📞 **Підтримка**

При проблемах з модулями:
1. Перевірити порядок завантаження в HTML
2. Перевірити консоль браузера на помилки
3. Запустити `test-modules.html`
4. Перевірити зворотну сумісність

---

**Версія:** 1.0  
**Останнє оновлення:** 2025-01-09  
**Автор:** ProGran3 Team
