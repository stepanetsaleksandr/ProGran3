# Universal SKP Preview Extractor

Універсальний модуль для витягування превью з `.skp` файлів SketchUp.

## 📋 Опис

Цей модуль дозволяє витягувати вбудовані превью з файлів SketchUp (`.skp`) без необхідності відкривати їх в інтерфейсі. Модуль використовує SketchUp Ruby API для завантаження компонентів та витягування їх вбудованих превью.

## ✨ Особливості

- ✅ **Універсальність** - можна використовувати в будь-якому SketchUp плагіні
- ✅ **Гнучкість** - налаштування через конфігураційний об'єкт
- ✅ **Безпека** - автоматичне очищення пам'яті після витягування
- ✅ **Масштабованість** - підтримка обробки кількох файлів
- ✅ **Обробка помилок** - налаштовувані стратегії обробки помилок
- ✅ **Логування** - детальне логування процесу

## 🚀 Швидкий старт

### 1. Підключення модуля

```ruby
# Завантажуємо модуль
load 'path/to/universal_skp_preview_extractor.rb'

# Або в плагіні
require_relative 'universal_skp_preview_extractor'
```

### 2. Базове використання

```ruby
# Просте витягування превью
result = UniversalSkpPreviewExtractor.extract_preview("path/to/file.skp")

if result[:success]
  puts "Превью збережено: #{result[:output_path]}"
else
  puts "Помилка: #{result[:error]}"
end
```

### 3. З налаштуваннями

```ruby
# Створюємо конфігурацію
config = UniversalSkpPreviewExtractor::Config.new(
  output_size: 512,
  output_format: 'jpg',
  output_dir: 'C:/MyPreviews',
  verbose_logging: false
)

# Витягуємо превью
result = UniversalSkpPreviewExtractor.extract_preview("path/to/file.skp", config)
```

## 📖 Детальна документація

### Методи

#### `extract_preview(skp_file_path, config = nil)`

Витягує превью з одного `.skp` файлу.

**Параметри:**
- `skp_file_path` (String) - шлях до `.skp` файлу
- `config` (Config) - конфігурація (опціонально)

**Повертає:**
```ruby
{
  success: true/false,
  output_path: "path/to/preview.png",
  file_size: 12345,
  original_file: "path/to/file.skp",
  error: "error message" # тільки якщо success: false
}
```

#### `extract_multiple_previews(skp_file_paths, config = nil)`

Витягує превью з кількох `.skp` файлів.

**Параметри:**
- `skp_file_paths` (Array) - масив шляхів до `.skp` файлів
- `config` (Config) - конфігурація (опціонально)

**Повертає:**
```ruby
{
  total_files: 10,
  successful: 8,
  failed: 2,
  results: [
    { success: true, output_path: "...", ... },
    { success: false, error: "...", ... }
  ]
}
```

#### `extract_from_directory(directory_path, config = nil)`

Знаходить всі `.skp` файли в директорії та витягує їх превью.

**Параметри:**
- `directory_path` (String) - шлях до директорії
- `config` (Config) - конфігурація (опціонально)

#### `test_extraction(test_file_path = nil, config = nil)`

Тестує модуль на вказаному файлі або знаходить тестовий файл автоматично.

### Конфігурація

#### `UniversalSkpPreviewExtractor::Config`

**Параметри:**
- `output_size` (Integer) - розмір превью (за замовчуванням: 256)
- `output_format` (String) - формат файлу ('png', 'jpg') (за замовчуванням: 'png')
- `output_dir` (String) - директорія для збереження (за замовчуванням: тимчасова папка)
- `cleanup_after_extraction` (Boolean) - очищати пам'ять після витягування (за замовчуванням: true)
- `verbose_logging` (Boolean) - детальне логування (за замовчуванням: true)
- `error_handling` (Symbol) - стратегія обробки помилок:
  - `:raise` - викидати виняток
  - `:return_nil` - повертати nil
  - `:log_only` - тільки логувати (за замовчуванням)

## 💡 Приклади використання

### Приклад 1: Простий плагін

```ruby
# my_plugin.rb
require_relative 'universal_skp_preview_extractor'

module MyPlugin
  def self.create_preview_library
    # Конфігурація для бібліотеки
    config = UniversalSkpPreviewExtractor::Config.new(
      output_size: 256,
      output_dir: File.join(File.dirname(__FILE__), 'previews'),
      verbose_logging: false
    )
    
    # Витягуємо превью з директорії
    result = UniversalSkpPreviewExtractor.extract_from_directory(
      'C:/MyComponents', 
      config
    )
    
    puts "Оброблено: #{result[:successful]}/#{result[:total_files]} файлів"
  end
end
```

### Приклад 2: Інтеграція в UI

```ruby
# ui_handler.rb
def handle_preview_generation
  # Створюємо конфігурацію
  config = UniversalSkpPreviewExtractor::Config.new(
    output_size: 512,
    output_format: 'jpg',
    cleanup_after_extraction: true,
    error_handling: :log_only
  )
  
  # Витягуємо превью
  result = UniversalSkpPreviewExtractor.extract_preview(@selected_file, config)
  
  if result[:success]
    # Оновлюємо UI з новим превью
    update_preview_image(result[:output_path])
  else
    # Показуємо помилку
    show_error_message(result[:error])
  end
end
```

### Приклад 3: Batch обробка

```ruby
# batch_processor.rb
def process_component_library
  # Знаходимо всі .skp файли
  skp_files = Dir.glob("C:/Components/**/*.skp")
  
  # Конфігурація для batch обробки
  config = UniversalSkpPreviewExtractor::Config.new(
    output_size: 256,
    output_dir: 'C:/Previews',
    verbose_logging: true,
    error_handling: :log_only
  )
  
  # Обробляємо всі файли
  result = UniversalSkpPreviewExtractor.extract_multiple_previews(skp_files, config)
  
  # Виводимо статистику
  puts "=== Результати обробки ==="
  puts "Всього файлів: #{result[:total_files]}"
  puts "Успішно: #{result[:successful]}"
  puts "Невдало: #{result[:failed]}"
  
  # Показуємо помилки
  result[:results].each_with_index do |file_result, index|
    unless file_result[:success]
      puts "Помилка в файлі #{skp_files[index]}: #{file_result[:error]}"
    end
  end
end
```

### Приклад 4: Інтеграція в існуючий плагін

```ruby
# progran3.rb
require_relative 'universal_skp_preview_extractor'

module ProGran3
  # Використовуємо універсальний модуль
  def self.extract_skp_preview(skp_file_path, size = 256)
    config = UniversalSkpPreviewExtractor::Config.new(
      output_size: size,
      output_dir: File.join(File.dirname(__FILE__), 'previews'),
      verbose_logging: false
    )
    
    result = UniversalSkpPreviewExtractor.extract_preview(skp_file_path, config)
    
    # Повертаємо тільки шлях до файлу для сумісності
    result[:success] ? result[:output_path] : nil
  end
end
```

## 🔧 Тестування

```ruby
# Тестування модуля
result = UniversalSkpPreviewExtractor.test_extraction

if result[:success]
  puts "✅ Модуль працює коректно"
  puts "📁 Превью збережено: #{result[:output_path]}"
else
  puts "❌ Помилка тестування: #{result[:error]}"
end
```

## ⚠️ Важливі зауваження

1. **SketchUp API** - модуль вимагає активного SketchUp сеансу
2. **Пам'ять** - автоматично очищає тимчасово завантажені компоненти
3. **Файлова система** - створює директорії автоматично
4. **Помилки** - налаштовувана обробка помилок
5. **Продуктивність** - рекомендується обробка файлів поступово для великих колекцій

## 📄 Ліцензія

Цей модуль розроблений для ProGran3 Team і може використовуватися в будь-яких проектах.

## 🤝 Підтримка

Для питань та пропозицій звертайтеся до команди розробки ProGran3.
