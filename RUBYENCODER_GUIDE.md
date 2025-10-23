# 🔐 RubyEncoder Guide - Повна обфускація плагіна

**Версія:** 3.2.1  
**Дата:** 23 жовтня 2025

---

## 🎯 **Що таке RubyEncoder?**

**RubyEncoder** - професійний інструмент для компіляції Ruby коду в захищений бінарний формат (.rbe).

**Офіційний сайт:** https://www.rubyencoder.com/

---

## 📦 **Рівні захисту:**

### 1️⃣ **Базова обфускація** (наша)
```bash
build_encrypted.bat
```
✅ Видалення коментарів  
✅ Мінімізація коду  
⚠️ Код залишається читабельним

### 2️⃣ **Покращена обфускація** (наша)
```bash
ruby build_rbz_advanced_obfuscation.rb
```
✅ Base64 кодування рядків  
✅ Обфускація змінних  
✅ Junk код  
⚠️ Структура залишається

### 3️⃣ **RubyEncoder** (професійний)
```bash
rubyencoder [options] file.rb
```
✅ Бінарна компіляція  
✅ Повна обфускація  
✅ Захист від декомпіляції  
✅ Ліцензування вбудоване

---

## 🚀 **Встановлення RubyEncoder:**

### **Крок 1: Купити ліцензію**

**Ціни (2025):**
- Personal: $99/рік
- Professional: $299/рік
- Enterprise: $999/рік

**Купити:** https://www.rubyencoder.com/buy.html

### **Крок 2: Завантажити**

```bash
# Windows
https://www.rubyencoder.com/loaders/rubyencoder-2.x-win32.zip

# Linux
https://www.rubyencoder.com/loaders/rubyencoder-2.x-linux.tar.gz

# Mac
https://www.rubyencoder.com/loaders/rubyencoder-2.x-macos.tar.gz
```

### **Крок 3: Встановити**

**Windows:**
```bash
1. Розпакувати архів
2. Додати до PATH:
   C:\RubyEncoder\bin

3. Перевірити:
   rubyencoder --version
```

---

## 🔧 **Використання з ProGran3:**

### **Метод 1: Кодування окремих файлів**

```bash
# Закодувати головний файл
rubyencoder plugin/proGran3.rb -o plugin/proGran3.rbe

# Закодувати модулі
rubyencoder plugin/proGran3/constants.rb -o plugin/proGran3/constants.rbe
rubyencoder plugin/proGran3/logger.rb -o plugin/proGran3/logger.rbe
```

### **Метод 2: Автоматичне кодування всіх файлів**

**Створіть `encode_all.rb`:**

```ruby
require 'fileutils'

plugin_dir = 'plugin'
output_dir = 'plugin_encoded'

FileUtils.mkdir_p(output_dir)

Dir.glob("#{plugin_dir}/**/*.rb").each do |file|
  relative = file.sub("#{plugin_dir}/", '')
  output = File.join(output_dir, relative.sub('.rb', '.rbe'))
  
  FileUtils.mkdir_p(File.dirname(output))
  
  puts "Encoding #{file}..."
  system("rubyencoder #{file} -o #{output}")
end
```

**Запустити:**
```bash
ruby encode_all.rb
```

### **Метод 3: Збірка RBZ з закодованими файлами**

**Створіть `build_rbz_encoded.rb`:**

```ruby
# 1. Закодувати всі Ruby файли
system("ruby encode_all.rb")

# 2. Створити RBZ з .rbe файлами
require 'zip'

Zip::File.open('dist/proGran3_encoded.rbz', create: true) do |zip|
  Dir.glob('plugin_encoded/**/*').each do |file|
    next if File.directory?(file)
    
    zip_path = file.sub('plugin_encoded/', '')
    zip.add(zip_path, file)
  end
end

puts "✅ Encoded RBZ created: dist/proGran3_encoded.rbz"
```

---

## ⚙️ **RubyEncoder опції:**

### **Базове кодування:**
```bash
rubyencoder input.rb -o output.rbe
```

### **З захистом часу:**
```bash
# Expired після дати
rubyencoder input.rb -o output.rbe --expire-date 2026-12-31
```

### **З прив'язкою до комп'ютера:**
```bash
# Працює тільки на конкретній машині
rubyencoder input.rb -o output.rbe --bind-to-computer
```

### **З прив'язкою до MAC адреси:**
```bash
rubyencoder input.rb -o output.rbe --bind-to-mac AA:BB:CC:DD:EE:FF
```

### **З custom ліцензією:**
```bash
rubyencoder input.rb -o output.rbe --license-key YOUR_KEY
```

---

## 📝 **Приклад повного workflow:**

### **1. Підготовка:**

```bash
# Створити папку для закодованих файлів
mkdir plugin_encoded
```

### **2. Кодування:**

```bash
# Закодувати всі Ruby файли
ruby encode_all.rb
```

### **3. Оновлення require:**

**В loader замінити `.rb` на `.rbe`:**

```ruby
# Було:
require_relative 'proGran3_core.rb'

# Стало:
require_relative 'proGran3_core.rbe'
```

### **4. Збірка RBZ:**

```bash
ruby build_rbz_encoded.rb
```

### **5. Тестування:**

```bash
# Встановити в SketchUp
# Перевірити що працює
```

---

## 🔍 **Порівняння методів:**

| Метод | Захист | Швидкість | Ціна | Складність |
|-------|--------|-----------|------|------------|
| **Базова обфускація** | ⭐⭐ | ⚡⚡⚡ | Безкоштовно | Легка |
| **Покращена обфускація** | ⭐⭐⭐ | ⚡⚡ | Безкоштовно | Середня |
| **RubyEncoder** | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ | $99-999/рік | Складна |

---

## ⚠️ **ВАЖЛИВІ ПРИМІТКИ:**

### **1. SketchUp сумісність:**

RubyEncoder **підтримує SketchUp**, але потрібно:
- ✅ Використовувати правильну версію Ruby (3.2 для SU 2024)
- ✅ Тестувати на цільовій версії SketchUp
- ✅ Перевірити всі залежності

### **2. Loader файл:**

**Loader (`proGran3.rb`) НЕ має бути закодований!**

Extension Manager має змогу його прочитати для реєстрації.

### **3. Структура папок:**

Залишається така сама:
```
proGran3.rb          ← НЕ кодований (loader)
proGran3_core.rbe    ← Закодований
proGran3/
  ├── constants.rbe  ← Закодований
  ├── logger.rbe     ← Закодований
  └── ...
```

---

## 🎯 **Рекомендації:**

### **Для розробки:**
```bash
build_rbz.bat  # Звичайна збірка
```

### **Для тестування клієнтів:**
```bash
ruby build_rbz_advanced_obfuscation.rb  # Покращена обфускація
```

### **Для production продажу:**
```bash
ruby build_rbz_encoded.rb  # RubyEncoder (якщо куплено)
```

---

## 💡 **Альтернативи RubyEncoder:**

### **1. SketchUp RBS Compiler (офіційний)**
- Безкоштовний
- Тільки для SketchUp
- Обмежений функціонал

### **2. JRuby + ProGuard**
- Компіляція в Java bytecode
- Складна інтеграція зі SketchUp

### **3. Mruby**
- Embedded Ruby
- Потребує перепису коду

---

## 📞 **Підтримка:**

**RubyEncoder:**
- Email: support@rubyencoder.com
- Документація: https://www.rubyencoder.com/documentation.html

**ProGran3:**
- Email: support@progran3.com

---

## ✅ **Висновок:**

**Для максимального захисту:**

1. ✅ **Купити RubyEncoder** ($99/рік мінімум)
2. ✅ **Закодувати всі .rb → .rbe**
3. ✅ **Залишити loader незакодованим**
4. ✅ **Протестувати в SketchUp**
5. ✅ **Створити RBZ з .rbe файлами**

**Поки що використовуємо:**
```bash
ruby build_rbz_advanced_obfuscation.rb
```

Це дає **гарний рівень захисту** без додаткових витрат! 🔐

