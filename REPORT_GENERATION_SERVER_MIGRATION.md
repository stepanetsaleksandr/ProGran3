# 📊 Аналіз: Винесення генерації звіту на сервер

**Дата:** 23 жовтня 2025  
**Модуль:** Технічна документація проекту

---

## 🔍 ПОТОЧНА РЕАЛІЗАЦІЯ

### **Архітектура:**

```
┌─────────────────────────────────────────────────────┐
│  WEB UI (JavaScript)                                │
├─────────────────────────────────────────────────────┤
│  • Кнопка "Генерувати звіт"                         │
│  • Toggle "Включити превью"                         │
│  • generateReportWithPreview()                      │
└─────────────────────────────────────────────────────┘
                      ↓ sketchup.generate_report()
┌─────────────────────────────────────────────────────┐
│  RUBY PLUGIN (CallbackManager)                      │
├─────────────────────────────────────────────────────┤
│  • generate_report_callback()                       │
│  • get_detailed_summary_callback()                  │
│  • Збір ВСІХ компонентів з SketchUp Model          │
│  • Розрахунок площ та об'ємів                       │
│  • Кешування (SummaryCache)                         │
│  • Валідація (SummaryValidator)                     │
└─────────────────────────────────────────────────────┘
                      ↓ entities.grep(ComponentInstance)
┌─────────────────────────────────────────────────────┐
│  SKETCHUP API                                       │
├─────────────────────────────────────────────────────┤
│  • model.entities                                   │
│  • component.bounds                                 │
│  • face.area                                        │
│  • transformation.scale                             │
└─────────────────────────────────────────────────────┘
```

---

## 📋 ЩО РОБИТЬ ГЕНЕРАЦІЯ ЗВІТУ

### **Крок 1: Збір даних з SketchUp моделі**

**Файл:** `callback_manager.rb:1018-1860`

```ruby
def self.get_detailed_summary_callback(dialog, for_report: false)
  model = Sketchup.active_model
  entities = model.entities
  
  summary = {
    foundation: [],
    tiles: [],
    cladding: [],
    blind_area: [],
    stands: [],
    steles: [],
    flowerbeds: [],
    # ...
  }
  
  # Збираємо ВСІ компоненти
  entities.grep(Sketchup::ComponentInstance).each do |component|
    name = component.definition.name
    bounds = component.bounds
    
    # Розміри
    width_cm = (bounds.width.to_mm / 10.0).round(1)
    depth_cm = (bounds.depth.to_mm / 10.0).round(1)
    height_cm = (bounds.height.to_mm / 10.0).round(1)
    
    # Площа (складні розрахунки з гранями)
    component.definition.entities.grep(Sketchup::Face).each do |face|
      if face.normal.z > 0.9  # Верхня грань
        area += face.area * scale_x * scale_y
      end
    end
    area_m2 = (area / 1550.0031).round(2)
    
    # Об'єм
    volume_m3 = (bounds.volume * 0.000016387064).round(3)
    
    # Матеріал
    material = get_component_material(component)
    
    summary[:category] << {
      name, width, depth, height,
      area_m2, volume_m3, material
    }
  end
  
  # Кешуємо
  SummaryCache.cache_summary(summary)
  
  # Повертаємо в JavaScript
  dialog.execute_script("updateDetailedSummary(#{summary.to_json});")
end
```

**Залежності від SketchUp API:**
- ✅ `Sketchup.active_model` - активна модель
- ✅ `model.entities` - всі об'єкти
- ✅ `ComponentInstance` - компоненти
- ✅ `bounds` - габарити
- ✅ `Face.area` - площа граней
- ✅ `transformation` - позиція та scale

**Можна замінити API?** ❌ **НІ** - ці дані є ТІЛЬКИ в SketchUp

---

### **Крок 2: Генерація HTML звіту**

**Файл:** `web/modules/ui/SummaryTable.js:826-1864`

```javascript
function generateReportHTML(data) {
  const categories = [
    { key: 'foundation', title: 'Фундамент' },
    { key: 'tiles', title: 'Плитка' },
    { key: 'cladding', title: 'Облицювання' },
    { key: 'blind_area', title: 'Відмостка' },
    { key: 'stands', title: 'Підставки' },
    { key: 'steles', title: 'Стели' },
    // ...
  ];
  
  let html = `
    <html>
      <head>
        <style>
          /* CSS для звіту */
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1>Технічна документація</h1>
          <div>Проект: ${projectName}</div>
          <div>Дата: ${currentDate}</div>
        </div>
        
        <!-- Превью моделі (якщо є) -->
        ${previewImage ? `<img src="${previewImage}">` : ''}
        
        <!-- Таблиці для кожної категорії -->
        ${categories.map(cat => generateCategoryTable(data[cat.key], cat.title)).join('')}
        
        <!-- Підсумки -->
        <div class="summary">
          Загальна площа: ${totalArea} м²
          Загальний об'єм: ${totalVolume} м³
        </div>
      </body>
    </html>
  `;
  
  return html;
}
```

**Залежності від SketchUp API:** ❌ **НЕМАЄ**

**Можна замінити?** ✅ **ТАК** - це просто HTML generation

---

## 🎯 ЧИ МОЖНА ВИНЕСТИ НА СЕРВЕР?

### **ВІДПОВІДЬ: ЧАСТКОВО** ⚡

---

## ✅ ЩО МОЖНА ВИНЕСТИ НА СЕРВЕР

### **1. HTML Generation** ⭐⭐⭐⭐⭐

**Складність:** 🟢 Низька (1-2 дні)

**ЯК:**

```typescript
// SERVER: POST /api/reports/generate
export async function POST(req: Request) {
  const { data, preview_image, options } = await req.json();
  
  // Validate license
  const license = await validateLicense(req);
  if (!license.valid) {
    return Response.json({ error: 'Invalid license' });
  }
  
  // Generate HTML report
  const html = generateReportHTML({
    data: data,
    preview: preview_image,
    template: options.template || 'default',
    locale: options.locale || 'uk'
  });
  
  // Optionally: Generate PDF
  if (options.format === 'pdf') {
    const pdf = await generatePDF(html);
    return new Response(pdf, {
      headers: { 'Content-Type': 'application/pdf' }
    });
  }
  
  return Response.json({ 
    success: true, 
    html: html,
    url: await uploadToStorage(html)  // CDN link
  });
}
```

**PLUGIN:**
```ruby
def self.generate_report_callback(dialog)
  # 1. Збираємо дані локально (SketchUp API)
  summary = collect_summary_data
  
  # 2. Генеруємо превью локально (SketchUp API)
  preview = generate_preview_image if include_preview
  
  # 3. Відправляємо на сервер для генерації HTML
  response = ApiClient.post('/api/reports/generate', {
    data: summary,
    preview_image: preview,
    options: {
      template: 'default',
      format: 'html',  # або 'pdf'
      locale: 'uk'
    }
  })
  
  # 4. Відкриваємо згенерований звіт
  if response[:success]
    open_report_in_browser(response[:url])  # Відкрити CDN link
    # АБО
    show_report_in_dialog(response[:html])  # Показати в WebDialog
  end
end
```

**ПЕРЕВАГИ:**
- ✅ Різні templates без апдейту плагіна
- ✅ PDF generation (потужніше на сервері)
- ✅ Брендування (логотипи, watermarks)
- ✅ Мультимовність (server-side)
- ✅ Збереження звітів в cloud
- ✅ Email delivery
- ✅ Analytics (які звіти генеруються)

**НЕДОЛІКИ:**
- ⚠️ Потрібен інтернет
- ⚠️ Латентність (2-5 секунд)
- ⚠️ Privacy concerns (дані на сервері)

---

### **2. Report Templates** ⭐⭐⭐⭐⭐

**Складність:** 🟢 Низька (1 день)

**ЯК:**

```typescript
// SERVER: GET /api/reports/templates
export async function GET() {
  const templates = await supabase
    .from('report_templates')
    .select('*')
    .eq('active', true);
  
  return Response.json({ templates });
}

// Шаблони в БД:
{
  id: 'default',
  name: 'Стандартний звіт',
  html_template: '<html>...</html>',
  css: 'body { ... }',
  locale: 'uk'
}

{
  id: 'dbn',
  name: 'ДБН-сумісний',
  html_template: '<html>...</html>',
  compliance: ['ДБН А.2.2-3:2014', ...]
}
```

**PLUGIN:**
```ruby
# Завантажити templates при запуску
templates = ApiClient.get('/api/reports/templates')

# Показати в UI
dialog.execute_script("setAvailableTemplates(#{templates.to_json});")

# При генерації - вибрати template
response = ApiClient.post('/api/reports/generate', {
  data: summary,
  template_id: selected_template
})
```

**ПЕРЕВАГИ:**
- ✅ Динамічні шаблони
- ✅ ДБН compliance (оновлюється на сервері)
- ✅ Custom брендування для клієнтів
- ✅ Версіонування шаблонів

---

### **3. PDF Generation** ⭐⭐⭐⭐⭐

**Складність:** 🟠 Середня (2-3 дні)

**ЯК:**

```typescript
// SERVER: використати Puppeteer
import puppeteer from 'puppeteer';

async function generatePDF(html: string, options: any) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setContent(html);
  
  const pdf = await page.pdf({
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm' },
    printBackground: true,
    ...options
  });
  
  await browser.close();
  
  return pdf;
}
```

**ПЕРЕВАГИ:**
- ✅ Професійні PDF
- ✅ Підписи та watermarks
- ✅ Архівація в cloud
- ✅ Email delivery

---

### **4. Report Storage & History** ⭐⭐⭐⭐

**Складність:** 🟠 Середня (1-2 дні)

**ЯК:**

```typescript
// SERVER: POST /api/reports/save
{
  project_name: 'Проект Львів 001',
  summary_data: { ... },
  preview_image: 'base64...',
  license_key: '...'
}
→ Зберегти в БД + S3/Vercel Blob

// GET /api/reports/history
→ Список всіх звітів користувача

// GET /api/reports/:id/download
→ Завантажити старий звіт
```

**ПЕРЕВАГИ:**
- ✅ Історія звітів
- ✅ Доступ з будь-якого ПК
- ✅ Sharing (для клієнтів)
- ✅ Версіонування

---

## ❌ ЩО НЕ МОЖНА ВИНЕСТИ НА СЕРВЕР

### **1. Збір даних з SketchUp моделі** 🔴

**Чому:** Доступ до 3D geometry є ТІЛЬКИ через SketchUp API

```ruby
# ЦЕ МОЖНА ТІЛЬКИ ЛОКАЛЬНО:
model = Sketchup.active_model
entities = model.entities.grep(Sketchup::ComponentInstance)

component.bounds              # Габарити
component.definition.entities # Внутрішня геометрія
face.area                     # Площа граней
transformation.scale          # Масштаб
```

**Сервер НЕ має доступу** до:
- SketchUp model data
- 3D geometry
- Component definitions
- Face normals
- Transformations

**Альтернатива:** Експорт моделі в формат (JSON/GLTF) → відправка на сервер

**Складність:** 🔴 ДУЖЕ висока  
**Доцільність:** ❌ НІ (занадто складно)

---

### **2. Preview Generation** 🔴

**Чому:** Screenshot потребує SketchUp viewport

```ruby
# ЦЕ МОЖНА ТІЛЬКИ ЛОКАЛЬНО:
view = model.active_view
view.write_image(temp_file, 800, 800, true, 0.9)
```

**Сервер НЕ може:**
- Рендерити 3D моделі SketchUp
- Генерувати screenshots
- Застосовувати SketchUp camera views

**Альтернатива:** Three.js renderer на сервері (потребує експорт геометрії)

**Складність:** 🔴 ДУЖЕ висока  
**Доцільність:** ❌ НІ

---

## 🎯 РЕКОМЕНДОВАНА АРХІТЕКТУРА

### **HYBRID APPROACH** ⭐⭐⭐⭐⭐

```
┌─────────────────────────────────────────────────────┐
│  PLUGIN (Local)                                     │
├─────────────────────────────────────────────────────┤
│  ✅ Збір даних з SketchUp моделі                     │
│  ✅ Розрахунок площ та об'ємів                       │
│  ✅ Генерація preview image                         │
│  ✅ Кешування (локально)                            │
│                                                     │
│  ↓ Відправка на сервер:                            │
│  {                                                  │
│    summary_data: { ... },                          │
│    preview_image: 'base64...',                     │
│    template_id: 'dbn_2024',                        │
│    format: 'pdf'                                   │
│  }                                                  │
└─────────────────────────────────────────────────────┘
                      ↓ HTTPS POST /api/reports/generate
┌─────────────────────────────────────────────────────┐
│  SERVER (Next.js + Vercel)                          │
├─────────────────────────────────────────────────────┤
│  ✅ License validation                               │
│  ✅ Template selection                              │
│  ✅ HTML generation (з template)                    │
│  ✅ PDF generation (Puppeteer)                      │
│  ✅ Watermark/Branding                              │
│  ✅ Storage (S3/Vercel Blob)                        │
│  ✅ Email delivery                                  │
│  ✅ Analytics                                       │
│                                                     │
│  ↓ Response:                                       │
│  {                                                  │
│    success: true,                                  │
│    report_url: 'https://cdn.../report.pdf',       │
│    report_id: '12345'                             │
│  }                                                  │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  PLUGIN (Local) - Відкриває звіт                    │
├─────────────────────────────────────────────────────┤
│  • Відкрити PDF в браузері                          │
│  • Зберегти локально                                │
│  • Показати в WebDialog                             │
└─────────────────────────────────────────────────────┘
```

---

## 💰 ROI АНАЛІЗ

### **Варіант 1: Залишити як є (Local)**

**Переваги:**
- ✅ Працює offline
- ✅ Швидко (немає network delay)
- ✅ Privacy (дані локально)
- ✅ Просто

**Недоліки:**
- ❌ Складно оновлювати templates
- ❌ Немає PDF
- ❌ Немає cloud storage
- ❌ Немає email delivery

**ROI:** 🔵 Нейтральний

---

### **Варіант 2: Hybrid (Рекомендований)**

**Переваги:**
- ✅ Динамічні templates
- ✅ Професійні PDF
- ✅ Cloud storage
- ✅ Email delivery
- ✅ ДБН compliance (оновлюється)
- ✅ Analytics

**Недоліки:**
- ⚠️ Потрібен інтернет
- ⚠️ 2-5 секунд delay
- ⚠️ 2-3 дні розробки

**ROI:** 🟢 **ВИСОКИЙ**

**Додаткові можливості:**
- 💰 Premium templates ($10-20)
- 💰 PDF with signatures ($50)
- 💰 Automated compliance check ($30)

---

### **Варіант 3: Full Server-Side**

**НЕ МОЖЛИВО** - потрібен доступ до SketchUp geometry

---

## 📊 ТЕХНІЧНА РЕАЛІЗАЦІЯ

### **Phase 1: Server Endpoints (1 день)**

```typescript
// 1. POST /api/reports/generate
// 2. GET /api/reports/templates
// 3. POST /api/reports/save
// 4. GET /api/reports/history
// 5. GET /api/reports/:id/download
```

### **Phase 2: Plugin Integration (1 день)**

```ruby
# Модифікувати generate_report_callback:
def self.generate_report_callback(dialog)
  # 1. Збір даних (локально)
  summary = collect_summary_data
  preview = generate_preview_image
  
  # 2. Відправка на сервер
  response = ApiClient.post('/api/reports/generate', {
    data: summary,
    preview: preview,
    template_id: get_selected_template,
    format: 'pdf'
  })
  
  # 3. Відкрити результат
  open_report(response[:report_url])
end
```

### **Phase 3: Advanced Features (опціонально)**

```typescript
// Email delivery
POST /api/reports/email
{
  report_id: '12345',
  recipients: ['client@example.com']
}

// Compliance check
POST /api/reports/validate-compliance
{
  summary_data: { ... },
  standards: ['ДБН А.2.2-3:2014']
}
→ { compliant: true, issues: [] }
```

---

## 🎯 ФІНАЛЬНА РЕКОМЕНДАЦІЯ

### **ТАК, МОЖНА І ВАРТО!** ✅

**Що винести:**
1. ✅ HTML generation
2. ✅ PDF generation
3. ✅ Template management
4. ✅ Report storage
5. ✅ Email delivery

**Що залишити локально:**
1. ✅ Збір даних з SketchUp
2. ✅ Preview generation
3. ✅ Caching

---

## 📈 ОЧІКУВАНІ РЕЗУЛЬТАТИ

### **Business:**
- 💰 +$20-50 за premium звіти
- 📊 Analytics які звіти генеруються
- 👥 Email marketing через delivery
- 🚀 Нові features без апдейту

### **Technical:**
- 🔄 Легке оновлення templates
- 📄 Професійні PDF
- ☁️ Cloud storage
- 📧 Automated delivery

### **User:**
- ✅ Краща якість звітів
- ✅ Доступ до історії
- ✅ Email клієнтам
- ✅ ДБН compliance

---

## ⏱️ TIMELINE

**Week 1:**
- Day 1-2: Server endpoints
- Day 3-4: Plugin integration
- Day 5: Testing

**Week 2:**
- Day 1-2: PDF generation
- Day 3: Email delivery
- Day 4-5: Templates + UI

**Total:** 2 тижні для повної реалізації

---

## ✅ ВИСНОВОК

**ТАК, винесення генерації звіту на сервер:**
- ✅ МОЖЛИВО (частково)
- ✅ ДОЦІЛЬНО (high ROI)
- ✅ РЕКОМЕНДОВАНО (premium feature)

**Початок:** HTML generation + templates  
**Потім:** PDF + storage + email  
**Довгострок:** Compliance checking + AI analysis

**Хочеш щоб я реалізував server endpoint для звітів?** 🚀

