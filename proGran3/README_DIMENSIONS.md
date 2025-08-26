# DimensionsManager - Модуль управління розмірами

## Опис
`DimensionsManager` - це єдиний модуль для централізованого управління розмірами в ProGran3. Забезпечує валідацію, конвертацію та контроль розмірів для всіх елементів плагіна.

## Основні функції

### 1. Конвертація розмірів
```ruby
# Конвертація в SketchUp одиниці (мм)
DimensionsManager.to_sketchup_units(150)           # => 150.mm
DimensionsManager.to_sketchup_units("150mm")       # => 150.mm
DimensionsManager.to_sketchup_units("15cm")        # => 150.mm

# Конвертація з SketchUp одиниць
DimensionsManager.from_sketchup_units(150.mm)      # => 150.0
```

### 2. Валідація та конвертація
```ruby
# Валідація з автоматичною конвертацією
result = DimensionsManager.validate_and_convert(2000, :foundation_depth)
if result[:success]
  sketchup_value = result[:value]  # => 2000.mm
else
  errors = result[:errors]         # => ["Довжина повинна бути не більше 5000мм"]
end
```

### 3. Отримання конфігурації розмірів
```ruby
# Отримання налаштувань для типу розміру
config = DimensionsManager.get_dimension_config(:foundation_depth)
# => { min: 500, max: 5000, default: 2000, label: "Довжина" }

# Отримання конкретних значень
default_value = DimensionsManager.get_default_value(:foundation_depth)  # => 2000
min_value = DimensionsManager.get_min_value(:foundation_depth)          # => 500
max_value = DimensionsManager.get_max_value(:foundation_depth)          # => 5000
label = DimensionsManager.get_label(:foundation_depth)                  # => "Довжина"
```

## Підтримувані типи розмірів

### Foundation (Фундамент)
- `:foundation_depth` - Довжина (500-5000мм, за замовчуванням 2000мм)
- `:foundation_width` - Ширина (300-3000мм, за замовчуванням 1000мм)
- `:foundation_height` - Висота (100-500мм, за замовчуванням 150мм)

### Blind Area (Відмостка)
- `:blind_area_thickness` - Товщина (30-200мм, за замовчуванням 50мм)
- `:blind_area_width` - Ширина (50-1000мм, за замовчуванням 300мм)

### Tiles (Плитка)
- `:tiles_thickness` - Товщина (10-100мм, за замовчуванням 30мм)
- `:tiles_border_width` - Ширина рамки (50-1000мм, за замовчуванням 300мм)
- `:tiles_overhang` - Виступ (10-200мм, за замовчуванням 50мм)
- `:tiles_seam` - Шов (1-20мм, за замовчуванням 5мм)

### Cladding (Облицювання)
- `:cladding_thickness` - Товщина (10-100мм, за замовчуванням 20мм)

## Приклади використання

### В UI модулі
```ruby
@dialog.add_action_callback("add_foundation") do |dialog, depth, width, height|
  # Валідація та конвертація розмірів
  depth_result = DimensionsManager.validate_and_convert(depth.to_i, :foundation_depth, "UI")
  width_result = DimensionsManager.validate_and_convert(width.to_i, :foundation_width, "UI")
  height_result = DimensionsManager.validate_and_convert(height.to_i, :foundation_height, "UI")
  
  if depth_result[:success] && width_result[:success] && height_result[:success]
    # Створюємо фундамент з валідними розмірами
    ProGran3::FoundationBuilder.create(
      depth_result[:value],
      width_result[:value], 
      height_result[:value]
    )
  else
    # Обробка помилок валідації
    errors = [depth_result, width_result, height_result]
      .select { |r| !r[:success] }
      .flat_map { |r| r[:errors] }
    UI.messagebox("Помилки валідації: #{errors.join(', ')}")
  end
end
```

### В Builder модулях
```ruby
def create(depth, width, height)
  # Використовуємо DimensionsManager для валідації
  depth_value = DimensionsManager.to_sketchup_units(depth)
  width_value = DimensionsManager.to_sketchup_units(width)
  height_value = DimensionsManager.to_sketchup_units(height)
  
  # Створюємо геометрію
  points = [
    Geom::Point3d.new(0, 0, 0),
    Geom::Point3d.new(depth_value, 0, 0),
    Geom::Point3d.new(depth_value, width_value, 0),
    Geom::Point3d.new(0, width_value, 0)
  ]
  # ...
end
```

## Переваги використання

1. **Централізований контроль** - всі розміри керуються з одного місця
2. **Консистентна валідація** - однакові правила для всіх елементів
3. **Легка підтримка** - зміни в логіці розмірів в одному місці
4. **Гнучкість** - можливість додавання нових типів розмірів
5. **Безпека** - автоматична валідація та обробка помилок

## Майбутні розширення

- Підтримка додаткових одиниць вимірювання (см, м)
- Динамічне перемикання одиниць в UI
- Збереження налаштувань користувача
- Підтримка кастомних діапазонів розмірів
