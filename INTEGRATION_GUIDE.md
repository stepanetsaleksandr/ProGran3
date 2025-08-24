# 🚀 Гід інтеграції Universal SKP Preview Extractor

## 📦 Швидка інтеграція в ваш проект

### 1. Копіювання файлу
```bash
# Скопіюйте файл в ваш проект
cp universal_skp_preview_extractor.rb /path/to/your/project/
```

### 2. Підключення в плагіні
```ruby
# В основному файлі плагіна
require_relative 'universal_skp_preview_extractor'

# Або завантаження
load 'path/to/universal_skp_preview_extractor.rb'
```

### 3. Базове використання
```ruby
# Простий приклад
result = UniversalSkpPreviewExtractor.extract_preview("path/to/file.skp")
if result[:success]
  puts "Превью: #{result[:output_path]}"
end
```

## 🎯 Типові сценарії використання

### Сценарій 1: Компонентна бібліотека
```ruby
def create_component_library
  config = UniversalSkpPreviewExtractor::Config.new(
    output_size: 256,
    output_dir: 'components/previews',
    verbose_logging: false
  )
  
  result = UniversalSkpPreviewExtractor.extract_from_directory('components', config)
  puts "Створено #{result[:successful]} превью"
end
```

### Сценарій 2: UI інтеграція
```ruby
def generate_preview_for_ui(skp_file)
  config = UniversalSkpPreviewExtractor::Config.new(
    output_size: 512,
    output_format: 'jpg',
    error_handling: :log_only
  )
  
  result = UniversalSkpPreviewExtractor.extract_preview(skp_file, config)
  return result[:output_path] if result[:success]
  return nil
end
```

### Сценарій 3: Batch обробка
```ruby
def process_large_library
  skp_files = Dir.glob("library/**/*.skp")
  
  config = UniversalSkpPreviewExtractor::Config.new(
    output_size: 256,
    verbose_logging: true,
    error_handling: :log_only
  )
  
  result = UniversalSkpPreviewExtractor.extract_multiple_previews(skp_files, config)
  return result
end
```

## ⚙️ Налаштування конфігурації

```ruby
# Повна конфігурація
config = UniversalSkpPreviewExtractor::Config.new(
  output_size: 512,           # Розмір превью
  output_format: 'png',       # Формат файлу
  output_dir: 'previews',     # Директорія збереження
  cleanup_after_extraction: true,  # Очищення пам'яті
  verbose_logging: false,     # Детальне логування
  error_handling: :log_only   # Обробка помилок
)
```

## 🔧 Тестування інтеграції

```ruby
# Тест після інтеграції
result = UniversalSkpPreviewExtractor.test_extraction
if result[:success]
  puts "✅ Інтеграція успішна!"
else
  puts "❌ Помилка: #{result[:error]}"
end
```

## 📋 Перевірний список

- [ ] Файл `universal_skp_preview_extractor.rb` скопійовано в проект
- [ ] Модуль підключено в основному файлі плагіна
- [ ] Протестовано базове витягування превью
- [ ] Налаштовано конфігурацію під потреби проекту
- [ ] Інтегровано в UI (якщо потрібно)
- [ ] Протестовано обробку помилок

## 🆘 Вирішення проблем

### Помилка: "Cannot load such file"
```ruby
# Перевірте шлях до файлу
load File.join(File.dirname(__FILE__), 'universal_skp_preview_extractor.rb')
```

### Помилка: "No active model"
```ruby
# Переконайтеся, що SketchUp відкритий і активний
if Sketchup.active_model
  # Ваш код
end
```

### Помилка: "Component not loaded"
```ruby
# Перевірте, чи існує .skp файл
if File.exist?(skp_file_path)
  # Ваш код
end
```

## 📞 Підтримка

Для додаткових питань звертайтеся до команди ProGran3.
