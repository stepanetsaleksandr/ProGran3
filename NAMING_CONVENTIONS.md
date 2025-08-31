# Правила іменування ProGran3

## 📋 Загальні принципи

### ✅ **Основні правила:**
- **Ruby файли та методи**: `snake_case`
- **JavaScript класи**: `PascalCase`
- **JavaScript функції та змінні**: `camelCase`
- **Константи**: `SCREAMING_SNAKE_CASE`
- **Папки**: `lowercase`
- **Файли ресурсів**: `snake_case`

---

## 🏗️ Структура файлів та папок

### ✅ **Правильно:**
```
proGran3/
├── ui.rb                          # Ruby файли: snake_case
├── loader.rb
├── callback_manager.rb
├── coordination_manager.rb
├── model_state_manager.rb
├── skp_preview_extractor.rb
├── validation.rb
├── error_handler.rb
├── logger.rb
├── constants.rb
├── dimensions_manager.rb
├── assets/
│   ├── stands/                    # Папки: lowercase
│   ├── steles/
│   ├── flowerbeds/
│   ├── gravestones/
│   └── lamps/
├── web/
│   ├── index.html                 # HTML: lowercase
│   ├── script.js                  # JavaScript: camelCase
│   ├── style.css                  # CSS: lowercase
│   └── src/
│       ├── modules/
│       │   ├── ui/
│       │   │   ├── CarouselManager.js    # JS класи: PascalCase
│       │   │   ├── CarouselPreview.js
│       │   │   ├── Panels.js
│       │   │   └── Tabs.js
│       │   ├── communication/
│       │   │   ├── SketchUpBridge.js
│       │   │   └── Callbacks.js
│       │   ├── utils/
│       │   │   ├── Logger.js
│       │   │   └── Units.js
│       │   └── builders/
│       │       ├── FoundationBuilder.js
│       │       ├── BlindAreaBuilder.js
│       │       ├── TilingBuilder.js
│       │       └── CladdingBuilder.js
│       └── index.js
└── builders/
    ├── foundation_builder.rb      # Ruby класи: snake_case
    ├── blind_area_builder.rb
    ├── tiling_builder.rb
    └── cladding_builder.rb
```

### ❌ **Неправильно:**
```
proGran3/
├── UI.rb                          # ❌ Велика літера
├── Loader.rb                      # ❌ Велика літера
├── callbackManager.rb             # ❌ camelCase в Ruby
├── web/
│   ├── Script.js                  # ❌ Велика літера
│   ├── Style.css                  # ❌ Велика літера
│   └── src/
│       └── modules/
│           ├── ui/
│           │   ├── carouselManager.js    # ❌ camelCase для класів
│           │   └── panels.js             # ❌ lowercase для класів
```

---

## 🏷️ Іменування класів

### ✅ **Ruby класи (PascalCase):**
```ruby
# proGran3/model_state_manager.rb
class ModelStateManager
  # ...
end

# proGran3/coordination_manager.rb
class CoordinationManager
  # ...
end

# proGran3/builders/foundation_builder.rb
class FoundationBuilder
  # ...
end

# proGran3/builders/blind_area_builder.rb
class BlindAreaBuilder
  # ...
end

# proGran3/builders/tiling_builder.rb
class TilingBuilder
  # ...
end

# proGran3/builders/cladding_builder.rb
class CladdingBuilder
  # ...
end
```

### ✅ **JavaScript класи (PascalCase):**
```javascript
// web/src/modules/ui/CarouselManager.js
class CarouselManager {
  constructor() {
    this.carouselState = {};
  }
}

// web/src/modules/communication/SketchUpBridge.js
class SketchUpBridge {
  constructor() {
    this.availableMethods = [];
  }
}

// web/src/modules/builders/FoundationBuilder.js
class FoundationBuilder {
  constructor() {
    this.params = {};
  }
}

// web/src/modules/builders/BlindAreaBuilder.js
class BlindAreaBuilder {
  constructor() {
    this.params = {};
  }
}
```

---

## 🔤 Іменування методів та функцій

### ✅ **Ruby методи (snake_case):**
```ruby
class ModelStateManager
  def can_add_component?(category)
    # ...
  end
  
  def component_added(category, params)
    # ...
  end
  
  def component_removed(category)
    # ...
  end
  
  def save_state_before_update()
    # ...
  end
  
  def restore_state_after_update()
    # ...
  end
  
  def export_state()
    # ...
  end
  
  def import_state(state_data)
    # ...
  end
end

class CoordinationManager
  def update_all_elements(new_foundation_params)
    # ...
  end
  
  def update_component_with_position(category, foundation_bounds)
    # ...
  end
  
  def restore_component_position(category, instance)
    # ...
  end
end
```

### ✅ **JavaScript функції (camelCase):**
```javascript
class CarouselManager {
  initializeCarousel(category) {
    // ...
  }
  
  loadModelsForCarousel(category) {
    // ...
  }
  
  updateCarouselDisplay(category) {
    // ...
  }
  
  addModel(category) {
    // ...
  }
  
  nextModel(category) {
    // ...
  }
  
  prevModel(category) {
    // ...
  }
}

class SketchUpBridge {
  callSketchUpMethod(methodName, ...params) {
    // ...
  }
  
  getModels(modelType) {
    // ...
  }
  
  createFoundation(depth, width, height) {
    // ...
  }
  
  addModel(category, filename, position) {
    // ...
  }
}
```

---

## 📦 Іменування змінних

### ✅ **Ruby змінні (snake_case):**
```ruby
class ModelStateManager
  def initialize
    @model_state = {}
    @dependencies = {}
    @validation_rules = {}
    @change_history = []
  end
  
  def can_add_component?(category)
    existing_components = @model_state[category]
    required_dependencies = @dependencies[category]
    validation_rule = @validation_rules[category]
    # ...
  end
  
  def component_added(category, params)
    component_data = {
      exists: true,
      params: params,
      position: {},
      bounds: {}
    }
    @model_state[category] = component_data
    # ...
  end
end
```

### ✅ **JavaScript змінні (camelCase):**
```javascript
class CarouselManager {
  constructor() {
    this.carouselState = {};
    this.modelLists = {};
    this.currentIndex = 0;
    this.isLoaded = false;
  }
  
  initializeCarousel(category) {
    const carouselElement = document.getElementById(category);
    const modelList = this.modelLists[category];
    const currentState = this.carouselState[category];
    const isInitialized = currentState && currentState.initialized;
    // ...
  }
  
  loadModelsForCarousel(category) {
    const modelFiles = this.modelLists[category];
    const carouselContainer = document.querySelector(`#${category}-carousel`);
    const previewContainer = carouselContainer.querySelector('.preview-container');
    // ...
  }
}
```

---

## 🔗 Іменування констант

### ✅ **Ruby константи (SCREAMING_SNAKE_CASE):**
```ruby
# proGran3/constants.rb
module Constants
  ERROR_TYPES = {
    VALIDATION_ERROR: "validation_error",
    DEPENDENCY_ERROR: "dependency_error",
    FILE_NOT_FOUND: "file_not_found",
    SKETCHUP_API_ERROR: "sketchup_api_error",
    STATE_ERROR: "state_error",
    COMMUNICATION_ERROR: "communication_error"
  }
  
  LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3,
    CRITICAL: 4
  }
  
  LOG_CONTEXTS = {
    MODEL_STATE: "ModelState",
    COORDINATION: "Coordination",
    LOADER: "Loader",
    UI: "UI",
    CAROUSEL: "Carousel",
    PREVIEW: "Preview"
  }
  
  COMPONENT_CATEGORIES = {
    FOUNDATION: "foundation",
    STANDS: "stands",
    STELES: "steles",
    FLOWERBEDS: "flowerbeds",
    GRAVESTONES: "gravestones",
    LAMPS: "lamps"
  }
end
```

### ✅ **JavaScript константи (SCREAMING_SNAKE_CASE):**
```javascript
// web/src/modules/utils/Constants.js
export const ERROR_TYPES = {
  VALIDATION_ERROR: "validation_error",
  DEPENDENCY_ERROR: "dependency_error",
  FILE_NOT_FOUND: "file_not_found",
  SKETCHUP_API_ERROR: "sketchup_api_error",
  STATE_ERROR: "state_error",
  COMMUNICATION_ERROR: "communication_error"
};

export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
  CRITICAL: 4
};

export const LOG_CONTEXTS = {
  MODEL_STATE: "ModelState",
  COORDINATION: "Coordination",
  LOADER: "Loader",
  UI: "UI",
  CAROUSEL: "Carousel",
  PREVIEW: "Preview"
};

export const COMPONENT_CATEGORIES = {
  FOUNDATION: "foundation",
  STANDS: "stands",
  STELES: "steles",
  FLOWERBEDS: "flowerbeds",
  GRAVESTONES: "gravestones",
  LAMPS: "lamps"
};
```

---

## 📁 Іменування файлів ресурсів

### ✅ **3D компоненти (snake_case):**
```
proGran3/assets/
├── stands/
│   ├── stand_50x20x15.skp
│   ├── stand_60x20x20.skp
│   └── stand_70x25x20.skp
├── steles/
│   ├── stele_100x50x8.skp
│   ├── stele_120x60x8.skp
│   ├── stele_80x40x5.skp
│   ├── stele_wave_100x50x8.skp
│   └── stele_wave_cross_100x50x8.skp
├── flowerbeds/
│   ├── flowerbed_100x50x10.skp
│   ├── flowerbed_110x60x10.skp
│   └── flowerbed_120x60x10.skp
├── gravestones/
│   ├── plate_50x30x3.skp
│   └── plate_60x35x2_wave.skp
├── lamps/
│   ├── lamp_small.skp
│   ├── lamp_medium.skp
│   └── lamp_large.skp
└── pavement_tiles/
    └── tile_30x30.skp
```

### ✅ **Зображення (snake_case):**
```
proGran3/assets/
├── stands/
│   ├── stand_50x20x15.png
│   ├── stand_60x20x20.png
│   └── stand_70x25x20.png
├── steles/
│   ├── stele_100x50x8.png
│   ├── stele_120x60x8.png
│   ├── stele_80x40x5.png
│   ├── stele_wave_100x50x8.png
│   └── stele_wave_cross_100x50x8.png
├── flowerbeds/
│   ├── flowerbed_100x50x10.png
│   ├── flowerbed_110x60x10.png
│   └── flowerbed_120x60x10.png
├── gravestones/
│   ├── plate_50x30x3.png
│   └── plate_60x35x2_wave.png
└── lamps/
    ├── lamp_small.png
    ├── lamp_medium.png
    └── lamp_large.png
```

---

## 🎯 Спеціальні випадки

### ✅ **Callback функції:**
```javascript
// Глобальні callback функції (camelCase)
window.sketchup = {
  addFoundation: function(depth, width, height) {
    // ...
  },
  
  addStands: function(category, filename) {
    // ...
  },
  
  addSteles: function(category, filename) {
    // ...
  },
  
  addFlowerbeds: function(category, filename) {
    // ...
  },
  
  addGravestones: function(category, filename) {
    // ...
  },
  
  addLamps: function(category, filename, position) {
    // ...
  },
  
  generateWebPreview: function(componentPath) {
    // ...
  }
};
```

### ✅ **CSS класи (kebab-case):**
```css
/* web/style.css */
.carousel-container {
  /* ... */
}

.carousel-preview {
  /* ... */
}

.carousel-navigation {
  /* ... */
}

.panel-header {
  /* ... */
}

.panel-content {
  /* ... */
}

.tab-button {
  /* ... */
}

.tab-content {
  /* ... */
}
```

### ✅ **HTML ID та класи (kebab-case):**
```html
<!-- web/index.html -->
<div id="foundation-panel" class="panel">
  <div class="panel-header">
    <h3>Фундамент</h3>
  </div>
  <div class="panel-content">
    <div id="foundation-carousel" class="carousel-container">
      <div class="carousel-preview"></div>
      <div class="carousel-navigation">
        <button class="nav-button prev-button">←</button>
        <button class="nav-button next-button">→</button>
      </div>
    </div>
  </div>
</div>
```

---

## 📋 Контрольний список

### ✅ **Перед комітом перевірити:**
- [ ] Ruby файли використовують `snake_case`
- [ ] JavaScript класи використовують `PascalCase`
- [ ] JavaScript функції та змінні використовують `camelCase`
- [ ] Константи використовують `SCREAMING_SNAKE_CASE`
- [ ] Папки використовують `lowercase`
- [ ] Файли ресурсів використовують `snake_case`
- [ ] CSS класи використовують `kebab-case`
- [ ] HTML ID та класи використовують `kebab-case`

---

## 🚨 Заборонені патерни

### ❌ **НЕ використовувати:**
- `camelCase` в Ruby файлах
- `snake_case` для JavaScript класів
- `PascalCase` для JavaScript функцій
- `lowercase` для констант
- `SCREAMING_SNAKE_CASE` для змінних
- `kebab-case` для JavaScript змінних
- Пробіли в назвах файлів
- Спеціальні символи в назвах файлів (крім `_` та `-`)

---

*Останнє оновлення: [Дата]*
*Версія правил: 1.0*
*Автор: ProGran3 Development Team*
