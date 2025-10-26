# ProGran3 Technical Documentation

## 🎯 SketchUp API Components Guide

### **Доступ до компонентів**
```ruby
# Отримання всіх компонентів моделі
model = Sketchup.active_model
entities = model.entities

# Пошук компонентів за іменем
components = entities.grep(Sketchup::ComponentInstance)
```

### **Властивості компонентів**
```ruby
# Розміри компонента
bounds = component.bounds
width = bounds.width
height = bounds.height
depth = bounds.depth

# Позиція компонента
center = bounds.center
position = { x: center.x, y: center.y, z: center.z }
```

### **Конвертація одиниць**
```ruby
# SketchUp використовує дюйми внутрішньо
# Конвертація в мм
def inches_to_mm(inches)
  inches * 25.4
end

# Конвертація в см
def inches_to_cm(inches)
  inches * 2.54
end
```

## 🎨 UI Modules System

### **Namespace Pattern (обов'язково для SketchUp)**
```javascript
// ES6 модулі НЕ ПРАЦЮЮТЬ в SketchUp!
(function(global) {
  'use strict';
  
  global.ProGran3 = global.ProGran3 || {};
  global.ProGran3.Core = global.ProGran3.Core || {};
  
  function myFunction() { /* ... */ }
  
  // Експорт
  global.ProGran3.Core.MyModule = { myFunction };
  
})(window);
```

### **State Management**
```javascript
// Управління станом UI
ProGran3.Core.StateManager.setModelLists(newLists);
ProGran3.Core.StateManager.setCarouselState('stands', { index: 2 });
```

## 🎠 Carousel System

### **Gravestones Carousel**
- Автоматичне створення превью з .skp файлів
- Ледаче завантаження (lazy loading)
- Кешування превью
- Плавна навігація з колесом миші

### **Accordion System**
```javascript
// Автоматична ініціалізація акордеон поведінки
function initializeAccordionBehavior() {
  // Знаходить всі таби та панелі
  // Замінює onclick обробники
  // Застосовує акордеон поведінку
}

// Універсальна функція переключення
function toggleAccordionPanel(headerElement) {
  // Згортає всі панелі в табі
  // Розгортає поточну панель
}
```

## 🌐 Internationalization (i18n)

### **Структура мовних файлів**
```
web/i18n/
├── en.json          # Англійська
├── uk.json          # Українська
└── README.md        # Інструкції
```

### **Використання**
```javascript
// Завантаження мовного файлу
const translations = await loadTranslations('uk');

// Отримання перекладу
const text = translations['ui.foundation.title'];
```

## 🔄 Git Workflow

### **Branching Strategy**
- `main` - production код
- `dev` - development код
- `feature/*` - нові функції
- `hotfix/*` - критичні виправлення

### **Commit Convention**
```
feat: add new carousel system
fix: resolve license validation issue
docs: update API documentation
refactor: simplify state management
```

### **Deployment Process**
1. Merge to `main`
2. Auto-deploy to Vercel
3. Update plugin config
4. Build new plugin version

## 🏗️ Server Modules

### **Module Structure**
```
server/modules/
├── report-generator.js    # Генерація звітів
└── README.md             # Документація модулів
```

### **API Integration**
```javascript
// Генерація звітів
const report = await generateReport(data);

// Експорт в різні формати
const pdfReport = await exportToPDF(report);
const excelReport = await exportToExcel(report);
```

---

**Last Updated**: 2025-01-26  
**Version**: 3.2.1
