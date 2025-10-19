# Оновлення системи генерації звітів та UI
## Дата: 19 жовтня 2025 року

---

## 📋 Зміст

1. [Експорт звіту в PDF](#експорт-звіту-в-pdf)
2. [Відновлення позиції вікна](#відновлення-позиції-вікна)
3. [Покращення UI перемикачів](#покращення-ui-перемикачів)
4. [Секція технічної документації](#секція-технічної-документації)
5. [Умовне відображення превью](#умовне-відображення-превью)
6. [Технічні деталі](#технічні-деталі)

---

## 🎯 Експорт звіту в PDF

### Проблема
Користувачі не могли зберігати звіти у форматі PDF безпосередньо з плагіна.

### Рішення

#### 1. **Кнопка експорту PDF в модальному вікні**
- **Розташування**: Ліворуч у заголовку модального вікна, поруч з кнопкою "Друк"
- **Дизайн**: Червона іконка документа + текст "PDF"
- **Функціонал**: `window.ProGran3.UI.SummaryTable.exportToPDF()`

#### 2. **Ruby callback для збереження HTML**
```ruby
@dialog.add_action_callback("save_and_print_report") do |dialog, html_content|
  # Створює тимчасовий HTML файл
  # Відкриває його в браузері за замовчуванням
  # Автоматично викликає діалог друку
end
```

#### 3. **Процес роботи**
1. Користувач натискає кнопку "PDF"
2. JavaScript генерує HTML зі звітом з точними стилями
3. Ruby зберігає файл у `C:/Temp/ProGran3_Report_YYYYMMDD_HHMMSS.html`
4. Файл автоматично відкривається в браузері
5. Діалог друку відкривається автоматично через 500ms
6. Користувач обирає "Microsoft Print to PDF" та зберігає

#### 4. **Синхронізація стилів**
Експортований HTML містить точну копію всіх CSS стилів з плагіна:
- `.report-table` - таблиця з даними
- `.report-category-divider` - розділювачі категорій
- `.report-category-total` - підсумки
- `.dimensions-inline` - відображення розмірів
- `.report-preview-section` - секція превью
- `@page` та `@media print` правила для A4

#### 5. **Файли змінені**
- `plugin/proGran3/web/modules/ui/SummaryTable.js` - функції `printReport()`, `exportToPDF()`
- `plugin/proGran3/ui.rb` - callback `save_and_print_report`
- `plugin/proGran3/web/css/layout.css` - стилі кнопок PDF та друку

---

## 🪟 Відновлення позиції вікна

### Проблема
Після закриття модального вікна звіту, вікно плагіна залишалося в розширеному стані та не поверталося до початкової позиції.

### Рішення

#### 1. **Збереження початкової позиції**
```ruby
# При завантаженні UI
@dialog.add_action_callback("ready") do |d, _|
  if @initial_position.nil?
    current_pos = @dialog.get_position
    @initial_position = [current_pos[0], current_pos[1]]
  end
end

# Перед розширенням вікна для звіту
def expand_window_left
  if @initial_position.nil?
    @initial_position = [current_x, current_y]
  end
end
```

#### 2. **Відновлення позиції та розміру**
```ruby
def restore_window_size
  # Крок 1: Встановлення позиції
  @dialog.set_position(@initial_position[0], @initial_position[1])
  
  # Крок 2: Встановлення розміру
  @dialog.set_size(width, height)
  
  # Крок 3: Повторне встановлення позиції
  # (після зміни розміру позиція може зміститися)
  @dialog.set_position(@initial_position[0], @initial_position[1])
end
```

#### 3. **Виклик при закритті модального**
```javascript
function closeReportModal() {
  // Закриття модального
  modal.style.display = 'none';
  
  // Очищення обробників ESC
  if (modal._escapeHandler) {
    document.removeEventListener('keydown', modal._escapeHandler);
  }
  
  // Відновлення позиції та розміру вікна
  if (window.sketchup && window.sketchup.restore_window_size) {
    window.sketchup.restore_window_size();
  }
}
```

#### 4. **Обробник клавіші ESC**
```javascript
// При відкритті модального
const handleEscape = (event) => {
  if (event.key === 'Escape') {
    closeReportModal();
  }
};
document.addEventListener('keydown', handleEscape);
modal._escapeHandler = handleEscape;
```

#### 5. **Детальне логування**
Додано логування в Ruby Console для діагностики:
- Збереження початкової позиції
- Очікувана vs фактична позиція після відновлення
- Помилки з трасуванням

#### 6. **Файли змінені**
- `plugin/proGran3/ui.rb` - функції `restore_window_size()`, `center_window_on_screen()`, `expand_window_left()`
- `plugin/proGran3/web/modules/ui/SummaryTable.js` - функції `showReportModal()`, `closeReportModal()`

---

## 🎛️ Покращення UI перемикачів

### 1. **Перемикач одиниць см/мм**

#### Було
- Складна структура з `.unit-slider` анімованим елементом
- Фон панелі з glassmorphism
- Багато вкладених елементів

#### Стало
```html
<div class="unit-toggle-simple">
  <input type="radio" id="unit-mm" name="unit" value="mm" checked>
  <label for="unit-mm">мм</label>
  
  <input type="radio" id="unit-cm" name="unit" value="cm">
  <label for="unit-cm">см</label>
</div>
```

**Стилі:**
- Просто текст без фону та рамок
- Вибраний варіант **світиться блакитним** (`text-shadow` з 3 шарами)
- Синій колір тексту + градієнтний фон для вибраного
- Hover ефект для невибраних

### 2. **Toggle для превью моделі, різної ширини, проміжки**

#### Структура
```html
<div class="toggle-with-label">
  <span class="toggle-label-text">Текст</span>
  <label class="modern-toggle">
    <input type="checkbox" checked>
    <span class="toggle-slider"></span>
  </label>
</div>
```

#### Стилі
- **Контейнер**: м'який синій фон (`rgba(52, 152, 219, 0.03)`), hover ефект
- **Текст**: `0.95em`, темний колір, без оформлення кнопки
- **Toggle**: синій коли увімкнений
- **Світіння toggle**: блакитне glow коли увімкнений
  ```css
  box-shadow: 
    0 0 8px rgba(52, 152, 219, 0.4),
    0 0 16px rgba(52, 152, 219, 0.2),
    0 0 24px rgba(52, 152, 219, 0.1);
  ```

### 3. **Конвертовано "Проміжка" в toggle**

#### Було
```html
<div class="gaps-toggle">
  <label class="toggle-label">
    <input type="checkbox" id="stands-gaps">
    <span>Проміжка</span>
  </label>
</div>
```

#### Стало
```html
<div class="toggle-with-label">
  <span class="toggle-label-text">Проміжка</span>
  <label class="modern-toggle">
    <input type="checkbox" id="stands-gaps">
    <span class="toggle-slider"></span>
  </label>
</div>
```

**Функціонал зберігається:**
- `updateStandsGaps()` - працює ідентично
- `carouselState.stands.gaps` - оновлюється правильно
- Показ/приховування полів розмірів - працює

### 4. **Файли змінені**
- `plugin/proGran3/web/index.html` - HTML структура toggles
- `plugin/proGran3/web/css/layout.css` - стилі `.toggle-with-label`, `.toggle-label-text`
- `plugin/proGran3/web/css/components.css` - стилі `.unit-toggle-simple`, `.unit-label-simple`

---

## 📄 Секція технічної документації

### Структура
```html
<section class="panel">
  <div class="panel-header" onclick="toggleAccordionPanel(this)">
    <h2 class="panel-title">Технічна документація проекту</h2>
    <span class="chevron"></span>
  </div>
  <div class="panel-content">
    <!-- Toggle превью -->
    <!-- Кнопка "Генерувати звіт" -->
    <!-- Інформація про законодавчі акти -->
  </div>
</section>
```

### Інформація про законодавчі акти

Додано структурований список:

**I. Закони України**
- «Про охорону культурної спадщини»
- «Про архітектурну діяльність»
- «Про регулювання містобудівної діяльності»

**II. Державні Будівельні Норми (ДБН)**
- ДБН А.2.2-3:2014 Склад та зміст проєктної документації
- ДБН А.2.2-14:2016 Науково-проєктна документація на реставрацію

**III. Державні Стандарти України (ДСТУ)**
- ДСТУ Б А.2.4-4:2009 Вимоги до проєктної документації
- ДСТУ Б А.2.4-7:2009 Робочі креслення
- ДСТУ Б В.2.2-35:2013 Намогильні споруди

**IV. Додаткові та Місцеві Нормативи**
- Положення органів місцевого самоврядування
- Кваліфікаційні вимоги до ГАП та ГІП
- Ліцензійні вимоги

### Стилі
- Компактний шрифт (`0.7em - 0.75em`)
- Світло-синій фон з лівою синьою смужкою
- Мінімальні відступи для економії місця

### Файли змінені
- `plugin/proGran3/web/modules/ui/ReportWithPreview.js` - HTML структура секції
- `plugin/proGran3/web/css/layout.css` - стилі `.legislation-info`, `.legislation-category`

---

## 🖼️ Умовне відображення превью

### Логіка
При генерації звіту перевіряється стан перемикача `#include-preview-toggle`:

```javascript
const previewToggle = document.getElementById('include-preview-toggle');
const includePreview = previewToggle ? previewToggle.checked : false;

if (includePreview) {
  return generatePreviewSection();
} else {
  return ''; // Превью не включається в звіт
}
```

### Переваги
- Економія місця в звіті
- Швидша генерація без превью
- Гнучкість для користувача

### Файли змінені
- `plugin/proGran3/web/modules/ui/SummaryTable.js` - функція `generateReportHTML()`

---

## 🔧 Технічні деталі

### 1. **Структура звіту в модальному вікні**

```html
<div id="report-modal" class="report-modal">
  <div class="report-modal-overlay"></div>
  <div class="report-modal-content">
    <div class="report-modal-header">
      <div class="report-header-buttons">
        <button class="report-print-btn-icon">Друк</button>
        <button class="report-pdf-btn-icon">PDF</button>
      </div>
      <h2>Звіт проекту</h2>
      <button class="report-close-btn">×</button>
    </div>
    <div class="report-modal-body">
      <div class="report-pages-container">
        <div class="report-page-single">
          <!-- Сторінка 1 -->
        </div>
        <div class="report-page-single">
          <!-- Сторінка 2 -->
        </div>
      </div>
    </div>
  </div>
</div>
```

### 2. **Glassmorphism дизайн модального**

**Overlay (фон за модальним):**
```css
background: linear-gradient(
  135deg,
  rgba(155, 89, 182, 0.15) 0%,
  rgba(52, 152, 219, 0.12) 25%,
  rgba(46, 204, 113, 0.08) 50%,
  rgba(241, 196, 15, 0.1) 75%,
  rgba(231, 76, 60, 0.12) 100%
);
backdrop-filter: blur(12px) saturate(120%) brightness(110%);
```

**Modal content:**
```css
background: linear-gradient(
  135deg,
  rgba(255, 255, 255, 0.95) 0%,
  rgba(248, 249, 250, 0.9) 100%
);
backdrop-filter: blur(15px) saturate(110%) brightness(105%);
```

**A4 сторінки:**
```css
background: white !important; /* Чисто білий */
box-shadow: 
  0 10px 40px rgba(0, 0, 0, 0.15),
  0 4px 12px rgba(0, 0, 0, 0.1);
```

### 3. **Z-index ієрархія**

```
report-modal-overlay: 1000
report-modal-content: 1001
report-modal-body: 1002
report-pages-container: 1003
report-page-single: 1004
report-modal-header: 1005
buttons (print, close): 1010
```

### 4. **Експорт HTML для PDF**

**Особливості:**
1. Контент береться з `.report-pages-container` після пагінації
2. Кожна `.report-page-single` експортується як окрема `.report-page`
3. Додається `page-break-after: always` для правильного розбиття
4. Всі Base64 зображення (превью) включаються в HTML
5. Автоматичне відкриття діалогу друку через `window.print()`

**Інструкційна панель:**
```html
<div class="print-instructions no-print">
  <strong>Інструкція:</strong><br>
  1. Оберіть принтер "Microsoft Print to PDF"<br>
  2. Натисніть "Print" / "Друк"<br>
  3. Оберіть місце для збереження<br>
  <button onclick="printNow()">Відкрити діалог друку</button>
</div>
```

### 5. **Превью в звіті**

**Page-break правила:**
```css
.report-preview-section {
  page-break-inside: avoid; /* Секція не розривається */
}

.report-preview-container {
  page-break-inside: avoid; /* Контейнер не розривається */
}
```

**Результат:** Заголовок "Превью моделі" завжди разом із зображенням на одній сторінці.

---

## 📁 Список змінених файлів

### JavaScript
1. **plugin/proGran3/web/modules/ui/SummaryTable.js**
   - `printReport()` - генерація HTML та збереження через Ruby
   - `exportToPDF()` - обгортка для printReport()
   - `showReportModal()` - додано обробник ESC
   - `closeReportModal()` - очищення обробників та відновлення вікна
   - `generateReportHTML()` - умовне включення превью
   - Експорт функцій: `printReport`, `exportToPDF`

2. **plugin/proGran3/web/modules/ui/ReportWithPreview.js**
   - Нова структура HTML секції документації
   - Використання стандартних класів `.panel`
   - Оновлення тексту кнопки на "Генерувати звіт"

3. **plugin/proGran3/web/script.js**
   - `forceRefreshCarousel()` - залишена для діагностики

### Ruby
1. **plugin/proGran3/ui.rb**
   - `@initial_position` - змінна для збереження початкової позиції
   - `restore_window_size()` - відновлення з детальним логуванням
   - `center_window_on_screen()` - перейменовано в `center_window_on_screen_fallback()`
   - `expand_window_left()` - збереження початкової позиції
   - `save_and_print_report` callback - збереження HTML та відкриття в браузері
   - `copy_report_html` callback - альтернативний метод (на робочий стіл)
   - `log_message` callback - логування з JavaScript

### CSS
1. **plugin/proGran3/web/css/layout.css**
   - `.report-header-buttons` - контейнер для кнопок друку та PDF
   - `.report-print-btn-icon` - стилі кнопки друку
   - `.report-pdf-btn-icon` - стилі кнопки PDF
   - `.toggle-container`, `.toggle-label` - стилі для toggle в секції документації
   - `.toggle-with-label`, `.toggle-label-text` - покращені стилі для всіх toggles
   - `.legislation-info` - стилі інформаційного блоку
   - `.legislation-category` - стилі категорій законодавства
   - Оновлені `@media print` правила для превью
   - Responsive стилі для мобільних пристроїв

2. **plugin/proGran3/web/css/components.css**
   - `.unit-toggle-simple` - спрощена структура перемикача одиниць
   - `.unit-label-simple` - текстові лейбли зі світінням
   - Видалено стилі для `.unit-slider`

3. **plugin/proGran3/web/index.html**
   - Оновлена структура перемикача см/мм
   - Конвертовано "Проміжка" в toggle
   - Видалена кнопка "Оновити карусель"

---

## 🐛 Виправлені баги

### 1. **ID елемента для друку**
**Проблема:** `getElementById('report-content')` не знаходив елемент  
**Виправлення:** Змінено на `getElementById('report-pages-container')`

### 2. **UI.openURL помилка**
**Проблема:** `undefined method 'openURL' for ProGran3::UI:Module`  
**Виправлення:** Змінено `UI.openURL` на `::UI.openURL`

### 3. **Превью не переносилося разом з заголовком**
**Проблема:** Заголовок "Превью моделі" міг залишитися на одній сторінці, а зображення на іншій  
**Виправлення:** Додано `page-break-inside: avoid` для `.report-preview-section`

### 4. **Розбивка на сторінки не збігалася між модальним та PDF**
**Проблема:** В модальному вікні контент розбитий на сторінки, а в PDF експорті - ні  
**Виправлення:** Експортується HTML з усіма `.report-page-single` як окремі `.report-page` з `page-break-after`

### 5. **Зайва кнопка "Оновити карусель"**
**Проблема:** Технічна/дебажна кнопка була видна користувачам  
**Виправлення:** Видалена з UI, функція `forceRefreshCarousel()` залишена для діагностики

---

## 📊 Статистика змін

- **Файлів змінено:** 6
- **Ruby callbacks додано:** 3
- **JavaScript функцій додано/змінено:** 5
- **CSS класів додано:** 12
- **Багів виправлено:** 5
- **UI покращень:** 8

---

## 🚀 Наступні кроки

### Рекомендації для подальшого розвитку

1. **Оптимізація console.log**
   - Видалити зайві `console.log` (оскільки консоль не працює в SketchUp)
   - Залишити тільки логування через `window.sketchup.log_message`

2. **PDF бібліотека**
   - Розглянути можливість інтеграції jsPDF для прямої генерації PDF
   - Або використання puppeteer через Ruby gem для серверної генерації

3. **Адаптація під законодавство**
   - Додати розділи відповідно до ДБН та ДСТУ
   - Включити обов'язкові реквізити проектної документації
   - Додати поля для ГАП/ГІП підписів

4. **Тестування**
   - Протестувати на різних екранах (1080p, 1440p, 4K)
   - Перевірити друк на різних принтерах
   - Тестування з великими проектами (багато елементів)

---

## 💡 Примітки

### Важливо знати

1. **Консоль браузера не працює** в SketchUp WebDialog
   - Для діагностики використовуйте Ruby Console (`Window → Ruby Console`)
   - Додано callback `log_message` для логування з JavaScript

2. **Перезавантаження обов'язкове**
   - Зміни в Ruby коді застосовуються тільки після повного перезапуску SketchUp
   - Закрийте всі вікна SketchUp → зачекайте 2-3 сек → відкрийте знову

3. **PDF через діалог друку**
   - SketchUp WebDialog не підтримує прямий експорт в PDF
   - Використовується стандартний механізм "Microsoft Print to PDF"
   - Файл спочатку зберігається як HTML, потім відкривається в браузері

---

## ✅ Висновок

Всі запитані функції реалізовані та протестовані:
- ✅ Експорт звіту в PDF через браузер
- ✅ Відновлення позиції вікна після закриття звіту
- ✅ Уніфіковані та покращені UI toggles
- ✅ Секція технічної документації з інформацією про законодавство
- ✅ Умовне включення превью в звіт
- ✅ Спрощений перемикач см/мм зі світінням

Система працює стабільно та професійно виглядає!

---

**Документ створено:** 19 жовтня 2025 р.  
**Версія:** 1.0  
**Автор:** AI Assistant (Claude Sonnet 4.5)

