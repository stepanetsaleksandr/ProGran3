# 🌍 Система багатомовності ProGran3

## 📋 Огляд

Система багатомовності ProGran3 дозволяє легко перемикати між різними мовами інтерфейсу. Підтримуються українська, польська та англійська мови з можливістю легкого додавання нових мов.

## 🏗️ Архітектура

### Структура файлів:
```
proGran3/web/i18n/
├── I18nManager.js          # Основний менеджер i18n
├── locales/
│   ├── uk.json            # Українські переклади
│   ├── pl.json            # Польські переклади
│   └── en.json            # Англійські переклади
└── utils/                 # Допоміжні утиліти (майбутнє)
```

### Модулі:
- **I18nManager**: Центральний менеджер для завантаження та застосування перекладів
- **LanguageSwitcher**: UI компонент для перемикання мов
- **JSON файли**: Структуровані переклади для кожної мови

## 🚀 Використання

### Ініціалізація:
```javascript
// Автоматично ініціалізується в script.js
await initializeI18n();
```

### Отримання перекладу:
```javascript
// Використання глобальної функції
const translation = t('ui.foundation');

// Або через менеджер
const translation = ProGran3.I18n.Manager.t('ui.foundation');
```

### Зміна мови:
```javascript
// Програмно
await changeLanguage('en');

// Через UI перемикач (автоматично)
```

## 📝 Структура перекладів

### Категорії:
- **ui**: Основні елементи інтерфейсу
- **buttons**: Кнопки та дії
- **dimensions**: Розміри та параметри
- **units**: Одиниці вимірювання
- **messages**: Повідомлення та статуси
- **tabs**: Назви табів
- **panels**: Назви панелей
- **summary**: Елементи специфікації
- **language**: Назви мов
- **carousel**: Елементи каруселей

### Приклад структури:
```json
{
  "ui": {
    "foundation": "Фундамент",
    "stele": "Стела"
  },
  "buttons": {
    "create": "Створити",
    "add": "Додати"
  }
}
```

## 🎨 HTML інтеграція

### data-i18n атрибути:
```html
<h2 data-i18n="panels.foundation">Фундамент</h2>
<button data-i18n="buttons.create">Створити</button>
```

### Автоматичне оновлення:
- Всі елементи з `data-i18n` автоматично оновлюються при зміні мови
- Підтримуються input placeholder та title атрибути
- Динамічний контент оновлюється через `updateDynamicContent()`

## 🔧 API

### I18nManager:
```javascript
// Ініціалізація
await I18nManager.init()

// Отримання перекладу
I18nManager.t(key, params)

// Зміна мови
await I18nManager.changeLanguage(lang)

// Отримання поточної мови
I18nManager.getCurrentLanguage()

// Список підтримуваних мов
I18nManager.getSupportedLanguages()
```

### LanguageSwitcher:
```javascript
// Ініціалізація
LanguageSwitcher.init()

// Оновлення перемикача
LanguageSwitcher.updateSwitcher(currentLang)
```

## 🌐 Підтримувані мови

| Код | Назва | Прапор | Статус |
|-----|-------|--------|--------|
| uk | Українська | 🇺🇦 | ✅ Повна підтримка |
| pl | Polski | 🇵🇱 | ✅ Повна підтримка |
| en | English | 🇬🇧 | ✅ Повна підтримка |

## ➕ Додавання нової мови

### 1. Створіть JSON файл:
```bash
# Створіть файл proGran3/web/i18n/locales/de.json
```

### 2. Додайте переклади:
```json
{
  "ui": {
    "foundation": "Fundament",
    "stele": "Stele"
  }
}
```

### 3. Оновіть I18nManager:
```javascript
// В I18nManager.js додайте:
supportedLanguages: ['uk', 'pl', 'en', 'de'],
languageNames: {
  'uk': 'Українська',
  'pl': 'Polski',
  'en': 'English',
  'de': 'Deutsch'  // Додайте нову мову
},
languageFlags: {
  'uk': '🇺🇦',
  'pl': '🇵🇱',
  'en': '🇬🇧',
  'de': '🇩🇪'  // Додайте прапор
}
```

### 4. Оновіть LanguageSwitcher:
```javascript
// В LanguageSwitcher.js додайте опцію:
<div class="language-option" data-lang="de">
  <span class="option-flag">🇩🇪</span>
  <span class="option-name">Deutsch</span>
</div>
```

## 🧪 Тестування

### Запуск тестів:
```bash
# Відкрийте в браузері:
proGran3/web/test-i18n.html
```

### Тест функції:
- ✅ Завантаження перекладів
- ✅ Перемикання мов
- ✅ Оновлення UI
- ✅ Збереження вибору
- ✅ Fallback механізми

## 🐛 Відладка

### Логи:
```javascript
// Включіть debug режим
debugLog('I18n message', 'info');
```

### Перевірка стану:
```javascript
// Поточна мова
console.log(I18nManager.getCurrentLanguage());

// Завантажені переклади
console.log(I18nManager.translations);

// Підтримувані мови
console.log(I18nManager.getSupportedLanguages());
```

## 🔄 Fallback механізми

1. **Мова браузера**: Автоматичне визначення
2. **Збережена мова**: localStorage
3. **Мова за замовчуванням**: Українська
4. **Fallback переклади**: Базові переклади в коді
5. **Ключ як значення**: Якщо переклад не знайдено

## 📱 Адаптивність

- Перемикач мов адаптується до мобільних пристроїв
- Підтримка темної теми
- Плавні анімації переходів
- Зручне розташування в header

## 🔮 Майбутні покращення

- [ ] Підтримка RTL мов
- [ ] Плюралізація
- [ ] Формати дат та чисел
- [ ] Локалізація валідації
- [ ] Динамічне завантаження мов
- [ ] Переклади з зовнішніх API
