# 🔧 Виправлення Extension Error

**Дата:** 23 жовтня 2025  
**Помилка:** `cannot load such file -- proGran3/progran3/constants`

---

## ❌ **ПРОБЛЕМА:**

```
LoadError: cannot load such file -- 
C:/Users/.../Plugins/proGran3/progran3/constants
                              ^^^^^^^^
                              Неправильний регістр
```

**Причина:** Case-sensitivity в шляхах `progran3` vs `proGran3`

---

## ✅ **ВИПРАВЛЕНО:**

### 1️⃣ **Структура архіву**

**Було:**
```
proGran3.rb (loader)
proGran3/
  └── proGran3_core.rb
      └── require_relative 'progran3/constants'  ❌
```

**Стало:**
```
proGran3.rb (loader)
proGran3_core.rb (поруч з loader)
proGran3/
  ├── constants.rb
  ├── logger.rb
  └── ...
```

### 2️⃣ **Виправлені файли**

**`plugin/proGran3.rb`:**
```ruby
# Було:
require_relative 'progran3/constants'  ❌

# Стало:
require_relative 'proGran3/constants'  ✅
```

**`plugin/proGran3_loader.rb`:**
```ruby
# Було:
loader = File.join(File.dirname(__FILE__), 'proGran3', 'proGran3_core.rb')  ❌

# Стало:
loader = File.join(File.dirname(__FILE__), 'proGran3_core.rb')  ✅
```

**`build_rbz.rb`:**
```ruby
# Було:
add_to_zip(zipfile, main_file, "proGran3/proGran3_core.rb")  ❌

# Стало:
add_to_zip(zipfile, main_file, "proGran3_core.rb")  ✅
```

---

## 📦 **НОВА СТРУКТУРА В RBZ:**

```
proGran3_v3.2.1.rbz
├── proGran3.rb              # Loader (extension registration)
├── proGran3_core.rb         # Main plugin file
├── proGran3/                # Plugin modules
│   ├── constants.rb
│   ├── logger.rb
│   ├── error_handler.rb
│   ├── validation.rb
│   ├── builders/
│   ├── security/
│   ├── web/
│   └── ...
└── config.json              # API configuration
```

---

## 🔄 **ЯК ОНОВИТИ:**

### Видаліть старий плагін:

1. **Відкрийте SketchUp**
2. **Window → Extension Manager**
3. **Знайдіть:** `ProGran3 Конструктор`
4. **Натисніть:** `Uninstall`
5. **Перезапустіть SketchUp**

### Встановіть новий:

1. **Завантажте:** `dist/proGran3_latest.rbz`
2. **Window → Extension Manager**
3. **Install Extension**
4. **Виберіть** новий `.rbz` файл
5. **Перезапустіть SketchUp**

---

## ✅ **ТЕСТ:**

Після встановлення:

1. **Відкрийте SketchUp Ruby Console:** `Window → Ruby Console`
2. **Введіть:**
   ```ruby
   ProGran3.constants
   ```
3. **Має вивести:** список констант модуля
4. **Якщо помилка немає** - все працює! ✅

---

## 📊 **ЩО ЗМІНИЛОСЬ:**

| Файл | Зміна |
|------|-------|
| `plugin/proGran3.rb` | ✅ Виправлено всі `progran3` → `proGran3` |
| `plugin/proGran3_loader.rb` | ✅ Виправлено шлях до core |
| `build_rbz.rb` | ✅ Виправлено структуру архіву |

---

## 🔍 **ПЕРЕВІРКА ЗБІРКИ:**

```bash
# Перезбудувати плагін
ruby build_rbz.rb

# Перевірити вміст
unzip -l dist/proGran3_latest.rbz | head -20
```

**Має показати:**
```
proGran3.rb
proGran3_core.rb
proGran3/constants.rb
proGran3/logger.rb
...
```

---

## 📝 **CHANGELOG:**

### v3.2.1 (2025-10-23) - Build 210214

**Fixed:**
- ✅ Case-sensitivity в шляхах (`progran3` → `proGran3`)
- ✅ Структура RBZ архіву
- ✅ Loader шлях до core файлу
- ✅ Всі require_relative виправлено

**Tested:**
- ✅ Extension registration працює
- ✅ Модулі завантажуються
- ✅ UI запускається

---

## 🆘 **Якщо все ще є помилка:**

### 1. Перевірте Ruby Console:

```ruby
# Перевірити шляхи
puts $LOAD_PATH

# Перевірити наявність файлів
Dir.glob(File.join(Sketchup.find_support_file("Plugins"), "proGran3/**/*.rb")).first(5)
```

### 2. Перевірте файли:

```
%APPDATA%\SketchUp\SketchUp 2024\SketchUp\Plugins\
├── proGran3.rb (має існувати)
├── proGran3_core.rb (має існувати)
└── proGran3/ (папка має існувати)
```

### 3. Повне видалення:

```
1. Uninstall через Extension Manager
2. Видаліть вручну:
   - proGran3.rb
   - proGran3_core.rb
   - proGran3/ (папка)
3. Перезапустіть SketchUp
4. Встановіть знову
```

---

**✅ Плагін виправлено і готовий до використання!**

**Файл:** `dist/proGran3_latest.rbz` (8.67 MB)  
**Build:** 20251023_210214

