# Діаграми архітектури ProGran3

## 1. Загальна архітектура системи

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  HTML/CSS/JavaScript                                        │
│  ├── Carousel System                                        │
│  ├── UI Components                                          │
│  └── State Management                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  COMMUNICATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  SketchUpBridge                                             │
│  ├── Callback System                                        │
│  └── Action Handlers                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                      │
├─────────────────────────────────────────────────────────────┤
│  ModelStateManager (ЦЕНТРАЛЬНИЙ)                            │
│  ├── State Management                                       │
│  ├── Dependency Management                                  │
│  └── Validation                                             │
│                                                             │
│  CoordinationManager                                        │
│  ├── Component Coordination                                 │
│  └── Update Management                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  Loader                                                     │
│  ├── Component Loading                                      │
│  └── Position Management                                    │
│                                                             │
│  Builders                                                   │
│  ├── FoundationBuilder                                      │
│  ├── BlindAreaBuilder                                       │
│  └── Other Builders                                         │
│                                                             │
│  Preview Extractor                                          │
│  └── Preview Generation                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  Error Handler                                              │
│  Logger                                                     │
│  SketchUp API                                               │
└─────────────────────────────────────────────────────────────┘
```

## 2. Потік даних при додаванні компонента

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│     UI      │───▶│SketchUpBridge│───▶│Ruby Callback│
│(JavaScript) │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
                                              ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   UI Update │◀───│   Loader    │◀───│ModelStateMgr│
│(JavaScript) │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 3. Ієрархія залежностей компонентів

```
                    Foundation
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    BlindArea        Tiles          Cladding
         │               │               │
         └───────────────┼───────────────┘
                         │
                      Stands
                         │
                    SteleBlock
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    FirstStele    SecondStele      Flowerbeds
         │               │               │
    ┌────┴────┐    ┌────┴────┐           │
    │         │    │         │           │
Portrait  Inscription Portrait Inscription │
    │         │    │         │           │
BrassDecor Columns BrassDecor Columns   │
    │         │    │         │           │
    └─────────┴────┴─────────┴───────────┘
                         │
                    Gravestones
                         │
                      Lamps
```

## 4. ModelStateManager структура

```
ModelStateManager
├── @model_state
│   ├── foundation: { exists, params, position, bounds }
│   ├── stands: { exists, filename, position }
│   ├── stele_block: { exists, configuration }
│   ├── first_stele: { exists, filename, position, decorations }
│   ├── second_stele: { exists, filename, position, decorations }
│   ├── flowerbeds: { exists, filename, position }
│   ├── gravestones: { exists, filename, position }
│   └── lamps: { exists, filename, position }
│
├── @dependencies
│   ├── stands: [:foundation]
│   ├── stele_block: [:stands]
│   ├── first_stele: [:stele_block]
│   ├── second_stele: [:stele_block]
│   ├── flowerbeds: [:stands]
│   ├── gravestones: [:stands]
│   └── lamps: [:gravestones]
│
├── @validation_rules
│   ├── foundation: { required: true, max_count: 1 }
│   ├── stele_block: { required: true, depends_on: [:stands] }
│   └── ...
│
└── Methods
    ├── can_add_component?(category)
    ├── component_added(category, params)
    ├── component_removed(category)
    ├── save_state_before_update()
    ├── restore_state_after_update()
    ├── export_state()
    └── import_state(state_data)
```

## 5. Carousel System архітектура

```
CarouselManager
├── carouselState
│   ├── stands: { currentIndex, models, loaded }
│   ├── steles: { currentIndex, models, loaded }
│   ├── flowerbeds: { currentIndex, models, loaded }
│   ├── gravestones: { currentIndex, models, loaded }
│   └── lamps: { currentIndex, models, loaded }
│
├── modelLists
│   ├── stands: [filename1, filename2, ...]
│   ├── steles: [filename1, filename2, ...]
│   ├── flowerbeds: [filename1, filename2, ...]
│   ├── gravestones: [filename1, filename2, ...]
│   └── lamps: [filename1, filename2, ...]
│
└── Methods
    ├── initializeCarousel(category)
    ├── loadModelsForCarousel(category)
    ├── updateCarouselDisplay(category)
    ├── addModel(category)
    ├── nextModel(category)
    └── prevModel(category)
```

## 6. Потік оновлення фундаменту

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   UI Change │───▶│CoordinationMgr│───▶│ModelStateMgr│
│(JavaScript) │    │             │    │save_state() │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
                                              ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   UI Update │◀───│Update Dep.  │◀───│Foundation   │
│(JavaScript) │    │Components   │    │Builder      │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
                                              ▼
                                    ┌─────────────┐
                                    │ModelStateMgr│
                                    │restore_state│
                                    └─────────────┘
```

## 7. Система обробки помилок

```
ErrorHandler
├── ErrorTypes
│   ├── VALIDATION_ERROR
│   ├── DEPENDENCY_ERROR
│   ├── FILE_NOT_FOUND
│   ├── SKETCHUP_API_ERROR
│   ├── STATE_ERROR
│   └── COMMUNICATION_ERROR
│
├── handle_error(error, context, method)
│   ├── classify_error(error)
│   ├── log_error(error, context, method)
│   ├── notify_user(error_type, error.message)
│   └── rollback_state_if_needed(error_type)
│
└── Contexts
    ├── MODEL_STATE
    ├── COORDINATION
    ├── LOADER
    ├── UI
    ├── CAROUSEL
    └── PREVIEW
```

## 8. Система логування

```
Logger
├── LogLevels
│   ├── DEBUG: 0
│   ├── INFO: 1
│   ├── WARNING: 2
│   ├── ERROR: 3
│   └── CRITICAL: 4
│
├── LogContexts
│   ├── MODEL_STATE
│   ├── COORDINATION
│   ├── LOADER
│   ├── UI
│   ├── CAROUSEL
│   └── PREVIEW
│
└── Methods
    ├── debug(context, message)
    ├── info(context, message)
    ├── warning(context, message)
    ├── error(context, message)
    └── critical(context, message)
```

## 9. Структура файлів проекту

```
ProGran3/
├── proGran3.rb                    # Головний модуль
├── ui.rb                          # UI менеджер
├── loader.rb                      # Завантажувач
├── callback_manager.rb            # Callback менеджер
├── coordination_manager.rb        # Координаційний менеджер
├── model_state_manager.rb         # Менеджер стану (НОВИЙ)
├── skp_preview_extractor.rb       # Генератор превью
├── validation.rb                  # Валідація
├── error_handler.rb               # Обробка помилок
├── logger.rb                      # Логування
├── assets/                        # 3D компоненти
│   ├── stands/
│   ├── steles/
│   ├── flowerbeds/
│   ├── gravestones/
│   └── lamps/
├── web/                           # Frontend
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   └── src/
│       └── modules/
│           ├── ui/
│           ├── communication/
│           └── utils/
└── builders/                      # Будівельники
    ├── foundation_builder.rb
    ├── blind_area_builder.rb
    ├── tiling_builder.rb
    ├── cladding_builder.rb
    └── fence_builder.rb
```

## 10. Матриця залежностей

```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│ Компонент   │ Залежить від│ Обов'язкова │ Макс. к-сть │ Статус      │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ Foundation  │ -           │ ✅          │ 1           │ ✅ Реалізовано│
│ BlindArea   │ Foundation  │ ❌          │ 1           │ ✅ Реалізовано│
│ Tiles       │ Foundation  │ ❌          │ 1           │ ✅ Реалізовано│
│ Cladding    │ Foundation  │ ❌          │ 1           │ ✅ Реалізовано│
│ Fence       │ Foundation  │ ❌          │ 1           │ ✅ Реалізовано│
│ Stands      │ Foundation  │ ❌          │ 1           │ ✅ Реалізовано│
│ SteleBlock  │ Stands      │ ✅          │ 1           │ 🔄 В розробці│
│ FirstStele  │ SteleBlock  │ ✅          │ 1           │ 🔄 В розробці│
│ SecondStele │ SteleBlock  │ ❌          │ 1           │ 🔄 В розробці│
│ Portrait    │ First/Second│ ❌          │ 2           │ 🔄 В розробці│
│ Inscription │ First/Second│ ❌          │ 2           │ 🔄 В розробці│
│ BrassDecor  │ First/Second│ ❌          │ 2           │ 🔄 В розробці│
│ Columns     │ First/Second│ ❌          │ 2           │ 🔄 В розробці│
│ BetweenSteles│First+Second│ ❌          │ 1           │ 🔄 В розробці│
│ Cross       │ BetweenSteles│ ❌         │ 1           │ 🔄 В розробці│
│ AttachedDetail│BetweenSteles│ ❌        │ 1           │ 🔄 В розробці│
│ Roof        │ SteleBlock  │ ❌          │ 1           │ 🔄 В розробці│
│ RoofElement1│ Roof        │ ❌          │ 1           │ 🔄 В розробці│
│ RoofElement2│ Roof        │ ❌          │ 1           │ 🔄 В розробці│
│ RoofElement3│ Roof        │ ❌          │ 1           │ 🔄 В розробці│
│ Flowerbeds  │ Stands      │ ❌          │ 1           │ ✅ Реалізовано│
│ Gravestones │ Stands      │ ❌          │ 1           │ ✅ Реалізовано│
│ Lamps       │ Gravestones │ ❌          │ 1           │ ✅ Реалізовано│
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

---

*Легенда:*
- ✅ Реалізовано
- 🔄 В розробці  
- ❌ Не реалізовано
- ⚠️ Потребує доопрацювання

---

*Останнє оновлення: [Дата]*
*Версія діаграм: 1.0*
*Використовувати разом з ARCHITECTURE.md та ARCHITECTURE_CHECKLIST.md*
