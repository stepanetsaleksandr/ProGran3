# 📊 Система "Підсумок проекту" - Детальна документація

**Версія:** 1.0  
**Дата:** 18 жовтня 2025  
**Проект:** ProGran3 Plugin for SketchUp

---

## 📑 ЗМІСТ

1. [Огляд системи](#огляд-системи)
2. [Ключові патерни](#ключові-патерни)
3. [Конвертація одиниць](#конвертація-одиниць)
4. [Розрахунок площі](#розрахунок-площі)
5. [Розрахунок об'єму](#розрахунок-обєму)
6. [Робота з компонентами](#робота-з-компонентами)
7. [Типи компонентів](#типи-компонентів)
8. [Груп���вання даних](#групування-даних)
9. [Відображення в UI](#відображення-в-ui)
10. [Практичні приклади](#практичні-приклади)

---

## 🎯 ОГЛЯД СИСТЕМИ

### Призначення

Система "Підсумок проекту" автоматично аналізує SketchUp модель та генерує детальну специфікацію всіх компонентів з розрахунком:
- Розмірів у сантиметрах
- Площі верхніх/найбільших граней у м²
- Об'єму у м³
- Кількості однакових компонентів
- Загальних сум

### Архітектура

```
Ruby Backend (callback_manager.rb)
  ↓ Збір даних з моделі
  ↓ Розрахунок площ та об'ємів
  ↓ Групування за типами
  ↓ JSON serialization
  ↓
JavaScript Frontend (SummaryTable.js)
  ↓ Групування за розмірами
  ↓ Агрегація сум
  ↓ Форматування тексту
  ↓
HTML Display (index.html)
  ↓ Відображення в таблиці
```

### Компоненти системи

**Backend (Ruby):**
- `get_detailed_summary_callback()` - головна функція збору
- Спеціалізовані обробники для кожного типу компонента
- Helper функції для матеріалів та групування

**Frontend (JavaScript):**
- `refreshDetailedSummary()` - ініціює запит
- `updateDetailedSummary(data)` - обробляє отримані дані
- Спеціалізовані обробники для кожного типу

---

## 🔑 КЛЮЧОВІ ПАТЕРНИ

### Патерн 1: Простий компонент (Foundation, Stand)

**Характеристики:**
- Один компонент на модель
- Прямі грані (куб/паралелепіпед)
- Площа = верхня грань
- Об'єм = bounds

**Ruby код:**
```ruby
when "Foundation"
  bounds = component.bounds
  trans = component.transformation
  
  # 1. Розміри в см
  width_cm = (bounds.width.to_mm / 10.0).round(1)
  depth_cm = (bounds.depth.to_mm / 10.0).round(1)
  height_cm = (bounds.height.to_mm / 10.0).round(1)
  
  # 2. Площа верхньої грані
  scale_x = trans.xscale
  scale_y = trans.yscale
  
  top_area = 0
  component.definition.entities.grep(Sketchup::Face).each do |face|
    if face.normal.z > 0.9  # Верхня грань (нормаль вгору)
      top_area += face.area * scale_x * scale_y
    end
  end
  area_m2 = (top_area / 1550.0031).round(2)
  
  # 3. Об'єм
  volume_cu_inches = bounds.width * bounds.depth * bounds.height
  volume_m3 = (volume_cu_inches * 0.000016387064).round(3)
  
  # 4. Створення item
  item = {
    name: name,
    width: width_cm,
    depth: depth_cm,
    height: height_cm,
    area_m2: area_m2,
    volume_m3: volume_m3,
    material: get_component_material(component)
  }
  summary[:foundation] << item
```

---

### Патерн 2: Рамкова структура (BlindArea)

**Характеристики:**
- Рамка навколо фундаменту
- Може мати вкладені компоненти/групи
- Площа = сума всіх верхніх граней (рекурсивно)
- Об'єм = площа × товщина (не bounds!)

**Ruby код:**
```ruby
when /BlindArea/
  bounds = component.bounds
  trans = component.transformation
  
  # Розміри
  width_cm = (bounds.width.to_mm / 10.0).round(1)
  depth_cm = (bounds.depth.to_mm / 10.0).round(1)
  height_cm = (bounds.height.to_mm / 10.0).round(1)
  
  # РЕКУРСИВНИЙ пошук граней
  top_area = 0
  
  process_entities = lambda do |entities, transformation|
    entities.each do |entity|
      if entity.is_a?(Sketchup::Face)
        normal = entity.normal.transform(transformation)
        
        if normal.z > 0.9  # Верхня грань
          sx = transformation.xscale
          sy = transformation.yscale
          face_area = entity.area * sx * sy
          top_area += face_area
        end
        
      elsif entity.is_a?(Sketchup::ComponentInstance) || entity.is_a?(Sketchup::Group)
        # Рекурсивно заходимо всередину
        new_trans = transformation * entity.transformation
        process_entities.call(entity.definition.entities, new_trans)
      end
    end
  end
  
  # Запуск рекурсії
  process_entities.call(component.definition.entities, component.transformation)
  
  area_m2 = (top_area / 1550.0031).round(2)
  
  # Об'єм = площа × товщина (найменший розмір)
  thickness_mm = [bounds.width.to_mm, bounds.depth.to_mm, bounds.height.to_mm].min
  thickness_m = thickness_mm / 1000.0
  volume_m3 = (area_m2 * thickness_m).round(3)
```

**Чому НЕ bounds для об'єму:**
- `bounds.width × bounds.depth × bounds.height` = об'єм з дірою ❌
- `площа_верху × товщина` = реальний об'єм матеріалу ✅

---

### Патерн 3: Множинні окремі компоненти (Tiles, Cladding)

**Характеристики:**
- Багато окремих компонентів
- Можуть бути різних розмірів
- Потрібно групування за розмірами
- Загальна сума площ та об'ємів

**Ruby код:**
```ruby
when /Perimeter_Tile|Modular_Tile/
  # Кожна плитка - окремий компонент
  bounds = component.bounds
  trans = component.transformation
  
  # Розміри
  width_cm = (bounds.width.to_mm / 10.0).round(1)
  depth_cm = (bounds.depth.to_mm / 10.0).round(1)
  height_cm = (bounds.height.to_mm / 10.0).round(1)
  
  # Площа верхньої грані
  scale_x = trans.xscale
  scale_y = trans.yscale
  
  top_area = 0
  component.definition.entities.grep(Sketchup::Face).each do |face|
    if face.normal.z > 0.9
      top_area += face.area * scale_x * scale_y
    end
  end
  area_m2 = (top_area / 1550.0031).round(3)
  
  # Об'єм
  volume_cu_inches = bounds.width * bounds.depth * bounds.height
  volume_m3 = (volume_cu_inches * 0.000016387064).round(4)
  
  item = {
    name: name,
    width: width_cm,
    depth: depth_cm,
    height: height_cm,
    area_m2: area_m2,
    volume_m3: volume_m3,
    material: get_component_material(component)
  }
  summary[:tiles] << item
```

**JavaScript групування:**
```javascript
// Групуємо плитки за розмірами
const grouped = {};

data.tiles.forEach(tile => {
  const key = `${tile.depth}×${tile.width}×${tile.height}`;
  
  if (!grouped[key]) {
    grouped[key] = {
      depth: tile.depth,
      width: tile.width,
      height: tile.height,
      count: 0,
      totalArea: 0,
      totalVolume: 0
    };
  }
  
  grouped[key].count++;
  grouped[key].totalArea += (tile.area_m2 || 0);
  grouped[key].totalVolume += (tile.volume_m3 || 0);
});

// Відображення
Object.values(grouped).forEach(group => {
  console.log(`Плитка ${group.depth}×${group.width}×${group.height} см - ${group.count} шт`);
  console.log(`  Площа: ${group.totalArea.toFixed(3)} м²`);
  console.log(`  Об'єм: ${group.totalVolume.toFixed(4)} м³`);
});
```

---

### Патерн 4: Вертикальні компоненти (Cladding)

**Характеристики:**
- Вертикальна орієнтація
- Площа = найбільша грань (не обов'язково верхня!)
- Потрібен аналіз орієнтації кожної грані

**Ruby код:**
```ruby
when /Cladding/
  bounds = component.bounds
  trans = component.transformation
  
  scale_x = trans.xscale
  scale_y = trans.yscale
  scale_z = trans.zscale
  
  # Шукаємо НАЙБІЛЬШУ грань (не тільки верхню)
  max_area = 0
  
  component.definition.entities.grep(Sketchup::Face).each do |face|
    normal = face.normal.transform(trans)
    
    # Площа залежить від орієнтації
    if normal.z.abs > 0.9  # Горизонтальна (XY площина)
      face_area = face.area * scale_x * scale_y
    elsif normal.x.abs > 0.9  # Вертикальна (YZ площина)
      face_area = face.area * scale_y * scale_z
    elsif normal.y.abs > 0.9  # Вертикальна (XZ площина)
      face_area = face.area * scale_x * scale_z
    else
      # Похила грань
      avg_scale = Math.sqrt(scale_x * scale_y * scale_z)
      face_area = face.area * avg_scale * avg_scale
    end
    
    max_area = face_area if face_area > max_area
  end
  
  area_m2 = (max_area / 1550.0031).round(3)
  
  # Позначаємо як вертикальну
  item = {
    # ... інші поля ...
    area_m2: area_m2,
    tile_type: "вертикальна"
  }
```

---

### Патерн 5: Контейнер з внутрішніми компонентами (Flowerbed, CornerFence)

**Характеристики:**
- Головний компонент - контейнер
- Всередині 2-3+ компоненти
- НЕ показуємо контейнер, тільки внутрішні
- Кожен внутрішній компонент обробляється окремо

**Ruby код:**
```ruby
when /flowerbed/i
  # Квітник містить внутрішні компоненти
  internal_components = component.definition.entities.grep(Sketchup::ComponentInstance)
  
  # Обробляємо ТІЛЬКИ внутрішні (не сам квітник)
  internal_components.each do |internal|
    bounds = internal.bounds
    
    # ВАЖЛИВО: комбінована трансформація (контейнер * внутрішній)
    combined_trans = component.transformation * internal.transformation
    
    # Розміри
    width_cm = (bounds.width.to_mm / 10.0).round(1)
    depth_cm = (bounds.depth.to_mm / 10.0).round(1)
    height_cm = (bounds.height.to_mm / 10.0).round(1)
    
    # Площа (з комбінованою трансформацією)
    scale_x = combined_trans.xscale
    scale_y = combined_trans.yscale
    
    top_area = 0
    internal.definition.entities.grep(Sketchup::Face).each do |face|
      if face.normal.z > 0.9
        top_area += face.area * scale_x * scale_y
      end
    end
    area_m2 = (top_area / 1550.0031).round(3)
    
    # Об'єм (з урахуванням всіх scale)
    volume_cu_inches = bounds.width * bounds.depth * bounds.height * 
                       scale_x * scale_y * combined_trans.zscale
    volume_m3 = (volume_cu_inches * 0.000016387064).round(4)
    
    item = {
      name: internal.definition.name,  # Назва ВНУТРІШНЬОГО компонента
      width: width_cm,
      depth: depth_cm,
      height: height_cm,
      area_m2: area_m2,
      volume_m3: volume_m3,
      material: get_component_material(internal)
    }
    summary[:flowerbeds] << item
  end
```

**Приклад:**
```
flowerbed_100x50x10.skp (контейнер) - НЕ показується
  ├─ soil_component (грунт) → показується
  ├─ plant_component (рослина) → показується
  └─ border_component (бордюр) → показується
```

---

### Патерн 6: Компоненти з типами (Stand + StandGaps)

**Характеристики:**
- Один тип компонента, але різні варіанти
- Потрібна позначка типу
- Показуються обидва

**Ruby код:**
```ruby
when /stand/i
  bounds = component.bounds
  trans = component.transformation
  
  # ... розміри, площа, об'єм ...
  
  # Визначаємо тип
  is_gaps = name =~ /StandGaps/i
  stand_type = is_gaps ? "проміжна" : "основна"
  
  item = {
    # ... інші поля ...
    stand_type: stand_type  # Додаткове поле!
  }
```

**JavaScript відображення:**
```javascript
const standType = stand.stand_type === 'проміжна' ? 'Проміжна деталь' : 'Підставка';

return `${standType}: ${stand.depth} × ${stand.width} × ${stand.height} см
  Площа: ${area} м²
  Об'єм: ${volume} м³`;
```

---

## 🔄 КОНВЕРТАЦІЯ ОДИНИЦЬ

### ⚠️ КРИТИЧНО ВАЖЛИВО!

**SketchUp внутрішні одиниці:**
- Довжина: **дюйми (inches)**
- Площа: **квадратні дюйми (square inches)**
- Об'єм: **кубічні дюйми (cubic inches)**

### Константи конвертації

```ruby
# === ДОВЖИНА ===
INCH_TO_MM = 25.4
INCH_TO_CM = 2.54
INCH_TO_M = 0.0254

# === ПЛОЩА ===
SQ_INCH_TO_MM2 = 645.16
SQ_INCH_TO_CM2 = 6.4516
SQ_INCH_TO_M2 = 0.00064516
M2_TO_SQ_INCH = 1550.0031

# === ОБ'ЄМ ===
CU_INCH_TO_MM3 = 16387.064
CU_INCH_TO_CM3 = 16.387064
CU_INCH_TO_M3 = 0.000016387064
M3_TO_CU_INCH = 61023.7441
```

### Правильна конвертація

```ruby
# ❌ НЕПРАВИЛЬНО
width_cm = bounds.width / 10.0  # Ділить дюйми на 10!

# ✅ ПРАВИЛЬНО
width_cm = (bounds.width.to_mm / 10.0).round(1)  # Дюйми → мм → см

# Розбивка:
# bounds.width = 78.74 inches (приклад)
# .to_mm = 78.74 * 25.4 = 2000 mm
# / 10.0 = 200 cm
# .round(1) = 200.0 cm
```

### Приклади конвертації

```ruby
# === ДОВЖИНА ===
length_inches = 100.0
length_mm = length_inches.to_mm          # 2540.0 мм
length_cm = (length_inches.to_mm / 10)   # 254.0 см
length_m = (length_inches.to_mm / 1000)  # 2.54 м

# === ПЛОЩА ===
area_sq_inches = 310.0
area_m2 = area_sq_inches / 1550.0031     # 0.20 м²
area_cm2 = area_sq_inches * 6.4516       # 2000 см²

# === ОБ'ЄМ ===
volume_cu_inches = 61.02
volume_m3 = volume_cu_inches * 0.000016387064  # 0.001 м³
volume_liters = volume_cu_inches * 0.016387064 # 1.0 л
```

---

## 📏 РОЗРАХУНОК ПЛОЩІ

### Метод 1: Верхня грань (горизонтальні компоненти)

**Застосування:** Foundation, Tiles, Stand, BlindArea

```ruby
def calculate_top_area(component)
  trans = component.transformation
  scale_x = trans.xscale
  scale_y = trans.yscale
  
  top_area = 0
  
  component.definition.entities.grep(Sketchup::Face).each do |face|
    if face.normal.z > 0.9  # Нормаль вгору (vertical tolerance 0.9)
      # ✅ ВАЖЛИВО: враховуємо масштаб!
      face_area = face.area * scale_x * scale_y
      top_area += face_area
    end
  end
  
  # Конвертація: sq_inches → м²
  area_m2 = (top_area / 1550.0031).round(2)
  
  area_m2
end
```

**Чому `face.normal.z > 0.9` а не `== 1.0`:**
- Грань може бути трохи нахилена (похибка округлення)
- 0.9 означає кут ~25° від вертикалі (достатня толерантність)

---

### Метод 2: Найбільша грань (вертикальні/довільні компоненти)

**Застосування:** Cladding, FenceCorner, декоративні елементи

```ruby
def calculate_max_face_area(component)
  trans = component.transformation
  scale_x = trans.xscale
  scale_y = trans.yscale
  scale_z = trans.zscale
  
  max_area = 0
  
  component.definition.entities.grep(Sketchup::Face).each do |face|
    normal = face.normal.transform(trans)
    
    # Площа залежить від орієнтації грані
    if normal.z.abs > 0.9  # Горизонтальна (XY площина)
      face_area = face.area * scale_x * scale_y
      
    elsif normal.x.abs > 0.9  # Вертикальна паралельна YZ
      face_area = face.area * scale_y * scale_z
      
    elsif normal.y.abs > 0.9  # Вертикальна паралельна XZ
      face_area = face.area * scale_x * scale_z
      
    else  # Похила грань
      # Приблизний розрахунок
      avg_scale = Math.sqrt(scale_x * scale_y * scale_z)
      face_area = face.area * avg_scale * avg_scale
    end
    
    # Зберігаємо найбільшу
    max_area = face_area if face_area > max_area
  end
  
  area_m2 = (max_area / 1550.0031).round(3)
  
  area_m2
end
```

**Коли використовувати:**
- Не знаєте орієнтацію компонента
- Потрібна площа "лицьової" сторони
- Вертикальне облицювання
- Декоративні елементи

---

### Метод 3: Рекурсивний пошук (складні структури)

**Застосування:** BlindArea (рамка з вкладеними елементами)

```ruby
def calculate_area_recursive(component)
  top_area = 0
  
  # Лямбда для рекурсії
  process_entities = lambda do |entities, transformation|
    entities.each do |entity|
      
      if entity.is_a?(Sketchup::Face)
        # Трансформована нормаль
        normal = entity.normal.transform(transformation)
        
        if normal.z > 0.9  # Верхня грань
          sx = transformation.xscale
          sy = transformation.yscale
          face_area = entity.area * sx * sy
          top_area += face_area
        end
        
      elsif entity.is_a?(Sketchup::ComponentInstance) || entity.is_a?(Sketchup::Group)
        # Рекурсивно обробляємо вкладені
        new_trans = transformation * entity.transformation
        process_entities.call(entity.definition.entities, new_trans)
      end
      
    end
  end
  
  # Запуск рекурсії
  process_entities.call(
    component.definition.entities, 
    component.transformation
  )
  
  area_m2 = (top_area / 1550.0031).round(2)
  
  area_m2
end
```

**Чому рекурсія:**
- Грані можуть бути в Groups всередині компонента
- Можуть бути вкладені ComponentInstance
- Кожен рівень має свою трансформацію
- Треба комбінувати всі трансформації: `parent * child`

---

## 📦 РОЗРАХУНОК ОБ'ЄМУ

### Метод 1: Через Bounds (суцільні компоненти)

**Застосування:** Foundation, Stand, Tiles, Steles

```ruby
def calculate_volume_simple(component)
  bounds = component.bounds
  
  # Об'єм bounds (прямокутний паралелепіпед)
  volume_cu_inches = bounds.width * bounds.depth * bounds.height
  
  # Конвертація: cu_inches → м³
  volume_m3 = (volume_cu_inches * 0.000016387064).round(3)
  
  volume_m3
end
```

**Коли використовувати:**
- Компонент суцільний (не рамка)
- Форма близька до прямокутника
- Не потрібна абсолютна точність

---

### Метод 2: Через площу × товщину (рамкові структури)

**Застосування:** BlindArea (відмостка)

```ruby
def calculate_volume_frame(component, area_m2)
  bounds = component.bounds
  
  # Товщина = найменший розмір
  thickness_mm = [bounds.width.to_mm, bounds.depth.to_mm, bounds.height.to_mm].min
  thickness_m = thickness_mm / 1000.0
  
  # Об'єм = площа × товщина
  volume_m3 = (area_m2 * thickness_m).round(3)
  
  volume_m3
end
```

**Приклад:**
```
BlindArea (рамка):
  Bounds: 260 × 5 × 160 см
  
❌ Неправильно:
  volume = 260 × 5 × 160 = 208000 см³ = 0.208 м³
  (включає порожню частину посередині!)

✅ Правильно:
  area_top = 2.16 м² (реальна площа рамки)
  thickness = 5 см = 0.05 м
  volume = 2.16 × 0.05 = 0.108 м³
```

---

### Метод 3: З трансформацією (вкладені компоненти)

**Застосування:** Внутрішні компоненти (Flowerbed internals, CornerFence parts)

```ruby
def calculate_volume_nested(component, parent_trans)
  bounds = component.bounds
  
  # Комбінована трансформація
  combined_trans = parent_trans * component.transformation
  
  scale_x = combined_trans.xscale
  scale_y = combined_trans.yscale
  scale_z = combined_trans.zscale
  
  # Об'єм з урахуванням всіх масштабів
  volume_cu_inches = bounds.width * bounds.depth * bounds.height * 
                     scale_x * scale_y * scale_z
  
  volume_m3 = (volume_cu_inches * 0.000016387064).round(4)
  
  volume_m3
end
```

**Чому треба scale_x * scale_y * scale_z:**
- `bounds` дає розміри БЕЗ трансформації
- Якщо компонент масштабований - треба врахувати
- Вкладені компоненти мають подвійну трансформацію!

---

## 🔧 РОБОТА З КОМПОНЕНТАМИ

### Пошук компонентів

```ruby
# Всі компоненти в моделі
model = Sketchup.active_model
all_components = model.active_entities.grep(Sketchup::ComponentInstance)

# За точною назвою
foundation = all_components.find { |c| c.definition.name == "Foundation" }

# За regex
tiles = all_components.select { |c| c.definition.name =~ /Modular_Tile|Perimeter_Tile/ }

# Внутрішні компоненти
internal = component.definition.entities.grep(Sketchup::ComponentInstance)
```

### Отримання властивостей

```ruby
component = model.selection.first

# Назва
name = component.definition.name

# Габарити (з трансформацією)
bounds = component.bounds
width = bounds.width    # Дюйми
depth = bounds.depth
height = bounds.height

# Трансформація
trans = component.transformation
scale_x = trans.xscale
scale_y = trans.yscale
scale_z = trans.zscale
origin = trans.origin  # Point3d

# Геометрія всередині
entities = component.definition.entities
faces = entities.grep(Sketchup::Face)
internal_components = entities.grep(Sketchup::ComponentInstance)
groups = entities.grep(Sketchup::Group)

# Матеріал
material = component.material
material_name = material ? material.name : "Без матеріалу"
```

### Робота з гранями

```ruby
# Всі грані компонента
faces = component.definition.entities.grep(Sketchup::Face)

faces.each do |face|
  # Нормаль (напрямок грані)
  normal = face.normal  # Vector3d
  
  # Орієнтація:
  # normal.z > 0.9  → верхня грань (горизонтальна, вгору)
  # normal.z < -0.9 → нижня грань (горизонтальна, вниз)
  # normal.x.abs > 0.9 → вертикальна (паралельна YZ)
  # normal.y.abs > 0.9 → вертикальна (паралельна XZ)
  
  # Площа грані (БЕЗ трансформації)
  area = face.area  # Квадратні дюйми
  
  # Площа З трансформацією (залежить від орієнтації)
  if normal.z.abs > 0.9
    face_area = area * trans.xscale * trans.yscale
  elsif normal.x.abs > 0.9
    face_area = area * trans.yscale * trans.zscale
  elsif normal.y.abs > 0.9
    face_area = area * trans.xscale * trans.zscale
  end
  
  # Вершини грані
  vertices = face.vertices  # Array of Vertex
  points = vertices.map(&:position)  # Array of Point3d
end
```

---

## 📋 ТИПИ КОМПОНЕНТІВ

### 1. Foundation (Фундамент)

**Кількість:** 1  
**Розміри:** Depth × Width × Height (см)  
**Площа:** Верхня грань  
**Об'єм:** Bounds

**Приклад відображення:**
```
Фундамент:    15 × 200 × 100 см
              Площа: 2.00 м²
              Об'єм: 0.300 м³
```

---

### 2. BlindArea (Відмостка)

**Кількість:** 1  
**Структура:** Рамка (можуть бути вкладені елементи)  
**Розміри:** Depth × Width × Height (см)  
**Площа:** Сума всіх верхніх граней (рекурсивно)  
**Об'єм:** Площа × товщина (НЕ bounds!)

**Приклад відображення:**
```
Відмостка:    5 × 260 × 160 см
              Площа: 2.16 м²
              Об'єм: 0.108 м³
```

---

### 3. Tiles (Плитка: горизонтальна + вертикальна)

**Кількість:** 5-20+ (залежить від моделі)  
**Типи:**
- `Modular_Tile_*` - горизонтальна плитка (верх фундаменту)
- `Cladding_*` - вертикальна плитка (бокові сторони)

**Розміри:** Depth × Width × Height (см)  
**Площа:** 
- Горизонтальна: верхня грань
- Вертикальна: найбільша грань

**Об'єм:** Bounds

**Групування:** За розмірами + типом

**Приклад відображення:**
```
Плитка:       Плитка 3 × 80 × 40 см - 5 шт
                Площа: 1.600 м², Об'єм: 0.0048 м³
              
              Плитка 3 × 60 × 40 см - 2 шт
                Площа: 0.480 м², Об'єм: 0.0014 м³
              
              Вертикальна плитка 3 × 200 × 100 см - 6 шт
                Площа: 1.200 м², Об'єм: 0.0036 м³
              
              ЗАГАЛОМ:
                Площа: 3.28 м²
                Об'єм: 0.010 м³
```

---

### 4. Stand (Підставка + Проміжна)

**Кількість:** 1-2  
**Типи:**
- `Stand` - основна підставка
- `StandGaps` - проміжна деталь (якщо є)

**Розміри:** Depth × Width × Height (см)  
**Площа:** Верхня грань  
**Об'єм:** Bounds

**Приклад відображення:**
```
Підставка:    Підставка: 30 × 60 × 20 см
                Площа: 0.180 м²
                Об'єм: 0.036 м³
              
              Проміжна деталь: 10 × 10 × 5 см
                Площа: 0.010 м²
                Об'єм: 0.0005 м³
```

---

### 5. Steles (Стели)

**Кількість:** 1-2  
**Розміри:** Depth × Width × Height (см)  
**Площа:** Верхня грань  
**Об'єм:** Bounds  
**Групування:** За розмірами (якщо парні стели)

**Приклад відображення (одна):**
```
Стела:        Стела 8 × 100 × 50 см - 1 шт
                Площа: 0.500 м²
                Об'єм: 0.040 м³
```

**Приклад відображення (парні):**
```
Стела:        Стела 8 × 100 × 50 см - 2 шт
                Площа: 1.000 м²
                Об'єм: 0.080 м³
```

---

### 6. Flowerbeds (Квітники)

**Кількість:** 1 контейнер → 3 внутрішні компоненти  
**Структура:** `flowerbed_*.skp` містить 3 окремі елементи  
**Що показується:** ТІЛЬКИ 3 внутрішні (не контейнер)

**Розміри:** Depth × Width × Height (см)  
**Площа:** Верхня грань (кожного внутрішнього)  
**Об'єм:** Bounds × трансформація контейнера  
**Групування:** За розмірами

**Приклад відображення:**
```
Квітник:      Квітник 10 × 50 × 30 см - 2 шт
                Площа: 0.030 м²
                Об'єм: 0.0030 м³
              
              Квітник 10 × 30 × 20 см - 1 шт
                Площа: 0.006 м²
                Об'єм: 0.0006 м³
              
              ЗАГАЛОМ:
                Площа: 0.04 м²
                Об'єм: 0.004 м³
```

---

### 7. CornerFence (Кутова огорожа)

**Кількість:** 4 контейнери → 12 внутрішніх (4×3)  
**Структура:** Кожен `CornerFence` містить:
- `CornerFence_Post` (стовпчик)
- `CornerFence_Panel_X` (панель по X)
- `CornerFence_Panel_Y` (панель по Y)

**Що показується:** Внутрішні компоненти з групуванням

**Розміри:** Depth × Width × Height (см)  
**Площа:** Найбільша грань  
**Об'єм:** Bounds × трансформація  
**Групування:** За назвою компонента

**Приклад відображення:**
```
Кутова огорожа:   Post: 25 × 15 × 15 см - 4 шт
                    Площа: 0.150 м²
                    Об'єм: 0.0224 м³
                  
                  Panel_X: 15 × 50 × 5 см - 4 шт
                    Площа: 0.300 м²
                    Об'єм: 0.0150 м³
                  
                  Panel_Y: 15 × 5 × 50 см - 4 шт
                    Площа: 0.300 м²
                    Об'єм: 0.0150 м³
                  
                  ЗАГАЛОМ:
                    Площа: 0.75 м²
                    Об'єм: 0.052 м³
```

---

### 8. Fence Decor (Декор огорожі)

**Кількість:** 4+ (ball.skp, pancake.skp)  
**Розміри:** Depth × Width × Height (см)  
**Площа:** Найбільша грань  
**Об'єм:** Bounds  
**Групування:** За назвою файлу

**Приклад відображення:**
```
Декор огорожі:    ball.skp: 14.6 × 10 × 10 см - 4 шт
                    Площа: 0.004 м²
                    Об'єм: 0.0058 м³
```

---

## 🔄 ГРУПУВАННЯ ДАНИХ

### Ruby Backend Групування

**НЕ групувати (зберігати всі дані):**
```ruby
# Foundation, BlindArea, Stands, Tiles, Steles, Flowerbeds, FenceCorner, FenceDecor
if category == :foundation || category == :blind_area || category == :stands || 
   category == :tiles || category == :steles || category == :flowerbeds || 
   category == :fence_corner || category == :fence_decor
  grouped_summary[category] = items  # БЕЗ групування
else
  grouped_summary[category] = group_components(items)  # З групуванням
end
```

**Чому НЕ групуємо:**
- Мають додаткові поля: `area_m2`, `volume_m3`, `tile_type`, `stand_type`
- Потрібне групування за розмірами (не за матеріалом)
- JavaScript робить власне групування

---

### JavaScript Frontend Групування

**Групування за розмірами:**
```javascript
const grouped = {};

data.tiles.forEach(tile => {
  // Ключ = унікальна комбінація розмірів
  const key = `${tile.depth}×${tile.width}×${tile.height}`;
  
  if (!grouped[key]) {
    grouped[key] = {
      depth: tile.depth,
      width: tile.width,
      height: tile.height,
      count: 0,           // Лічильник
      totalArea: 0,       // Сума площ
      totalVolume: 0      // Сума об'ємів
    };
  }
  
  // Додаємо до групи
  grouped[key].count++;
  grouped[key].totalArea += (tile.area_m2 || 0);
  grouped[key].totalVolume += (tile.volume_m3 || 0);
});

// Результат:
// grouped = {
//   "3×80×40": { depth: 3, width: 80, height: 40, count: 5, totalArea: 1.6, totalVolume: 0.0048 },
//   "3×60×40": { depth: 3, width: 60, height: 40, count: 2, totalArea: 0.48, totalVolume: 0.0014 }
// }
```

**Групування за типом:**
```javascript
// Для компонентів з додатковим типом (tile_type, stand_type)
const key = `${tile.depth}×${tile.width}×${tile.height}×${tile.tile_type || 'horizontal'}`;

// Це дозволяє розділити:
// - Плитка 3×80×40 (horizontal)
// - Плитка 3×80×40 (вертикальна)
```

**Групування за назвою:**
```javascript
// Для CornerFence (Post, Panel_X, Panel_Y)
const key = item.name;  // "CornerFence_Post"

// Результат: кожен тип окремо
// - CornerFence_Post: 4 шт
// - CornerFence_Panel_X: 4 шт
// - CornerFence_Panel_Y: 4 шт
```

---

## 🖥️ ВІДОБРАЖЕННЯ В UI

### Формат тексту

**Багаторядковий (multiline):**
```javascript
const text = `${depth} × ${width} × ${height} см
Площа: ${area} м²
Об'єм: ${volume} м³`;

// CSS має мати: white-space: pre-line
```

**З групуванням:**
```javascript
const lines = [];

Object.values(grouped).forEach(group => {
  lines.push(
    `Плитка ${group.depth} × ${group.width} × ${group.height} см - ${group.count} шт\n` +
    `  Площа: ${group.totalArea.toFixed(3)} м², Об'єм: ${group.totalVolume.toFixed(4)} м³`
  );
});

lines.push(`\nЗАГАЛОМ:\n  Площа: ${totalArea.toFixed(2)} м²\n  Об'єм: ${totalVolume.toFixed(3)} м³`);

const text = lines.join('\n\n');  // Подвійний перенос між групами
```

### CSS стилі

```css
.summary-table {
  width: 100%;
  border-collapse: collapse;
}

.summary-table td:first-child {
  font-weight: 600;
  width: 35%;
  vertical-align: top;
  padding-right: 15px;
}

.summary-table td:last-child {
  text-align: left;
  vertical-align: top;
}

.summary-cell {
  white-space: pre-line;    /* ← Зберігає \n */
  line-height: 1.8;         /* ← Читабельність */
  font-size: 0.9em;
  max-width: 350px;
  word-wrap: break-word;
  vertical-align: top;
}
```

### Точність округлення

```javascript
// Розміри (см) - 1 знак
${depth.toFixed(1)} см  // 15.0 см

// Площа (м²) - залежить від розміру
// Малі площі (< 1 м²): 3 знаки
${area.toFixed(3)} м²  // 0.320 м²

// Великі площі (> 1 м²): 2 знаки
${totalArea.toFixed(2)} м²  // 2.16 м²

// Об'єм (м³) - залежить від розміру
// Малі об'єми (< 0.01 м³): 4 знаки
${volume.toFixed(4)} м³  // 0.0015 м³

// Середні об'єми (< 1 м³): 3 знаки
${totalVolume.toFixed(3)} м³  // 0.108 м³
```

---

## 💡 ПРАКТИЧНІ ПРИКЛАДИ

### Приклад 1: Додати новий тип компонента

**Задача:** Додати "Lamp" (лампа) в підсумок з площею та об'ємом

**Крок 1: Ruby (callback_manager.rb)**
```ruby
when /lamp/i
  ProGran3::Logger.info("🔹 Лампа знайдена: #{name}", "Summary")
  
  bounds = component.bounds
  trans = component.transformation
  
  # Розміри
  width_cm = (bounds.width.to_mm / 10.0).round(1)
  depth_cm = (bounds.depth.to_mm / 10.0).round(1)
  height_cm = (bounds.height.to_mm / 10.0).round(1)
  
  # Площа (найбільша грань - лампа може бути вертикальна)
  max_area = 0
  # ... код з Патерн 4 (Cladding) ...
  
  area_m2 = (max_area / 1550.0031).round(3)
  
  # Об'єм
  volume_cu_inches = bounds.width * bounds.depth * bounds.height
  volume_m3 = (volume_cu_inches * 0.000016387064).round(4)
  
  item = {
    name: name,
    width: width_cm,
    depth: depth_cm,
    height: height_cm,
    area_m2: area_m2,
    volume_m3: volume_m3,
    material: get_component_material(component)
  }
  summary[:lamps] << item
```

**Крок 2: Додати до НЕгрупованих**
```ruby
if category == :foundation || ... || category == :lamps
  grouped_summary[category] = items
```

**Крок 3: JavaScript (SummaryTable.js)**
```javascript
// Оновлюємо Лампи (групуємо за розмірами)
if (data.lamps && data.lamps.length > 0) {
  const lampEl = safeGetElement('summary-lamp');
  if (lampEl) {
    const grouped = {};
    
    data.lamps.forEach(lamp => {
      const key = `${lamp.depth}×${lamp.width}×${lamp.height}`;
      // ... групування як у Tiles ...
    });
    
    // Формування тексту
    const lampLines = [];
    // ... формування як у Steles ...
    
    const text = lampLines.join('\n\n');
    safeSetTextContent(lampEl, text);
  }
}
```

**Крок 4: HTML (index.html)**
```html
<tr>
  <td data-i18n="summary.lamp">Лампа:</td>
  <td id="summary-lamp" class="summary-cell">--</td>
</tr>
```

---

### Приклад 2: Змінити формат відображення

**Задача:** Показувати площу в см² замість м² для малих компонентів

**JavaScript:**
```javascript
Object.values(grouped).forEach(group => {
  const area_m2 = group.totalArea;
  const area_cm2 = area_m2 * 10000;  // м² → см²
  
  // Якщо < 0.1 м² - показуємо в см²
  const areaText = area_m2 < 0.1 
    ? `${area_cm2.toFixed(0)} см²` 
    : `${area_m2.toFixed(3)} м²`;
  
  fenceLines.push(
    `${group.name}: ${group.depth} × ${group.width} × ${group.height} см - ${group.count} шт\n` +
    `  Площа: ${areaText}, Об'єм: ${group.totalVolume.toFixed(4)} м³`
  );
});
```

---

### Приклад 3: Експорт статистики

**Задача:** Експортувати підсумок в JSON для друку або збереження

**JavaScript:**
```javascript
function exportSummaryToJSON() {
  // Збираємо всі дані з таблиці
  const summary = {};
  
  const categories = [
    'foundation', 'tiling', 'blind-area', 'stand',
    'flowerbed', 'gravestone', 'stele', 'lamp',
    'fence-corner', 'fence-perimeter', 'fence-decor'
  ];
  
  categories.forEach(cat => {
    const element = document.getElementById(`summary-${cat}`);
    if (element && element.textContent !== '--') {
      summary[cat] = element.textContent;
    }
  });
  
  // Конвертуємо в JSON
  const json = JSON.stringify(summary, null, 2);
  
  // Копіюємо в clipboard або завантажуємо
  navigator.clipboard.writeText(json);
  console.log('📋 Підсумок скопійовано в clipboard');
  
  return json;
}
```

---

### Приклад 4: Додати загальну статистику проекту

**Задача:** Показати загальну площу та об'єм ВСІХ компонентів

**JavaScript:**
```javascript
function calculateProjectTotals(data) {
  let totalArea = 0;
  let totalVolume = 0;
  let totalComponents = 0;
  
  // Обходимо всі категорії
  Object.keys(data).forEach(category => {
    const items = data[category];
    
    if (Array.isArray(items)) {
      items.forEach(item => {
        totalArea += (item.area_m2 || 0);
        totalVolume += (item.volume_m3 || 0);
        totalComponents++;
      });
    }
  });
  
  return {
    totalComponents,
    totalArea: totalArea.toFixed(2),
    totalVolume: totalVolume.toFixed(3)
  };
}

// Використання
const totals = calculateProjectTotals(data);
console.log(`Всього компонентів: ${totals.totalComponents}`);
console.log(`Загальна площа: ${totals.totalArea} м²`);
console.log(`Загальний об'єм: ${totals.totalVolume} м³`);
```

---

## ⚙️ ТЕХНІЧНІ ДЕТАЛІ

### Чому `face.normal.z > 0.9` а не `== 1.0`

```ruby
# ❌ Неправильно
if face.normal.z == 1.0  # Може не спрацювати через похибки

# ✅ Правильно
if face.normal.z > 0.9   # Толерантність ±25°

# Пояснення:
# normal.z = 1.0  → точно вертикально вгору (0°)
# normal.z = 0.9  → кут ~25° від вертикалі
# normal.z = 0.7  → кут ~45°
```

### Чому важлива трансформація

```ruby
# Якщо компонент масштабований:
component.transformation.xscale = 2.0  # Подвоєний по X

# ❌ Неправильно
area = face.area  # Площа БЕЗ масштабу

# ✅ Правильно
area = face.area * scale_x * scale_y  # Площа З масштабом

# Приклад:
# Грань 10×10 дюймів = 100 sq_in
# З масштабом 2×2: 100 * 2 * 2 = 400 sq_in ✅
# БЕЗ масштабу: 100 sq_in ❌
```

### Комбінована трансформація

```ruby
# Для вкладених компонентів:
parent_trans = parent_component.transformation
child_trans = child_component.transformation

# ❌ Неправильно
area = face.area * child_trans.xscale * child_trans.yscale

# ✅ Правильно
combined_trans = parent_trans * child_trans  # Множення матриць!
area = face.area * combined_trans.xscale * combined_trans.yscale

# Приклад:
# Parent scale: 1.5
# Child scale: 2.0
# Combined scale: 1.5 * 2.0 = 3.0 ✅
```

### Обробка різних орієнтацій

```ruby
# Визначення орієнтації грані
normal = face.normal.transform(transformation)

if normal.z.abs > 0.9
  # Горизонтальна грань (площина XY)
  face_area = face.area * scale_x * scale_y
  
elsif normal.x.abs > 0.9
  # Вертикальна грань паралельна YZ площині
  face_area = face.area * scale_y * scale_z
  
elsif normal.y.abs > 0.9
  # Вертикальна грань паралельна XZ площині
  face_area = face.area * scale_x * scale_z
  
else
  # Похила грань (складніше)
  # Приблизний розрахунок через середній масштаб
  avg_scale = Math.sqrt(scale_x * scale_y * scale_z)
  face_area = face.area * avg_scale * avg_scale
end
```

---

## 📊 ТАБЛИЦЯ ФОРМУЛ

### Швидка довідка

| Тип | Площа | Об'єм | Групування |
|-----|-------|-------|------------|
| **Foundation** | Верхня грань | Bounds | Один |
| **BlindArea** | Сума верхніх (рекурсивно) | Площа × товщина | Один |
| **Tiles (гориз.)** | Верхня грань | Bounds | За розмірами |
| **Tiles (верт.)** | Найбільша грань | Bounds | За розмірами + тип |
| **Stand** | Верхня грань | Bounds | За типом (основна/проміжна) |
| **Stele** | Верхня грань | Bounds | За розмірами |
| **Flowerbed** | Верхня (внутрішніх) | Bounds × trans | За розмірами (тільки внутрішні) |
| **CornerFence** | Найбільша (внутрішніх) | Bounds × trans | За назвою (тільки внутрішні) |
| **FenceDecor** | Найбільша | Bounds | За назвою |

---

## 🚀 WORKFLOW СИСТЕМИ

### Покроковий процес

**1. Користувач натискає "Оновити"**
```javascript
// JavaScript (SummaryTable.js)
function refreshDetailedSummary() {
  window.sketchup.get_detailed_summary();
}
```

**2. Ruby збирає дані**
```ruby
# Ruby (callback_manager.rb)
def get_detailed_summary_callback(dialog)
  model = Sketchup.active_model
  entities = model.active_entities.grep(Sketchup::ComponentInstance)
  
  summary = {
    foundation: [],
    tiles: [],
    # ... інші категорії
  }
  
  entities.each do |component|
    case component.definition.name
    when "Foundation"
      # ... обробка ...
      summary[:foundation] << item
    when /Modular_Tile/
      # ... обробка ...
      summary[:tiles] << item
    # ... інші випадки
    end
  end
  
  # Групування (частково)
  grouped_summary = {}
  summary.each do |category, items|
    if needs_javascript_grouping?(category)
      grouped_summary[category] = items  # БЕЗ групування
    else
      grouped_summary[category] = group_components(items)
    end
  end
  
  # Відправка в JavaScript
  json_data = grouped_summary.to_json
  dialog.execute_script("updateDetailedSummary(#{json_data});")
end
```

**3. JavaScript обробляє**
```javascript
// JavaScript (SummaryTable.js)
function updateDetailedSummary(data) {
  // Foundation - прямий показ
  if (data.foundation && data.foundation.length > 0) {
    const f = data.foundation[0];
    const text = `${f.depth} × ${f.width} × ${f.height} см
Площа: ${f.area_m2} м²
Об'єм: ${f.volume_m3} м³`;
    element.textContent = text;
  }
  
  // Tiles - групування + сума
  if (data.tiles && data.tiles.length > 0) {
    const grouped = {};
    
    // Групування за розмірами
    data.tiles.forEach(tile => {
      const key = `${tile.depth}×${tile.width}×${tile.height}`;
      if (!grouped[key]) {
        grouped[key] = { ..., count: 0, totalArea: 0, totalVolume: 0 };
      }
      grouped[key].count++;
      grouped[key].totalArea += tile.area_m2;
      grouped[key].totalVolume += tile.volume_m3;
    });
    
    // Формування тексту
    const lines = Object.values(grouped).map(g => 
      `Плитка ${g.depth}×${g.width}×${g.height} см - ${g.count} шт
  Площа: ${g.totalArea.toFixed(3)} м², Об'єм: ${g.totalVolume.toFixed(4)} м³`
    );
    
    // Загальна сума
    const total = calculateTotals(grouped);
    lines.push(`\nЗАГАЛОМ:\n  Площа: ${total.area} м²\n  Об'єм: ${total.volume} м³`);
    
    element.textContent = lines.join('\n\n');
  }
}
```

**4. Відображення в HTML**
```html
<table class="summary-table">
  <tr>
    <td>Фундамент:</td>
    <td id="summary-foundation" class="summary-cell">
      15 × 200 × 100 см
      Площа: 2.00 м²
      Об'єм: 0.300 м³
    </td>
  </tr>
  
  <tr>
    <td>Плитка:</td>
    <td id="summary-tiling" class="summary-cell">
      Плитка 3 × 80 × 40 см - 5 шт
        Площа: 1.600 м², Об'єм: 0.0048 м³
      
      Вертикальна плитка 3 × 200 × 100 см - 6 шт
        Площа: 1.200 м², Об'єм: 0.0036 м³
      
      ЗАГАЛОМ:
        Площа: 2.80 м²
        Об'єм: 0.008 м³
    </td>
  </tr>
</table>
```

---

## 🎓 BEST PRACTICES

### ✅ DO (Робити)

1. **Завжди конвертуйте через `.to_mm`:**
   ```ruby
   width_cm = (bounds.width.to_mm / 10.0).round(1)  # ✅
   ```

2. **Завжди враховуйте трансформацію:**
   ```ruby
   area = face.area * trans.xscale * trans.yscale  # ✅
   ```

3. **Використовуйте комбіновану трансформацію для вкладених:**
   ```ruby
   combined = parent.transformation * child.transformation  # ✅
   ```

4. **Групуйте схожі компоненти в JavaScript:**
   ```javascript
   const grouped = {};
   data.tiles.forEach(tile => {
     const key = `${tile.depth}×${tile.width}×${tile.height}`;
     // ... групування
   });
   ```

5. **Додавайте загальні суми:**
   ```javascript
   lines.push(`\nЗАГАЛОМ:\n  Площа: ${total} м²`);  # ✅
   ```

6. **Логуйте кожен крок:**
   ```ruby
   ProGran3::Logger.info("📊 Площа: #{area_m2} м²", "Summary")  # ✅
   ```

---

### ❌ DON'T (Не робити)

1. **НЕ ділити дюйми напряму:**
   ```ruby
   width_cm = bounds.width / 10.0  # ❌ НЕПРАВИЛЬНО!
   ```

2. **НЕ ігнорувати трансформацію:**
   ```ruby
   area = face.area  # ❌ БЕЗ масштабу!
   ```

3. **НЕ використовувати bounds для рамкових структур:**
   ```ruby
   # Для BlindArea:
   volume = bounds.width * bounds.depth * bounds.height  # ❌ З дірою!
   volume = area * thickness  # ✅ Реальний об'єм
   ```

4. **НЕ групувати в Ruby компоненти з додатковими полями:**
   ```ruby
   # ❌ НЕПРАВИЛЬНО
   grouped_summary[:tiles] = group_components(items)  # Втратить area_m2!
   
   # ✅ ПРАВИЛЬНО
   grouped_summary[:tiles] = items  # Зберігає всі поля
   ```

5. **НЕ використовувати `==` для float порівнянь:**
   ```ruby
   if face.normal.z == 1.0  # ❌ Може не спрацювати
   if face.normal.z > 0.9   # ✅ З толерантністю
   ```

---

## 🔍 TROUBLESHOOTING

### Проблема: Неправильні розміри (надто малі)

**Симптоми:** `0.6 × 7.9 × 3.9 см` замість `15 × 200 × 100 см`

**Причина:** Відсутня конвертація `.to_mm`

**Рішення:**
```ruby
# ❌ Було
width = (bounds.width / 10.0).round(1)

# ✅ Стало
width = (bounds.width.to_mm / 10.0).round(1)
```

---

### Проблема: Площа = 0 або дуже мала

**Симптоми:** `Площа: 0.00 м²` або `Площа: 0.001 м²`

**Можливі причини:**

**1. Не враховано трансформацію:**
```ruby
# ❌ Було
area = face.area

# ✅ Стало
area = face.area * trans.xscale * trans.yscale
```

**2. Не знайдено грані:**
```ruby
# Перевірте:
face_count = component.definition.entities.grep(Sketchup::Face).count
puts "Граней: #{face_count}"

# Якщо 0 - можливо це контейнер, треба шукати всередині
```

**3. Неправильна орієнтація:**
```ruby
# Для вертикальних компонентів:
if face.normal.z > 0.9  # ❌ Шукає верхні, а їх немає!

# Використайте метод "найбільша грань"
```

---

### Проблема: Об'єм неправильний

**Симптоми:** Для BlindArea `0.208 м³` замість `0.108 м³`

**Причина:** Використано bounds для рамкової структури

**Рішення:**
```ruby
# ❌ Для рамки
volume = bounds.width * bounds.depth * bounds.height

# ✅ Для рамки
volume = area_m2 * (thickness_mm / 1000.0)
```

---

### Проблема: Дані не доходять до UI (undefined)

**Симптоми:** `Площа: N/A м²`, `Об'єм: N/A м³`

**Можливі причини:**

**1. Ruby групування видаляє поля:**
```ruby
# ❌ НЕПРАВИЛЬНО
grouped_summary[:tiles] = group_components(items)

# ✅ ПРАВИЛЬНО
grouped_summary[:tiles] = items  # БЕЗ групування!
```

**2. JavaScript не отримує дані:**
```javascript
// Перевірте в console:
console.log('📐 Tiles дані:', data.tiles);
console.log('  area_m2:', data.tiles[0].area_m2);

// Якщо undefined - проблема в Ruby
// Якщо є - проблема в JavaScript відображенні
```

**3. Автоматичне оновлення перезаписує:**
```javascript
// ❌ КОНФЛІКТ
updateFoundationSummary();  // Показує тільки розміри
updateDetailedSummary();    // Показує розміри + площа + об'єм

// Друга функція може бути перезаписана першою!

// ✅ РІШЕННЯ
// Відключити автоматичне оновлення
// updateFoundationSummary(addedElements, currentUnit);
```

---

## 📝 CHECKLIST ДЛЯ НОВИХ КОМПОНЕНТІВ

### При додаванні нового типу компонента:

- [ ] **Ruby: case block**
  ```ruby
  when /MyComponent/i
    # ... код обробки
  ```

- [ ] **Конвертація розмірів через `.to_mm`**
  ```ruby
  width_cm = (bounds.width.to_mm / 10.0).round(1)
  ```

- [ ] **Розрахунок площі з трансформацією**
  ```ruby
  area = face.area * scale_x * scale_y
  area_m2 = (area / 1550.0031).round(?)
  ```

- [ ] **Розрахунок об'єму**
  ```ruby
  volume_cu_inches = bounds.width * bounds.depth * bounds.height
  volume_m3 = (volume_cu_inches * 0.000016387064).round(?)
  ```

- [ ] **Створення item з усіма полями**
  ```ruby
  item = { name, width, depth, height, area_m2, volume_m3, material }
  ```

- [ ] **Додати до summary**
  ```ruby
  summary[:my_category] << item
  ```

- [ ] **Додати до НЕгрупованих (якщо має area/volume)**
  ```ruby
  if category == :foundation || ... || category == :my_category
  ```

- [ ] **JavaScript: обробник відображення**
  ```javascript
  if (data.my_category && data.my_category.length > 0) {
    // ... групування + відображення
  }
  ```

- [ ] **HTML: рядок в таблиці**
  ```html
  <tr>
    <td>Моя категорія:</td>
    <td id="summary-my-category" class="summary-cell">--</td>
  </tr>
  ```

- [ ] **Локалізація (uk.json, pl.json, en.json)**
  ```json
  "summary": {
    "my_category": "Моя категорія"
  }
  ```

- [ ] **Тестування:**
  - Створити компонент в моделі
  - Натиснути "Оновити"
  - Перевірити розміри, площу, об'єм
  - Перевірити групування (якщо > 1)

---

## 🎯 ПРИКЛАДИ РЕАЛЬНОГО КОДУ

### Повний приклад: Обробка Steles

**Ruby (callback_manager.rb):**
```ruby
when /stele/i
  ProGran3::Logger.info("🔹 Стела знайдена: #{name}", "Summary")
  
  bounds = component.bounds
  trans = component.transformation
  
  # Розміри в см
  width_cm = (bounds.width.to_mm / 10.0).round(1)
  depth_cm = (bounds.depth.to_mm / 10.0).round(1)
  height_cm = (bounds.height.to_mm / 10.0).round(1)
  
  # Площа верхньої грані
  scale_x = trans.xscale
  scale_y = trans.yscale
  
  top_area = 0
  component.definition.entities.grep(Sketchup::Face).each do |face|
    if face.normal.z > 0.9
      top_area += face.area * scale_x * scale_y
    end
  end
  area_m2 = (top_area / 1550.0031).round(3)
  
  # Об'єм
  volume_cu_inches = bounds.width * bounds.depth * bounds.height
  volume_m3 = (volume_cu_inches * 0.000016387064).round(4)
  
  ProGran3::Logger.info("  📏 Стела: #{depth_cm} × #{width_cm} × #{height_cm} см, Площа: #{area_m2} м², Об'єм: #{volume_m3} м³", "Summary")
  
  item = {
    name: name,
    width: width_cm,
    depth: depth_cm,
    height: height_cm,
    area_m2: area_m2,
    volume_m3: volume_m3,
    material: get_component_material(component)
  }
  summary[:steles] << item
```

**JavaScript (SummaryTable.js):**
```javascript
// Оновлюємо Стели (групуємо за розмірами)
if (data.steles && data.steles.length > 0) {
  const steleEl = safeGetElement('summary-stele');
  if (steleEl) {
    const grouped = {};
    
    // Групування
    data.steles.forEach(stele => {
      const key = `${stele.depth}×${stele.width}×${stele.height}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          depth: stele.depth,
          width: stele.width,
          height: stele.height,
          count: 0,
          totalArea: 0,
          totalVolume: 0
        };
      }
      
      grouped[key].count++;
      grouped[key].totalArea += (stele.area_m2 || 0);
      grouped[key].totalVolume += (stele.volume_m3 || 0);
    });
    
    // Формування тексту
    const steleLines = [];
    let totalArea = 0;
    let totalVolume = 0;
    
    Object.values(grouped).forEach(group => {
      totalArea += group.totalArea;
      totalVolume += group.totalVolume;
      
      steleLines.push(
        `Стела ${group.depth} × ${group.width} × ${group.height} см - ${group.count} шт\n` +
        `  Площа: ${group.totalArea.toFixed(3)} м², Об'єм: ${group.totalVolume.toFixed(4)} м³`
      );
    });
    
    // Додаємо загалом (тільки якщо > 1 типу)
    if (Object.keys(grouped).length > 1) {
      steleLines.push(
        `\nЗАГАЛОМ:\n` +
        `  Площа: ${totalArea.toFixed(2)} м²\n` +
        `  Об'єм: ${totalVolume.toFixed(3)} м³`
      );
    }
    
    const text = steleLines.join('\n\n');
    safeSetTextContent(steleEl, text);
  }
}
```

---

## 📚 ДОДАТКОВІ РЕСУРСИ

### Пов'язані документи

- `SKETCHUP_API_COMPONENTS_GUIDE.md` - Базова робота з компонентами
- `plugin/proGran3/callback_manager.rb` - Реалізація (рядки 994-1650)
- `plugin/proGran3/web/modules/ui/SummaryTable.js` - Frontend обробка
- `COORDINATE_SYSTEM_STANDARD.md` - Система координат (X=North/South)

### Корисні методи SketchUp API

```ruby
# Bounds
component.bounds.width
component.bounds.depth
component.bounds.height
component.bounds.center
component.bounds.min
component.bounds.max

# Transformation
trans.origin        # Point3d
trans.xscale        # Float
trans.yscale        # Float
trans.zscale        # Float
trans.to_a          # Array (матриця 4×4)

# Face
face.area           # Float (sq_inches)
face.normal         # Vector3d
face.vertices       # Array<Vertex>
face.material       # Material

# Definition
definition.name
definition.description
definition.entities
definition.count_instances
definition.bounds

# Entities
entities.grep(Sketchup::Face)
entities.grep(Sketchup::ComponentInstance)
entities.grep(Sketchup::Group)
```

---

## 🎉 ПІДСУМОК

### Ключові моменти

1. **Конвертація одиниць** - завжди через `.to_mm`, потім ділити
2. **Трансформації** - ЗАВЖДИ враховувати для площі та об'єму
3. **Рекурсія** - для вкладених структур (BlindArea, Flowerbed, CornerFence)
4. **Групування** - в JavaScript за розмірами, в Ruby НЕ групувати компоненти з додатковими полями
5. **Орієнтація граней** - horizontal vs vertical (різні формули площі)
6. **Рамкові структури** - об'єм через `площа × товщина`, НЕ bounds

### Формули quick reference

```ruby
# Конвертація
cm = (inches.to_mm / 10.0).round(1)
m2 = (sq_inches / 1550.0031).round(2)
m3 = (cu_inches * 0.000016387064).round(3)

# Площа (горизонтальна)
area = face.area * scale_x * scale_y

# Площа (вертикальна)
area = face.area * scale_y * scale_z  # або scale_x * scale_z

# Об'єм (суцільний)
volume = bounds.width * bounds.depth * bounds.height

# Об'єм (рамка)
volume = area_m2 * (thickness_mm / 1000.0)

# Комбінована трансформація
combined = parent_trans * child_trans
```

---

**Документ створено:** 18 жовтня 2025  
**Автор:** ProGran3 Development Team  
**Версія:** 1.0  
**Статус:** ✅ Production Ready

