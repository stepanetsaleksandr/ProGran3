# Архітектура проекту ProGran3

## Зміст
1. [Загальна структура проекту](#загальна-структура-проекту)
2. [Архітектурні шари](#архітектурні-шари)
3. [Ключові компоненти](#ключові-компоненти)
4. [Потоки даних](#потоки-даних)
5. [Залежності між компонентами](#залежності-між-компонентами)
6. [Структура даних](#структура-даних)
7. [API інтерфейси](#api-інтерфейси)
8. [Обробка помилок](#обробка-помилок)
9. [Логування](#логування)
10. [Тестування](#тестування)
11. [Розгортання](#розгортання)
12. [Принципи розробки](#принципи-розробки)
13. [Контрольний список](#контрольний-список)

---

## Загальна структура проекту

```
ProGran3/
├── proGran3.rb                    # Головний модуль
├── ui.rb                          # UI менеджер (Ruby)
├── loader.rb                      # Завантажувач компонентів
├── callback_manager.rb            # Менеджер callback'ів
├── coordination_manager.rb        # Координаційний менеджер
├── model_state_manager.rb         # Менеджер стану моделі (НОВИЙ)
├── skp_preview_extractor.rb       # Генератор превью
├── validation.rb                  # Валідація
├── error_handler.rb               # Обробка помилок
├── logger.rb                      # Логування
├── assets/                        # 3D компоненти
│   ├── stands/                    # Підставки
│   ├── steles/                    # Стели
│   ├── flowerbeds/                # Квітники
│   ├── gravestones/               # Надгробні плити
│   └── lamps/                     # Лампадки
├── web/                           # Frontend (JavaScript)
│   ├── index.html                 # Головна сторінка
│   ├── script.js                  # Основний скрипт
│   ├── style.css                  # Стилі
│   ├── carousel/                  # Карусель система
│   │   ├── carousel.css
│   │   └── carousel.js
│   └── src/                       # Модульна структура
│       ├── modules/
│       │   ├── ui/
│       │   │   ├── CarouselManager.js
│       │   │   └── Panels.js
│       │   ├── communication/
│       │   │   └── SketchUpBridge.js
│       │   └── utils/
│       │       └── Logger.js
│       └── index.js
└── builders/                      # Будівельники компонентів
    ├── foundation_builder.rb
    ├── blind_area_builder.rb
    ├── tiling_builder.rb
    ├── cladding_builder.rb
    └── fence_builder.rb
```

---

## Архітектурні шари

### Presentation Layer (Frontend)
- **HTML/CSS/JavaScript** - користувацький інтерфейс
- **Carousel System** - система каруселей для компонентів
- **UI Components** - панелі, кнопки, форми
- **State Management** - управління станом UI

### Communication Layer
- **SketchUpBridge** - зв'язок між JavaScript і Ruby
- **Callback System** - система callback'ів
- **Action Handlers** - обробники дій користувача

### Business Logic Layer
- **ModelStateManager** - управління станом моделі
- **CoordinationManager** - координація компонентів
- **Validation** - валідація даних
- **Dependency Management** - управління залежностями

### Data Access Layer
- **Loader** - завантаження компонентів
- **Builders** - створення компонентів
- **Preview Extractor** - генерація превью
- **File System** - робота з файлами

### Infrastructure Layer
- **Error Handler** - обробка помилок
- **Logger** - логування
- **SketchUp API** - інтеграція з SketchUp

---

## Ключові компоненти

### ModelStateManager (Центральний компонент)

```ruby
class ModelStateManager
  # Основний стан моделі
  @model_state = {
    foundation: { exists: false, params: {}, position: {} },
    stands: { exists: false, filename: nil, position: {} },
    stele_block: { exists: false, configuration: {} },
    # ... інші компоненти
  }
  
  # Залежності між компонентами
  @dependencies = {
    stands: [:foundation],
    stele_block: [:stands],
    lamps: [:gravestones]
  }
  
  # Валідаційні правила
  @validation_rules = {
    foundation: { required: true, max_count: 1 },
    stele_block: { required: true, depends_on: [:stands] }
  }
  
  # Методи
  def can_add_component?(category)
  def component_added(category, params)
  def component_removed(category)
  def save_state_before_update()
  def restore_state_after_update()
  def export_state()
  def import_state(state_data)
end
```

### Communication Bridge

```javascript
// SketchUpBridge.js
class SketchUpBridge {
  constructor() {
    this.availableMethods = [
      'add_foundation',
      'add_stands', 
      'add_steles',
      'generate_web_preview',
      'check_dependencies'
    ]
  }
  
  callSketchUpMethod(methodName, ...params)
  getModels(modelType)
  createFoundation(depth, width, height)
  addModel(category, filename, position)
}
```

### Carousel System

```javascript
// CarouselManager.js
class CarouselManager {
  constructor() {
    this.carouselState = {}
    this.modelLists = {}
  }
  
  initializeCarousel(category)
  loadModelsForCarousel(category)
  updateCarouselDisplay(category)
  addModel(category)
  nextModel(category)
  prevModel(category)
}
```

---

## Потоки даних

### Додавання компонента

```
UI (JavaScript) 
  ↓
SketchUpBridge.callSketchUpMethod()
  ↓
Ruby Callback (callback_manager.rb)
  ↓
ModelStateManager.can_add_component?()
  ↓
Loader.insert_component()
  ↓
ModelStateManager.component_added()
  ↓
UI Update (JavaScript)
```

### Оновлення фундаменту

```
UI Change (JavaScript)
  ↓
CoordinationManager.update_all_elements()
  ↓
ModelStateManager.save_state_before_update()
  ↓
FoundationBuilder.create()
  ↓
Update Dependent Components
  ↓
ModelStateManager.restore_state_after_update()
  ↓
UI Update (JavaScript)
```

### Генерація превью

```
Carousel Initialization (JavaScript)
  ↓
SketchUpBridge.generate_web_preview()
  ↓
Preview Extractor
  ↓
Component Loading (SketchUp)
  ↓
Preview Generation
  ↓
Component Cleanup
  ↓
Base64 Encoding
  ↓
UI Display (JavaScript)
```

---

## Залежності між компонентами

### Ієрархія залежностей

```
Foundation
├── BlindArea
├── Tiles  
├── Cladding
├── Fence
└── Stands
    └── SteleBlock
        ├── FirstStele
        │   ├── Portrait
        │   ├── Inscription
        │   ├── BrassDecor
        │   └── Columns
        ├── SecondStele (опціонально)
        │   ├── Portrait
        │   ├── Inscription
        │   ├── BrassDecor
        │   └── Columns
        ├── BetweenSteles (якщо дві стели)
        │   ├── Cross
        │   └── AttachedDetail
        └── Roof
            ├── RoofElement1
            ├── RoofElement2
            └── RoofElement3
    ├── Flowerbeds
    └── Gravestones
        └── Lamps
```

### Матриця залежностей

| Компонент | Залежить від | Обов'язкова | Макс. кількість |
|-----------|--------------|-------------|-----------------|
| Foundation | - | ✅ | 1 |
| BlindArea | Foundation | ❌ | 1 |
| Tiles | Foundation | ❌ | 1 |
| Cladding | Foundation | ❌ | 1 |
| Fence | Foundation | ❌ | 1 |
| Stands | Foundation | ❌ | 1 |
| SteleBlock | Stands | ✅ | 1 |
| FirstStele | SteleBlock | ✅ | 1 |
| SecondStele | SteleBlock | ❌ | 1 |
| Portrait | FirstStele/SecondStele | ❌ | 2 |
| Inscription | FirstStele/SecondStele | ❌ | 2 |
| BrassDecor | FirstStele/SecondStele | ❌ | 2 |
| Columns | FirstStele/SecondStele | ❌ | 2 |
| BetweenSteles | FirstStele + SecondStele | ❌ | 1 |
| Cross | BetweenSteles | ❌ | 1 |
| AttachedDetail | BetweenSteles | ❌ | 1 |
| Roof | SteleBlock | ❌ | 1 |
| RoofElement1 | Roof | ❌ | 1 |
| RoofElement2 | Roof | ❌ | 1 |
| RoofElement3 | Roof | ❌ | 1 |
| Flowerbeds | Stands | ❌ | 1 |
| Gravestones | Stands | ❌ | 1 |
| Lamps | Gravestones | ❌ | 1 |

---

## Структура даних

### Модель стану

```ruby
ModelState = {
  foundation: {
    exists: Boolean,
    params: {
      depth: Integer,
      width: Integer, 
      height: Integer
    },
    position: {
      x: Float,
      y: Float,
      z: Float,
      rotation: Float
    },
    bounds: {
      min: Point3d,
      max: Point3d,
      center: Point3d
    }
  },
  
  stele_block: {
    exists: Boolean,
    configuration: {
      type: String, # 'single' | 'double'
      first_stele: SteleData,
      second_stele: SteleData
    }
  },
  
  lamps: {
    exists: Boolean,
    filename: String,
    position: {
      type: String, # 'left' | 'center' | 'right'
      x: Float,
      y: Float,
      z: Float,
      relative_to: String
    }
  }
}
```

### Конфігурація стел

```ruby
SteleConfiguration = {
  type: String, # 'single' | 'double'
  first_stele: {
    exists: Boolean,
    filename: String,
    position: Position3d,
    decorations: {
      portrait: PortraitData,
      inscription: InscriptionData,
      brass_decor: BrassDecorData,
      columns: ColumnsData
    }
  },
  second_stele: {
    exists: Boolean,
    filename: String,
    position: Position3d,
    decorations: {
      portrait: PortraitData,
      inscription: InscriptionData,
      brass_decor: BrassDecorData,
      columns: ColumnsData
    }
  },
  between_steles: {
    exists: Boolean,
    type: String, # 'cross' | 'attached_detail'
    cross: CrossData,
    attached_detail: AttachedDetailData
  },
  roof: {
    exists: Boolean,
    elements: {
      element1: RoofElementData,
      element2: RoofElementData,
      element3: RoofElementData
    }
  }
}
```

---

## API інтерфейси

### Ruby API

```ruby
# ModelStateManager API
ModelStateManager.can_add_component?(category)
ModelStateManager.component_added(category, params)
ModelStateManager.component_removed(category)
ModelStateManager.get_dependencies(category)
ModelStateManager.save_state_before_update()
ModelStateManager.restore_state_after_update()
ModelStateManager.export_state()
ModelStateManager.import_state(state_data)

# CoordinationManager API
CoordinationManager.update_all_elements(new_foundation_params)
CoordinationManager.update_component_with_position(category, foundation_bounds)
CoordinationManager.restore_component_position(category, instance)

# Loader API
Loader.insert_component_with_position_save(category, filename, x, y, z, rotation)
Loader.restore_component_position(category, instance)
```

### JavaScript API

```javascript
// SketchUpBridge API
SketchUpBridge.callSketchUpMethod(methodName, ...params)
SketchUpBridge.getModels(modelType)
SketchUpBridge.addModel(category, filename, position)
SketchUpBridge.generateWebPreview(componentPath)
SketchUpBridge.checkDependencies(category)

// CarouselManager API
CarouselManager.initializeCarousel(category)
CarouselManager.loadModelsForCarousel(category)
CarouselManager.updateCarouselDisplay(category)
CarouselManager.addModel(category)
CarouselManager.nextModel(category)
CarouselManager.prevModel(category)

// UI API
UI.validateButtons()
UI.getAvailableOptions(category)
UI.updateSummaryTable()
UI.showError(message)
UI.showSuccess(message)
```

---

## Обробка помилок

### Типи помилок

```ruby
ErrorTypes = {
  VALIDATION_ERROR: "validation_error",
  DEPENDENCY_ERROR: "dependency_error", 
  FILE_NOT_FOUND: "file_not_found",
  SKETCHUP_API_ERROR: "sketchup_api_error",
  STATE_ERROR: "state_error",
  COMMUNICATION_ERROR: "communication_error"
}
```

### Обробка помилок

```ruby
class ErrorHandler
  def self.handle_error(error, context, method)
    error_type = classify_error(error)
    log_error(error, context, method)
    notify_user(error_type, error.message)
    rollback_state_if_needed(error_type)
  end
end
```

---

## Логування

### Рівні логування

```ruby
LogLevels = {
  DEBUG: 0,
  INFO: 1, 
  WARNING: 2,
  ERROR: 3,
  CRITICAL: 4
}
```

### Контексти логування

```ruby
LogContexts = {
  MODEL_STATE: "ModelState",
  COORDINATION: "Coordination", 
  LOADER: "Loader",
  UI: "UI",
  CAROUSEL: "Carousel",
  PREVIEW: "Preview"
}
```

---

## Тестування

### Unit тести

```ruby
# Тести для ModelStateManager
test_can_add_component_with_valid_dependencies
test_cannot_add_component_with_missing_dependencies
test_component_removal_cascades_to_dependents
test_state_persistence_and_restoration

# Тести для CoordinationManager  
test_foundation_update_preserves_component_positions
test_dependent_components_update_correctly
test_error_handling_during_updates
```

### Integration тести

```ruby
# Тести інтеграції
test_full_workflow_from_ui_to_sketchup
test_carousel_initialization_with_preview_generation
test_state_synchronization_between_ruby_and_javascript
test_error_recovery_and_state_consistency
```

---

## Розгортання

### Структура плагіна

```
ProGran3.skpx
├── proGran3.rb
├── ui.rb
├── loader.rb
├── callback_manager.rb
├── coordination_manager.rb
├── model_state_manager.rb
├── skp_preview_extractor.rb
├── validation.rb
├── error_handler.rb
├── logger.rb
├── builders/
├── assets/
└── web/
```

### Залежності

```ruby
# Ruby залежності
require 'json'
require 'fileutils'
require 'base64'

# SketchUp залежності
require 'sketchup'
require 'extensions'
```

---

## Принципи розробки

### 1. Принцип єдиної відповідальності (SRP)
- Кожен клас має одну чітку відповідальність
- ModelStateManager відповідає тільки за стан
- CoordinationManager відповідає тільки за координацію

### 2. Принцип відкритості/закритості (OCP)
- Система відкрита для розширення
- Закрита для модифікації
- Нові компоненти додаються без зміни існуючого коду

### 3. Принцип підстановки Лісков (LSP)
- Всі компоненти можуть бути замінені на похідні
- Інтерфейси стабільні

### 4. Принцип розділення інтерфейсу (ISP)
- Клієнти не залежать від інтерфейсів, які не використовують
- API розділені на логічні групи

### 5. Принцип інверсії залежностей (DIP)
- Високорівневі модулі не залежать від низькорівневих
- Залежності інвертовані через абстракції

### 6. Принципи SOLID
- Всі принципи SOLID дотримуються
- Код легко тестувати і підтримувати

---

## Контрольний список

### Перед додаванням нового компонента:
- [ ] Визначити залежності в `@dependencies`
- [ ] Додати валідаційні правила в `@validation_rules`
- [ ] Оновити структуру `@model_state`
- [ ] Додати методи в ModelStateManager
- [ ] Створити builder (якщо потрібно)
- [ ] Додати callback в callback_manager.rb
- [ ] Оновити UI (HTML, JavaScript)
- [ ] Додати тести

### Перед зміною існуючого компонента:
- [ ] Перевірити вплив на залежні компоненти
- [ ] Оновити валідаційні правила
- [ ] Перевірити зворотну сумісність
- [ ] Оновити документацію
- [ ] Запустити тести

### Перед рефакторингом:
- [ ] Перевірити всі залежності
- [ ] Оновити API документацію
- [ ] Запустити повний набір тестів
- [ ] Перевірити продуктивність

### Контроль якості:
- [ ] Код відповідає принципам SOLID
- [ ] Всі залежності правильно визначені
- [ ] Обробка помилок реалізована
- [ ] Логування налаштоване
- [ ] Тести покривають основні сценарії
- [ ] UI відповідає архітектурі
- [ ] Документація оновлена

---

## Версіонування

### Семантичне версіонування (SemVer)
- MAJOR.MINOR.PATCH
- MAJOR: несумісні зміни API
- MINOR: нові функції зворотно сумісні
- PATCH: виправлення помилок

### Правила версіонування
- Кожна зміна архітектури = MAJOR версія
- Новий компонент = MINOR версія
- Виправлення помилки = PATCH версія

---

## Документація

### Обов'язкова документація
- [ ] API документація
- [ ] Приклади використання
- [ ] Діаграми архітектури
- [ ] Інструкції з розгортання
- [ ] Читання коду (code comments)

### Оновлення документації
- Документація оновлюється разом з кодом
- Кожна зміна API потребує оновлення документації
- Приклади коду повинні бути актуальними

---

*Останнє оновлення: [Дата]*
*Версія документації: 1.0*
*Автор: ProGran3 Development Team*
