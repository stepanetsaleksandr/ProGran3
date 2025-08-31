# 📚 Документація архітектури ProGran3

Цей каталог містить повну документацію архітектури проекту ProGran3 для моніторингу та контролю розробки.

## 📋 Структура документації

### 🏗️ Основні документи:
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Повний опис архітектури проекту
- **[ARCHITECTURE_CHECKLIST.md](ARCHITECTURE_CHECKLIST.md)** - Контрольний список для моніторингу
- **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)** - Діаграми та схеми архітектури

## 🎯 Призначення

Ця документація призначена для:
- ✅ **Моніторингу** - перевірки чи не порушується архітектура
- ✅ **Контролю** - дотримання принципів розробки
- ✅ **Навчання** - розуміння структури проекту
- ✅ **Розробки** - посібник при додаванні нових компонентів
- ✅ **Тестування** - перевірки відповідності архітектурі

## 🚀 Швидкий старт

### Для нових розробників:
1. Почніть з **[ARCHITECTURE.md](ARCHITECTURE.md)** - загальний огляд
2. Вивчіть **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)** - візуальне розуміння
3. Використовуйте **[ARCHITECTURE_CHECKLIST.md](ARCHITECTURE_CHECKLIST.md)** - практичний посібник

### Для досвідчених розробників:
1. Перевірте **[ARCHITECTURE_CHECKLIST.md](ARCHITECTURE_CHECKLIST.md)** перед змінами
2. Оновлюйте документацію при змінах архітектури
3. Дотримуйтесь принципів SOLID та архітектурних шарів

## 🔍 Ключові принципи

### 🏛️ Архітектурні шари:
- **Presentation Layer** - UI (HTML/CSS/JavaScript)
- **Communication Layer** - SketchUpBridge та callback система
- **Business Logic Layer** - ModelStateManager та CoordinationManager
- **Data Access Layer** - Loader, Builders, Preview Extractor
- **Infrastructure Layer** - Error Handler, Logger, SketchUp API

### 🎯 Центральні компоненти:
- **ModelStateManager** - управління станом моделі
- **CoordinationManager** - координація компонентів
- **CallbackManager** - система callback'ів
- **CarouselManager** - система каруселей

### 🔗 Залежності:
- Foundation → Stands → SteleBlock → (FirstStele, SecondStele)
- Stands → (Flowerbeds, Gravestones)
- Gravestones → Lamps

## 📊 Статус реалізації

### ✅ Реалізовано:
- Foundation, BlindArea, Tiles, Cladding, Fence
- Stands, Flowerbeds, Gravestones, Lamps
- Базова архітектура та система callback'ів

### 🔄 В розробці:
- ModelStateManager (центральний компонент)
- SteleBlock з конфігураціями
- Розширена система залежностей

### ❌ Планується:
- Portrait, Inscription, BrassDecor, Columns
- BetweenSteles, Cross, AttachedDetail
- Roof з елементами

## 🛠️ Інструменти моніторингу

### Контрольний список:
Використовуйте **[ARCHITECTURE_CHECKLIST.md](ARCHITECTURE_CHECKLIST.md)** для:
- Перевірки перед додаванням компонентів
- Контролю змін існуючих компонентів
- Діагностики проблем

### Діаграми:
Використовуйте **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)** для:
- Візуального розуміння архітектури
- Аналізу потоків даних
- Перевірки залежностей

## 📝 Правила оновлення

### При зміні архітектури:
1. Оновіть **[ARCHITECTURE.md](ARCHITECTURE.md)**
2. Оновіть **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)**
3. Оновіть **[ARCHITECTURE_CHECKLIST.md](ARCHITECTURE_CHECKLIST.md)**
4. Змініть версію документації

### При додаванні компонента:
1. Перевірте **[ARCHITECTURE_CHECKLIST.md](ARCHITECTURE_CHECKLIST.md)**
2. Оновіть матрицю залежностей
3. Додайте в ModelStateManager
4. Оновіть діаграми

## 🚨 Критичні правила

### ❌ НЕ ПОРУШУВАТИ:
- Принципи SOLID
- Архітектурні шари
- Систему залежностей
- ModelStateManager як центральний компонент
- Callback систему

### ✅ ОБОВ'ЯЗКОВО:
- Перевіряти залежності
- Використовувати ModelStateManager
- Додавати callback'и через callback_manager.rb
- Тестувати зміни
- Оновлювати документацію

## 📞 Підтримка

### Якщо щось не працює:
1. Перевірте **[ARCHITECTURE_CHECKLIST.md](ARCHITECTURE_CHECKLIST.md)** - розділ "Швидка перевірка"
2. Використайте діаграми з **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)**
3. Перевірте залежності в **[ARCHITECTURE.md](ARCHITECTURE.md)**

### Якщо потрібна допомога:
1. Перевірте логування
2. Перевірте обробку помилок
3. Перевірте callback систему
4. Перевірте ModelStateManager

## 🔄 Версіонування

### Семантичне версіонування:
- **MAJOR** - зміни архітектури
- **MINOR** - нові компоненти
- **PATCH** - виправлення помилок

### Документація:
- Версія документації відповідає версії проекту
- Кожна зміна архітектури = нова версія документації

---

## 📚 Додаткові ресурси

### Код проекту:
- `proGran3/` - основна папка проекту
- `proGran3/web/` - frontend компоненти
- `proGran3/builders/` - будівельники компонентів

### Тестування:
- Unit тести для кожного компонента
- Integration тести для архітектури
- Тести залежностей

### Логування:
- Рівні логування: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Контексти: MODEL_STATE, COORDINATION, LOADER, UI, CAROUSEL, PREVIEW

---

*Останнє оновлення: [Дата]*
*Версія документації: 1.0*
*Автор: ProGran3 Development Team*

---

**💡 Порада:** Зберігайте цю документацію актуальною! Вона - ваш основний інструмент для підтримки якості коду та архітектури проекту.
