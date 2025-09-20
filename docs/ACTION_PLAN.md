# План дій ProGran3

## 🎯 **ПОТОЧНИЙ СТАТУС**

### ✅ **Виконано:**
- [x] Створено ModelStateManager (центральний компонент)
- [x] Створено правила naming (NAMING_CONVENTIONS.md)
- [x] Створено документацію архітектури
- [x] Створено unit тести для ModelStateManager

### 🔄 **В процесі:**
- [ ] Інтеграція ModelStateManager з існуючим кодом
- [ ] Оновлення документації архітектури

### ❌ **Планується:**
- [ ] Рефакторинг script.js
- [ ] Створення тестової структури
- [ ] Виправлення порушень naming conventions

---

## 🚀 **НАСТУПНІ КРОКИ (ПРІОРИТЕТ)**

### **1. ІНТЕГРАЦІЯ MODELSTATEMANAGER (КРИТИЧНО)**

#### 1.1 Оновити callback_manager.rb
```ruby
# proGran3/callback_manager.rb
require_relative 'model_state_manager'

def add_model_callback(category, filename, position = nil)
  # Перевірка через ModelStateManager
  unless ModelStateManager.can_add_component?(category)
    Logger.error(LOG_CONTEXTS[:CALLBACK], "Неможливо додати компонент: #{category}")
    return false
  end
  
  # Додавання компонента
  success = insert_component(category, filename, position)
  
  if success
    # Оновлення стану
    ModelStateManager.component_added(category, { filename: filename, position: position })
  end
  
  success
end
```

#### 1.2 Оновити coordination_manager.rb
```ruby
# proGran3/coordination_manager.rb
require_relative 'model_state_manager'

def update_all_elements(new_foundation_params)
  # Збереження стану перед оновленням
  saved_state = ModelStateManager.save_state_before_update
  
  begin
    # Оновлення фундаменту
    update_foundation(new_foundation_params)
    
    # Оновлення залежних компонентів
    update_dependent_components(new_foundation_params)
    
  rescue => e
    # Відновлення стану при помилці
    ModelStateManager.restore_state_after_update(saved_state)
    Logger.error(LOG_CONTEXTS[:COORDINATION], "Помилка оновлення: #{e.message}")
    raise e
  end
end
```

#### 1.3 Оновити loader.rb
```ruby
# proGran3/loader.rb
require_relative 'model_state_manager'

def insert_component(category, filename, position = nil)
  # Перевірка через ModelStateManager
  unless ModelStateManager.can_add_component?(category)
    Logger.error(LOG_CONTEXTS[:LOADER], "Неможливо додати компонент: #{category}")
    return false
  end
  
  # Завантаження компонента
  component = load_and_insert(category, filename, position)
  
  if component
    # Збереження позиції
    ModelStateManager.save_component_position(category, position) if position
    Logger.info(LOG_CONTEXTS[:LOADER], "Компонент додано: #{category}")
    return component
  end
  
  false
end
```

### **2. ОНОВЛЕННЯ ДОКУМЕНТАЦІЇ (ВАЖЛИВО)**

#### 2.1 Виправити ARCHITECTURE.md
- [ ] Додати реальну структуру проекту
- [ ] Включити всі існуючі файли
- [ ] Оновити шляхи до файлів
- [ ] Додати ModelStateManager в архітектуру

#### 2.2 Оновити ARCHITECTURE_DIAGRAMS.md
- [ ] Додати діаграму ModelStateManager
- [ ] Оновити потоки даних
- [ ] Додати реальні компоненти

#### 2.3 Оновити ARCHITECTURE_CHECKLIST.md
- [ ] Додати перевірки ModelStateManager
- [ ] Оновити контрольний список

### **3. РЕФАКТОРИНГ SCRIPT.JS (ВАЖЛИВО)**

#### 3.1 Створити глобальний namespace
```javascript
// web/src/modules/core/GlobalNamespace.js
window.ProGran3 = {
  App: null,
  CarouselManager: null,
  SketchUpBridge: null,
  ModelStateManager: null,
  Utils: {}
};
```

#### 3.2 Розділити на модулі
```javascript
// web/src/modules/core/App.js
class App {
  constructor() {
    this.modelStateManager = new ModelStateManager();
    this.carouselManager = new CarouselManager();
    this.sketchUpBridge = new SketchUpBridge();
  }
  
  init() {
    this.modelStateManager.init();
    this.carouselManager.init();
    this.sketchUpBridge.init();
  }
}
```

#### 3.3 Оновити порядок завантаження
```html
<!-- web/index.html -->
<script src="src/modules/core/GlobalNamespace.js"></script>
<script src="src/modules/utils/Logger.js"></script>
<script src="src/modules/utils/Constants.js"></script>
<script src="src/modules/communication/SketchUpBridge.js"></script>
<script src="src/modules/ui/CarouselManager.js"></script>
<script src="src/modules/ui/Panels.js"></script>
<script src="src/modules/ui/Tabs.js"></script>
<script src="src/modules/core/App.js"></script>
<script src="script.js"></script>
```

### **4. СТВОРЕННЯ ТЕСТОВОЇ СТРУКТУРИ (ВАЖЛИВО)**

#### 4.1 Структура тестів
```
tests/
├── unit/
│   ├── model_state_manager_test.rb
│   ├── coordination_manager_test.rb
│   ├── callback_manager_test.rb
│   ├── loader_test.rb
│   └── validation_test.rb
├── integration/
│   ├── carousel_integration_test.rb
│   ├── callback_integration_test.rb
│   └── foundation_update_test.rb
├── fixtures/
│   ├── test_models/
│   │   ├── test_foundation.skp
│   │   ├── test_stand.skp
│   │   └── test_stele.skp
│   └── test_data/
│       ├── test_state.json
│       └── test_config.json
└── test_runner.rb
```

#### 4.2 Тестовий runner
```ruby
# tests/test_runner.rb
require 'test/unit'
require_relative 'unit/model_state_manager_test'
require_relative 'unit/coordination_manager_test'
require_relative 'integration/carousel_integration_test'

class TestRunner
  def self.run_all_tests
    puts "Запуск всіх тестів..."
    
    # Unit тести
    puts "\n=== Unit тести ==="
    run_unit_tests
    
    # Integration тести
    puts "\n=== Integration тести ==="
    run_integration_tests
    
    puts "\nТестування завершено!"
  end
  
  private
  
  def self.run_unit_tests
    # Запуск unit тестів
  end
  
  def self.run_integration_tests
    # Запуск integration тестів
  end
end
```

### **5. ВИПРАВЛЕННЯ NAMING CONVENTIONS (ВАЖЛИВО)**

#### 5.1 Перевірка файлів
- [ ] Перевірити всі Ruby файли на snake_case
- [ ] Перевірити всі JavaScript файли на PascalCase/camelCase
- [ ] Перевірити папки на lowercase
- [ ] Перевірити ресурси на snake_case

#### 5.2 Перейменування файлів
```bash
# Приклади перейменування
mv proGran3/UI.rb proGran3/ui.rb
mv proGran3/Loader.rb proGran3/loader.rb
mv proGran3/web/Script.js proGran3/web/script.js
mv proGran3/web/Style.css proGran3/web/style.css
```

---

## 📅 **КАЛЕНДАР ПЛАНУ**

### **Тиждень 1:**
- [ ] Інтеграція ModelStateManager
- [ ] Оновлення callback_manager.rb
- [ ] Оновлення coordination_manager.rb

### **Тиждень 2:**
- [ ] Оновлення документації архітектури
- [ ] Створення тестової структури
- [ ] Написання unit тестів

### **Тиждень 3:**
- [ ] Рефакторинг script.js
- [ ] Створення модульної структури
- [ ] Оновлення порядку завантаження

### **Тиждень 4:**
- [ ] Виправлення naming conventions
- [ ] Інтеграційні тести
- [ ] Фінальне тестування

---

## 🎯 **КРИТЕРІЇ УСПІХУ**

### **Технічні:**
- [ ] ModelStateManager інтегрований з усіма компонентами
- [ ] Всі тести проходять
- [ ] script.js розділений на модулі
- [ ] Документація актуальна

### **Якість коду:**
- [ ] Дотримання naming conventions
- [ ] Принципи SOLID дотримуються
- [ ] Обробка помилок реалізована
- [ ] Логування налаштоване

### **Архітектура:**
- [ ] Архітектурні шари не змішані
- [ ] Залежності правильно визначені
- [ ] ModelStateManager працює як центральний компонент
- [ ] Callback система стабільна

---

## 🚨 **РИЗИКИ ТА МІТИГАЦІЯ**

### **Ризики:**
1. **Порушення існуючої функціональності**
   - Мітигація: Поетапне тестування, backup перед змінами

2. **Складність інтеграції ModelStateManager**
   - Мітигація: Почати з простих компонентів, поступово ускладнювати

3. **Проблеми з SketchUp API**
   - Мітигація: Тестування в SketchUp середовищі

### **Контрольні точки:**
- [ ] Після кожної інтеграції - тестування
- [ ] Після рефакторингу - перевірка функціональності
- [ ] Після оновлення документації - перевірка актуальності

---

*Останнє оновлення: [Дата]*
*Версія плану: 1.0*
*Автор: ProGran3 Development Team*
