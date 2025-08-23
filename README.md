# ProGran3 - Плагін для SketchUp

Плагін для створення конструкцій з готових компонентів в SketchUp.

## 🚀 Швидкий старт для розробки

### Варіант 1: Автоматичне копіювання (Рекомендовано)

1. **Запустіть PowerShell скрипт для розгортання:**
   ```powershell
   .\deploy_to_sketchup.ps1
   ```

2. **Для автоматичного спостереження за змінами:**
   ```powershell
   .\deploy_to_sketchup.ps1 -Watch
   ```

3. **Якщо у вас інша версія SketchUp:**
   ```powershell
   .\deploy_to_sketchup.ps1 -SketchUpVersion "2022"
   ```

### Варіант 2: Ручне копіювання

1. Скопіюйте `proGran3.rb` в папку плагінів SketchUp:
   ```
   %APPDATA%\SketchUp\SketchUp 2023\SketchUp\Plugins\
   ```

2. Скопіюйте папку `proGran3` в ту ж папку

### Варіант 3: Символічне посилання (для досвідчених)

```powershell
# Створіть символічне посилання (потрібні права адміністратора)
New-Item -ItemType SymbolicLink -Path "$env:APPDATA\SketchUp\SketchUp 2023\SketchUp\Plugins\proGran3.rb" -Target "$PWD\proGran3.rb"
New-Item -ItemType SymbolicLink -Path "$env:APPDATA\SketchUp\SketchUp 2023\SketchUp\Plugins\proGran3" -Target "$PWD\proGran3"
```

## 🔄 Перезавантаження плагіна

### В консолі Ruby SketchUp:
```ruby
ProGran3.reload
```

### Тестування плагіна:
```ruby
ProGran3.test
```

## 📁 Структура проекту

```
ProGran3/
├── proGran3.rb              # Головний файл плагіна
├── proGran3/                # Папка з модулями
│   ├── loader.rb            # Завантаження компонентів
│   ├── ui.rb               # Інтерфейс користувача
│   ├── builders/           # Будівельники
│   │   ├── foundation_builder.rb
│   │   ├── tiling_builder.rb
│   │   └── cladding_builder.rb
│   └── assets/             # 3D компоненти
│       ├── flowerbeds/
│       ├── gravestones/
│       ├── pavement_tiles/
│       ├── stands/
│       └── steles/
├── deploy_to_sketchup.ps1   # PowerShell скрипт розгортання
├── deploy_to_sketchup.rb    # Ruby скрипт розгортання
└── README.md               # Цей файл
```

## 🛠️ Розробка

### Робочий процес:

1. **Редагуйте файли** в папці проекту на робочому столі
2. **Запустіть режим спостереження:**
   ```powershell
   .\deploy_to_sketchup.ps1 -Watch
   ```
3. **Тестуйте зміни** в SketchUp
4. **Перезавантажуйте плагін** в консолі Ruby: `ProGran3.reload`

### Корисні команди в консолі Ruby SketchUp:

```ruby
# Перезавантажити плагін
ProGran3.reload

# Протестувати плагін
ProGran3.test

# Показати шлях до плагіна
puts File.dirname(__FILE__)

# Перевірити завантажені файли
$LOADED_FEATURES.grep(/progran3/)
```

## 🔧 Налаштування

### Зміна шляху до SketchUp:

Відредагуйте файл `deploy_to_sketchup.ps1`:
```powershell
$SKETCHUP_PLUGINS_PATH = "ВАШ_ШЛЯХ_ДО_ПЛАГІНІВ"
```

### Типові шляхи:
- **SketchUp 2023:** `%APPDATA%\SketchUp\SketchUp 2023\SketchUp\Plugins`
- **SketchUp 2022:** `%APPDATA%\SketchUp\SketchUp 2022\SketchUp\Plugins`
- **SketchUp 2021:** `%APPDATA%\SketchUp\SketchUp 2021\SketchUp\Plugins`

## 🐛 Вирішення проблем

### Плагін не завантажується:
1. Перевірте шлях до папки плагінів
2. Перезапустіть SketchUp
3. Перевірте синтаксис Ruby файлів

### Помилки при копіюванні:
1. Переконайтеся, що SketchUp закритий
2. Перевірте права доступу до папки
3. Запустіть PowerShell від імені адміністратора

### Автоматичне копіювання не працює:
1. Встановіть gem `listen`: `gem install listen`
2. Або використовуйте PowerShell скрипт

## 📝 Нотатки

- Завжди зберігайте резервні копії перед великими змінами
- Тестуйте зміни в окремому файлі SketchUp
- Використовуйте консоль Ruby для діагностики
- Документуйте нові функції

## 🤝 Внесок

1. Форкніть проект
2. Створіть гілку для нової функції
3. Зробіть коміт змін
4. Створіть Pull Request

---

**Happy coding! 🎉**
