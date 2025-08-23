# 🧪 Тестові функції ProGran3

Документація для нових функцій, що тестуються в ProGran3.

## 🎯 Тестовий блок

### Створення тестового блоку
```ruby
# Створює базову платформу для тестування
ProGran3.create_test_block
```

### Видалення тестового блоку
```ruby
# Видаляє тестовий блок та всі пов'язані об'єкти
ProGran3.cleanup_tests
```

## 🖼️ 3D Превью компонентів

### Генерація превью одного компонента
```ruby
# Створює 3D превью компонента в SketchUp
component_path = "proGran3/assets/stands/stand_50x20x15.skp"
ProGran3.generate_preview(component_path)
```

### Створення галереї превью
```ruby
# Створює галерею всіх компонентів категорії
ProGran3.create_gallery("stands")

# Створює галерею всіх компонентів
ProGran3.create_gallery
```

## 📸 Автоматична генерація зображень

### Генерація превью зображення
```ruby
# Генерує PNG зображення компонента
component_path = "proGran3/assets/stands/stand_50x20x15.skp"
ProGran3.generate_preview_image(component_path)
```

### Генерація превью для категорії
```ruby
# Генерує превью для всіх компонентів категорії
ProGran3.generate_category_previews("stands")
```

### Генерація всіх превью
```ruby
# Генерує превью для всіх компонентів
ProGran3.generate_all_previews
```

### Автоматична перевірка та генерація
```ruby
# Перевіряє чи існує превью, якщо ні - генерує
ProGran3.ensure_preview_exists(component_path)
```

## 🧪 Комплексне тестування

### Тестування всіх нових функцій
```ruby
# Запускає всі тести послідовно
ProGran3.test_new_features
```

## 📁 Структура файлів

```
proGran3/
├── test_features.rb          # Тестовий модуль
├── preview_generator.rb      # Генератор превью
├── previews/                 # Папка з згенерованими зображеннями
│   ├── stand_50x20x15_preview.png
│   ├── stele_100x50x8_preview.png
│   └── ...
└── ...
```

## 🎨 Особливості генерації превью

### 3D Превью в SketchUp:
- Автоматичне масштабування до стандартного розміру
- Центрування компонента
- Групування для зручного управління

### Зображення превью:
- Розмір: 256x256 пікселів (налаштовується)
- Формат: PNG з компресією
- Автоматичне налаштування камери
- Стиль: Shaded з ребрами

## 🔧 Налаштування

### Розмір превью зображень
```ruby
# Змінити розмір в preview_generator.rb
def generate_preview_image(component_path, size = 512)  # Збільшити до 512
```

### Стиль відображення
```ruby
# В setup_preview_camera можна змінити:
view.rendering_options["DisplayMode"] = 1  # Wireframe
view.rendering_options["DrawEdges"] = false  # Без ребер
```

## 🚀 Приклади використання

### Швидкий старт
```ruby
# 1. Створити тестовий блок
ProGran3.create_test_block

# 2. Згенерувати превью для всіх компонентів
ProGran3.generate_all_previews

# 3. Створити галерею
ProGran3.create_gallery("stands")

# 4. Очистити після тестування
ProGran3.cleanup_tests
```

### Робота з конкретним компонентом
```ruby
# Знайти компонент
component_path = "proGran3/assets/steles/stele_100x50x8.skp"

# Створити 3D превью
ProGran3.generate_preview(component_path)

# Згенерувати зображення
ProGran3.generate_preview_image(component_path)
```

## ⚠️ Важливі нотатки

1. **Папка превью**: Автоматично створюється в `proGran3/previews/`
2. **Файли превью**: Додаються в `.gitignore` (автогенеровані)
3. **Продуктивність**: Генерація зображень може займати час
4. **Пам'ять**: Тимчасові об'єкти автоматично очищаються

## 🐛 Вирішення проблем

### Помилка "File not found"
```ruby
# Перевірити шлях до компонента
puts File.exist?(component_path)
```

### Помилка генерації зображення
```ruby
# Перевірити права доступу до папки
puts Dir.exist?(ProGran3::PreviewGenerator::PREVIEW_PATH)
```

### Повільна генерація
```ruby
# Зменшити розмір зображення
ProGran3.generate_preview_image(component_path, 128)
```

---

**Happy testing! 🎉**

