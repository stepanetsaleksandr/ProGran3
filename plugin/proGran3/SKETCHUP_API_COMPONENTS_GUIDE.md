# 📐 SketchUp Ruby API - Робота з Компонентами та Моделлю

**Версія:** 1.0  
**Дата:** 18 жовтня 2025  
**Для:** ProGran3 Plugin Development

---

## 📑 ЗМІСТ

1. [Доступ до компонентів](#доступ-до-компонентів)
2. [Властивості компонентів](#властивості-компонентів)
3. [Конвертація одиниць](#конвертація-одиниць)
4. [Розрахунок площі](#розрахунок-площі)
5. [Розрахунок об'єму](#розрахунок-обєму)
6. [Трансформації](#трансформації)
7. [Створення та редагування](#створення-та-редагування)
8. [Практичні приклади](#практичні-приклади)

---

## 🔍 ДОСТУП ДО КОМПОНЕНТІВ

### Отримання компонентів з моделі

```ruby
# Активна модель
model = Sketchup.active_model

# Всі entities в моделі
entities = model.active_entities

# Всі компоненти в моделі
all_components = entities.grep(Sketchup::ComponentInstance)

# Компонент за назвою
foundation = all_components.find { |c| c.definition.name == "Foundation" }

# Всі компоненти з конкретною назвою
stands = all_components.select { |c| c.definition.name == "Stand" }

# Вибраний компонент
selected = model.selection.first
if selected.is_a?(Sketchup::ComponentInstance)
  puts "Вибрано: #{selected.definition.name}"
end

# Всі визначення компонентів
definitions = model.definitions.to_a
```

---

## 📊 ВЛАСТИВОСТІ КОМПОНЕНТІВ

### ComponentInstance (екземпляр компонента)

```ruby
instance = model.selection.first

# Назва та опис
name = instance.definition.name
description = instance.definition.description

# Габарити (з урахуванням трансформації)
bounds = instance.bounds
width = bounds.width      # Розмір по X
depth = bounds.depth      # Розмір по Y
height = bounds.height    # Розмір по Z

# Позиція та орієнтація
transformation = instance.transformation
origin = transformation.origin  # Geom::Point3d

# Шар та матеріал
layer = instance.layer
material = instance.material

# Стан
is_locked = instance.locked?
is_hidden = instance.hidden?

# Унікальний ID
guid = instance.guid
entity_id = instance.entityID
```

### ComponentDefinition (визначення компонента)

```ruby
definition = instance.definition

# Назва та опис
definition.name
definition.description

# Геометрія всередині
definition.entities.each do |entity|
  # Обробка кожного entity
end

# Кількість використань
count = definition.count_instances

# Габарити визначення (БЕЗ трансформації)
original_bounds = definition.bounds

# Поведінка
behavior = definition.behavior
behavior.always_face_camera?
behavior.cuts_opening?
```

---

## 🔄 КОНВЕРТАЦІЯ ОДИНИЦЬ

### ⚠️ КРИТИЧНО ВАЖЛИВО!

**SketchUp внутрішні одиниці:**
- Довжина: **дюйми (inches)**
- Площа: **квадратні дюйми (square inches)**
- Об'єм: **кубічні дюйми (cubic inches)**

### Конвертація довжини

```ruby
# === З ДЮЙМІВ В ІНШІ ОДИНИЦІ ===

length_inches = bounds.width  # Це в дюймах!

# В міліметри
length_mm = length_inches.to_mm
# АБО
length_mm = length_inches * 25.4

# В сантиметри
length_cm = length_inches * 2.54

# В метри
length_m = length_inches * 0.0254

# В фути
length_ft = length_inches / 12.0


# === З ІНШИХ ОДИНИЦЬ В ДЮЙМИ ===

# З міліметрів
100.mm  # Повертає значення в дюймах

# З сантиметрів
value_inches = cm_value * 0.393701

# З метрів
value_inches = m_value * 39.3701
```

### Конвертація площі

```ruby
# === З КВАДРАТНИХ ДЮЙМІВ В ІНШІ ОДИНИЦІ ===

area_sq_inches = face.area  # Це в дюймах²!

# В мм²
area_mm2 = area_sq_inches * 645.16

# В см²
area_cm2 = area_sq_inches * 6.4516

# В м²
area_m2 = area_sq_inches / 1550.0031
# АБО точніше:
area_m2 = area_sq_inches * 0.00064516

# Зворотна конвертація (м² → дюйми²)
area_sq_inches = area_m2 * 1550.0031
```

### Конвертація об'єму

```ruby
# === З КУБІЧНИХ ДЮЙМІВ В ІНШІ ОДИНИЦІ ===

volume_cu_inches = solid.volume  # Це в дюймах³!

# В мм³
volume_mm3 = volume_cu_inches * 16387.064

# В см³
volume_cm3 = volume_cu_inches * 16.387064

# В м³
volume_m3 = volume_cu_inches * 0.000016387064

# В літри
volume_liters = volume_cu_inches * 0.016387064
```

### Константи для конвертації

```ruby
module Units
  # Довжина
  INCH_TO_MM = 25.4
  INCH_TO_CM = 2.54
  INCH_TO_M = 0.0254
  MM_TO_INCH = 0.0393701
  
  # Площа
  SQ_INCH_TO_MM2 = 645.16
  SQ_INCH_TO_CM2 = 6.4516
  SQ_INCH_TO_M2 = 0.00064516
  M2_TO_SQ_INCH = 1550.0031
  
  # Об'єм
  CU_INCH_TO_MM3 = 16387.064
  CU_INCH_TO_CM3 = 16.387064
  CU_INCH_TO_M3 = 0.000016387064
  CU_INCH_TO_L = 0.016387064
end

# Використання
area_m2 = face.area * Units::SQ_INCH_TO_M2
```

---

## 📏 РОЗРАХУНОК ПЛОЩІ

### Площа верхньої грані компонента

```ruby
# === МЕТОД 1: БЕЗ ТРАНСФОРМАЦІЇ (неправильно!) ===
def get_top_area_wrong(component_instance)
  total_area = 0
  
  component_instance.definition.entities.grep(Sketchup::Face).each do |face|
    if face.normal.z > 0.9  # Верхня грань (нормаль вгору)
      total_area += face.area
    end
  end
  
  # ❌ НЕ ВРАХОВУЄ МАСШТАБ КОМПОНЕНТА!
  total_area / 1550.0031  # м²
end


# === МЕТОД 2: З ТРАНСФОРМАЦІЄЮ (правильно!) ===
def get_top_area_correct(component_instance)
  trans = component_instance.transformation
  scale_x = trans.xscale
  scale_y = trans.yscale
  
  total_area = 0
  
  component_instance.definition.entities.grep(Sketchup::Face).each do |face|
    if face.normal.z > 0.9  # Верхня грань
      # ✅ ВРАХОВУЄМО МАСШТАБ!
      total_area += face.area * scale_x * scale_y
    end
  end
  
  total_area / 1550.0031  # м²
end


# === МЕТОД 3: РЕКУРСИВНИЙ (для вкладених компонентів) ===
def get_top_area_recursive(component_instance)
  total_area = 0
  
  process_entities = lambda do |entities, transformation|
    entities.each do |entity|
      if entity.is_a?(Sketchup::Face)
        # Трансформована нормаль
        normal = entity.normal.transform(transformation)
        
        if normal.z > 0.9  # Верхня грань
          scale_x = transformation.xscale
          scale_y = transformation.yscale
          total_area += entity.area * scale_x * scale_y
        end
        
      elsif entity.is_a?(Sketchup::ComponentInstance) || entity.is_a?(Sketchup::Group)
        # Рекурсивно обробляємо вкладені компоненти
        new_trans = transformation * entity.transformation
        process_entities.call(entity.definition.entities, new_trans)
      end
    end
  end
  
  process_entities.call(
    component_instance.definition.entities, 
    component_instance.transformation
  )
  
  total_area / 1550.0031  # м²
end


# === ВИКОРИСТАННЯ ===
foundation = model.active_entities.grep(Sketchup::ComponentInstance)
                  .find { |c| c.definition.name == "Foundation" }

if foundation
  area = get_top_area_correct(foundation)
  puts "Foundation верхня площа: #{area.round(2)} м²"
end
```

### Загальна площа всіх граней

```ruby
def get_total_surface_area(component_instance)
  trans = component_instance.transformation
  scale_x = trans.xscale
  scale_y = trans.yscale
  scale_z = trans.zscale
  
  total_area = 0
  
  component_instance.definition.entities.grep(Sketchup::Face).each do |face|
    # Для довільно орієнтованих граней потрібно враховувати
    # масштаб відповідно до орієнтації нормалі
    # Спрощений варіант - беремо середній масштаб
    avg_scale = Math.sqrt(scale_x * scale_y)
    total_area += face.area * avg_scale * avg_scale
  end
  
  total_area / 1550.0031  # м²
end
```

### Площа конкретної грані

```ruby
# Якщо у вас є пряме посилання на грань
face = some_face

# Площа БЕЗ трансформації
area_sq_inches = face.area
area_m2 = area_sq_inches / 1550.0031

# Якщо грань всередині компонента - треба враховувати масштаб!
```

### Площа через bounds (приблизно)

```ruby
# Для прямокутних об'єктів можна використати bounds
component = model.selection.first
bounds = component.bounds

# Площа "підошви" (по XY)
area_xy = bounds.width * bounds.depth
area_xy_m2 = (area_xy * 25.4 * 25.4) / 1000000  # мм² → м²

# АБО простіше (дюйми² → м²)
area_xy_m2 = area_xy / 1550.0031

puts "Площа: #{area_xy_m2.round(2)} м²"
```

---

## 📦 РОЗРАХУНОК ОБ'ЄМУ

### Об'єм компонента

```ruby
def get_volume(component_instance)
  trans = component_instance.transformation
  scale_x = trans.xscale
  scale_y = trans.yscale
  scale_z = trans.zscale
  
  total_volume = 0
  
  # Шукаємо всі тверді тіла (Solids)
  component_instance.definition.entities.each do |entity|
    if entity.respond_to?(:volume)
      # Враховуємо масштаб (об'єм = scale_x * scale_y * scale_z)
      total_volume += entity.volume * scale_x * scale_y * scale_z
    end
  end
  
  # Конвертація: дюйми³ → м³
  total_volume * 0.000016387064
end

# Використання
foundation = model.active_entities.grep(Sketchup::ComponentInstance)
                  .find { |c| c.definition.name == "Foundation" }

if foundation
  volume_m3 = get_volume(foundation)
  puts "Об'єм: #{volume_m3.round(3)} м³"
end
```

### Об'єм через bounds (приблизно)

```ruby
bounds = component.bounds

volume_cu_inches = bounds.width * bounds.depth * bounds.height
volume_m3 = volume_cu_inches * 0.000016387064

puts "Об'єм (приблизно): #{volume_m3.round(3)} м³"
```

---

## 🔄 ТРАНСФОРМАЦІЇ

### Отримання параметрів трансформації

```ruby
trans = component.transformation

# Позиція (origin point)
origin = trans.origin
x = origin.x  # дюйми
y = origin.y
z = origin.z

# Масштаб
scale_x = trans.xscale
scale_y = trans.yscale
scale_z = trans.zscale

# Перевірка чи є масштабування
is_scaled = (scale_x != 1.0 || scale_y != 1.0 || scale_z != 1.0)

# Обертання (складніше - треба розкладати матрицю)
# Зазвичай використовують trans.to_a для отримання всієї матриці
```

### Застосування трансформації

```ruby
# Переміщення
vector = Geom::Vector3d.new(100.mm, 200.mm, 0)
component.transform!(vector)

# Обертання (навколо осі Z на 90°)
center = component.bounds.center
angle = 90.degrees  # або Math::PI / 2
rotation = Geom::Transformation.rotation(center, Geom::Vector3d.new(0, 0, 1), angle)
component.transform!(rotation)

# Масштабування
scale = Geom::Transformation.scaling(2.0, 1.5, 1.0)  # X×2, Y×1.5, Z×1
component.transform!(scale)

# Комбінована трансформація
combined = Geom::Transformation.new
combined = combined * translation
combined = combined * rotation
combined = combined * scale
component.transform!(combined)
```

---

## 🛠️ СТВОРЕННЯ ТА РЕДАГУВАННЯ

### Створення нового компонента

```ruby
model = Sketchup.active_model
model.start_operation('Create Component', true)

begin
  # Створюємо визначення
  comp_def = model.definitions.add("MyComponent")
  
  # Додаємо геометрію
  points = [
    Geom::Point3d.new(0, 0, 0),
    Geom::Point3d.new(1000.mm, 0, 0),
    Geom::Point3d.new(1000.mm, 500.mm, 0),
    Geom::Point3d.new(0, 500.mm, 0)
  ]
  
  face = comp_def.entities.add_face(points)
  face.pushpull(200.mm)
  
  # Додаємо екземпляр в модель
  transformation = Geom::Transformation.new
  instance = model.active_entities.add_instance(comp_def, transformation)
  
  model.commit_operation
  
rescue => e
  model.abort_operation
  puts "Помилка: #{e.message}"
end
```

### Редагування існуючого компонента

```ruby
component = model.selection.first

if component.is_a?(Sketchup::ComponentInstance)
  model.start_operation('Edit Component', true)
  
  begin
    # Змінюємо властивості
    component.definition.name = "NewName"
    component.layer = "Layer1"
    component.material = Sketchup::Color.new(255, 0, 0)
    
    # Додаємо геометрію всередину
    component.definition.entities.add_cline([0,0,0], [100.mm, 100.mm, 0])
    
    model.commit_operation
  rescue => e
    model.abort_operation
  end
end
```

### Видалення компонента

```ruby
# Видалити екземпляр
component.erase!

# Видалити визначення (якщо немає екземплярів)
definition = model.definitions["ComponentName"]
model.definitions.remove(definition) if definition

# Очистити всі невикористані визначення
model.definitions.purge_unused
```

---

## 💡 ПРАКТИЧНІ ПРИКЛАДИ

### Приклад 1: Отримати площу та об'єм Foundation

```ruby
def get_foundation_info
  model = Sketchup.active_model
  foundation = model.active_entities.grep(Sketchup::ComponentInstance)
                    .find { |c| c.definition.name == "Foundation" }
  
  return nil unless foundation
  
  bounds = foundation.bounds
  trans = foundation.transformation
  
  # Розміри
  width = bounds.width.to_mm
  depth = bounds.depth.to_mm
  height = bounds.height.to_mm
  
  # Площа верхньої грані (з трансформацією)
  scale_x = trans.xscale
  scale_y = trans.yscale
  
  top_area = 0
  foundation.definition.entities.grep(Sketchup::Face).each do |face|
    if face.normal.z > 0.9
      top_area += face.area * scale_x * scale_y
    end
  end
  top_area_m2 = top_area / 1550.0031
  
  # Об'єм
  volume_cu_inches = bounds.width * bounds.depth * bounds.height
  volume_m3 = volume_cu_inches * 0.000016387064
  
  {
    name: "Foundation",
    width_mm: width.round(1),
    depth_mm: depth.round(1),
    height_mm: height.round(1),
    top_area_m2: top_area_m2.round(2),
    volume_m3: volume_m3.round(3)
  }
end

# Використання
info = get_foundation_info
if info
  puts "Foundation:"
  puts "  Розміри: #{info[:width_mm]} × #{info[:depth_mm]} × #{info[:height_mm]} мм"
  puts "  Площа верху: #{info[:top_area_m2]} м²"
  puts "  Об'єм: #{info[:volume_m3]} м³"
end
```

### Приклад 2: Площа BlindArea (відмостка)

```ruby
def get_blind_area_info
  model = Sketchup.active_model
  blind_area = model.active_entities.grep(Sketchup::ComponentInstance)
                    .find { |c| c.definition.name == "BlindArea" }
  
  return nil unless blind_area
  
  trans = blind_area.transformation
  scale_x = trans.xscale
  scale_y = trans.yscale
  
  # Функція для рекурсивного пошуку граней
  process_entities = lambda do |entities, transformation, faces|
    entities.each do |entity|
      if entity.is_a?(Sketchup::Face)
        normal = entity.normal.transform(transformation)
        if normal.z > 0.9  # Верхня грань
          sx = transformation.xscale
          sy = transformation.yscale
          faces << { face: entity, scale_x: sx, scale_y: sy }
        end
      elsif entity.is_a?(Sketchup::ComponentInstance) || entity.is_a?(Sketchup::Group)
        new_trans = transformation * entity.transformation
        process_entities.call(entity.definition.entities, new_trans, faces)
      end
    end
    faces
  end
  
  # Збираємо всі верхні грані
  top_faces = []
  process_entities.call(
    blind_area.definition.entities, 
    blind_area.transformation,
    top_faces
  )
  
  # Рахуємо загальну площу
  total_area = 0
  top_faces.each do |data|
    total_area += data[:face].area * data[:scale_x] * data[:scale_y]
  end
  
  area_m2 = total_area / 1550.0031
  
  {
    name: "BlindArea",
    top_area_m2: area_m2.round(2),
    faces_count: top_faces.length
  }
end

# Використання
info = get_blind_area_info
if info
  puts "BlindArea:"
  puts "  Площа верху: #{info[:top_area_m2]} м²"
  puts "  Кількість граней: #{info[:faces_count]}"
end
```

### Приклад 3: Всі компоненти з площами

```ruby
def get_all_components_info
  model = Sketchup.active_model
  components = model.active_entities.grep(Sketchup::ComponentInstance)
  
  results = []
  
  components.each do |component|
    trans = component.transformation
    bounds = component.bounds
    
    # Площа верхньої грані
    top_area = 0
    component.definition.entities.grep(Sketchup::Face).each do |face|
      if face.normal.z > 0.9
        top_area += face.area * trans.xscale * trans.yscale
      end
    end
    
    results << {
      name: component.definition.name,
      width_mm: bounds.width.to_mm.round(1),
      depth_mm: bounds.depth.to_mm.round(1),
      height_mm: bounds.height.to_mm.round(1),
      top_area_m2: (top_area / 1550.0031).round(2)
    }
  end
  
  results
end

# Використання
components = get_all_components_info
components.each do |comp|
  puts "#{comp[:name]}:"
  puts "  Розміри: #{comp[:width_mm]} × #{comp[:depth_mm]} × #{comp[:height_mm]} мм"
  puts "  Площа: #{comp[:top_area_m2]} м²"
  puts ""
end
```

### Приклад 4: Копіювання з Ruby Console

```ruby
# Швидкі команди для копіювання в консоль:

# 1. Площа вибраного компонента
s=Sketchup.active_model.selection.first;t=s.transformation;a=0;s.definition.entities.grep(Sketchup::Face).each{|f|a+=f.area*t.xscale*t.yscale if f.normal.z>0.9};puts "#{(a/1550.0031).round(2)} м²"

# 2. Розміри вибраного
s=Sketchup.active_model.selection.first;b=s.bounds;puts "#{b.width.to_mm.round(1)} × #{b.depth.to_mm.round(1)} × #{b.height.to_mm.round(1)} мм"

# 3. Площа Foundation
f=Sketchup.active_model.active_entities.grep(Sketchup::ComponentInstance).find{|c|c.definition.name=="Foundation"};t=f.transformation;a=0;f.definition.entities.grep(Sketchup::Face).each{|f|a+=f.area*t.xscale*t.yscale if f.normal.z>0.9};puts "#{(a/1550.0031).round(2)} м²" if f

# 4. Площа BlindArea
ba=Sketchup.active_model.active_entities.grep(Sketchup::ComponentInstance).find{|c|c.definition.name=="BlindArea"};t=ba.transformation;a=0;ba.definition.entities.grep(Sketchup::Face).each{|f|a+=f.area*t.xscale*t.yscale if f.normal.z>0.9};puts "#{(a/1550.0031).round(2)} м²" if ba
```

---

## 📝 КОРИСНІ КОНСТАНТИ

### Одиниці вимірювання

```ruby
module ProGran3
  module Units
    # Довжина
    INCH_TO_MM = 25.4
    INCH_TO_CM = 2.54
    INCH_TO_M = 0.0254
    MM_TO_INCH = 1.0 / 25.4
    CM_TO_INCH = 1.0 / 2.54
    M_TO_INCH = 1.0 / 0.0254
    
    # Площа
    SQ_INCH_TO_MM2 = 645.16
    SQ_INCH_TO_CM2 = 6.4516
    SQ_INCH_TO_M2 = 0.00064516
    M2_TO_SQ_INCH = 1550.0031
    CM2_TO_SQ_INCH = 0.155
    MM2_TO_SQ_INCH = 0.00155
    
    # Об'єм
    CU_INCH_TO_MM3 = 16387.064
    CU_INCH_TO_CM3 = 16.387064
    CU_INCH_TO_M3 = 0.000016387064
    CU_INCH_TO_L = 0.016387064
    M3_TO_CU_INCH = 61023.7441
    L_TO_CU_INCH = 61.0237441
    
    # Helper методи
    def self.to_m2(sq_inches)
      sq_inches * SQ_INCH_TO_M2
    end
    
    def self.to_m3(cu_inches)
      cu_inches * CU_INCH_TO_M3
    end
    
    def self.to_mm(inches)
      inches * INCH_TO_MM
    end
  end
end

# Використання
area_m2 = ProGran3::Units.to_m2(face.area)
```

---

## ⚠️ ВАЖЛИВІ ПОРАДИ

### 1. Завжди враховуйте трансформації!

```ruby
# ❌ НЕПРАВИЛЬНО
area = face.area / 1550.0031

# ✅ ПРАВИЛЬНО
trans = component.transformation
area = (face.area * trans.xscale * trans.yscale) / 1550.0031
```

### 2. Використовуйте операції для Undo/Redo

```ruby
model.start_operation('Operation Name', true)
begin
  # ваші зміни
  model.commit_operation
rescue => e
  model.abort_operation
  raise e
end
```

### 3. Перевіряйте існування компонентів

```ruby
component = find_component("Foundation")
return unless component  # або raise error

# продовжуємо роботу
```

### 4. Кешуйте результати для продуктивності

```ruby
# Якщо викликаєте багато разів - кешуйте
@foundation_area ||= calculate_foundation_area
```

### 5. Використовуйте правильні одиниці

```ruby
# При створенні геометрії завжди використовуйте .mm
width = 1000.mm   # ✅ Правильно
width = 1000      # ❌ Це буде 1000 дюймів!
```

---

## 🔗 КОРИСНІ ПОСИЛАННЯ

- [SketchUp Ruby API Documentation](https://ruby.sketchup.com/)
- [ComponentInstance Class](https://ruby.sketchup.com/Sketchup/ComponentInstance.html)
- [ComponentDefinition Class](https://ruby.sketchup.com/Sketchup/ComponentDefinition.html)
- [Face Class](https://ruby.sketchup.com/Sketchup/Face.html)
- [Transformation Class](https://ruby.sketchup.com/Geom/Transformation.html)
- [BoundingBox Class](https://ruby.sketchup.com/Geom/BoundingBox.html)

---

## 📋 ЧЕКЛИСТ ДЛЯ РОЗРОБНИКІВ

При роботі з компонентами завжди:

- [ ] Перевіряю чи компонент існує
- [ ] Враховую трансформації (масштаб, обертання)
- [ ] Використовую правильну конвертацію одиниць
- [ ] Обгортаю зміни в start_operation / commit_operation
- [ ] Додаю обробку помилок (rescue)
- [ ] Тестую в Ruby Console перед інтеграцією
- [ ] Документую складні розрахунки
- [ ] Оптимізую для продуктивності (кешування)

---

**Документ створено:** 18 жовтня 2025  
**Версія:** 1.0  
**Автор:** ProGran3 Development Team  
**Статус:** ✅ Production Ready

