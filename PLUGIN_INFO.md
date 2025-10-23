# 📦 ProGran3 Plugin Information

---

## 🏷️ **НАЗВА ПЛАГІНА В SKETCHUP**

### **Extension Manager:**
```
ProGran3 Конструктор
```

### **Меню Plugins:**
```
proGran3 Конструктор
```

### **Toolbar:**
```
ProGran3
```

---

## 📋 **ІНФОРМАЦІЯ ПРО EXTENSION**

| Параметр | Значення |
|----------|----------|
| **Назва** | ProGran3 Конструктор |
| **Версія** | 3.2.1 |
| **Автор** | ProVis3D |
| **Опис** | Професійний конструктор для створення пам'ятників, стел, огорож та благоустрою |
| **Copyright** | 2025 © ProVis3D. Всі права захищені. |
| **Розмір** | 8.67 MB |
| **Мін. SketchUp** | 2020 |

---

## 🎯 **ЯК ВИГЛЯДАЄ В SKETCHUP**

### 1. Extension Manager (Window → Extension Manager)

```
┌─────────────────────────────────────────┐
│ Extension Manager                       │
├─────────────────────────────────────────┤
│                                         │
│ ✅ ProGran3 Конструктор                 │
│    Version: 3.2.1                       │
│    by ProVis3D                          │
│                                         │
│    Професійний конструктор для          │
│    створення пам'ятників, стел,         │
│    огорож та благоустрою                │
│                                         │
│    [Enable] [Disable] [Uninstall]       │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Plugins Menu

```
┌─────────────────────────────┐
│ Plugins                     │
├─────────────────────────────┤
│ proGran3 Конструктор        │
│ ...                         │
└─────────────────────────────┘
```

### 3. Toolbar

```
┌──────────────────┐
│ ProGran3         │
│ [🔧] ProGran3    │
│      Конструктор │
└──────────────────┘
```

---

## 📂 **СТРУКТУРА ВСТАНОВЛЕННЯ**

Після встановлення в SketchUp Plugins папці:

```
Plugins/
├── proGran3.rb                    # Loader (extension registration)
├── proGran3/
│   ├── proGran3_core.rb          # Main plugin file
│   ├── assets/                   # Models, icons
│   ├── web/                      # UI files
│   ├── security/                 # License management
│   ├── builders/                 # Component builders
│   └── ...                       # Other modules
└── config.json                   # API configuration
```

---

## 🔧 **ФАЙЛИ EXTENSION**

### Loader файл (`proGran3.rb`):
```ruby
# proGran3_loader.rb
# Extension loader для SketchUp Extension Manager

require 'sketchup.rb'
require 'extensions.rb'

module ProGran3Extension
  
  EXTENSION_NAME = "ProGran3 Конструктор"
  EXTENSION_VERSION = "3.2.1"
  EXTENSION_CREATOR = "ProVis3D"
  EXTENSION_DESCRIPTION = "Професійний конструктор для створення пам'ятників, стел, огорож та благоустрою"
  EXTENSION_COPYRIGHT = "2025 © ProVis3D. Всі права захищені."
  
  loader = File.join(File.dirname(__FILE__), 'proGran3', 'proGran3_core.rb')
  extension = SketchupExtension.new(EXTENSION_NAME, loader)
  
  extension.version = EXTENSION_VERSION
  extension.creator = EXTENSION_CREATOR
  extension.description = EXTENSION_DESCRIPTION
  extension.copyright = EXTENSION_COPYRIGHT
  
  Sketchup.register_extension(extension, true)
  
end
```

---

## 🌍 **ЛОКАЛІЗАЦІЯ**

| Мова | Назва |
|------|-------|
| 🇺🇦 Українська | ProGran3 Конструктор |
| 🇬🇧 English | ProGran3 Constructor |
| 🇷🇺 Русский | ProGran3 Конструктор |

**Поточна мова:** 🇺🇦 Українська

---

## 🎨 **ІКОНКИ**

- **24x24px** - Toolbar малий
- **32x32px** - Toolbar великий
- **128x128px** - Extension Manager

**Шлях:** `proGran3/icons/icon_24.png`

---

## 📝 **ЗМІНА НАЗВИ**

Якщо потрібно змінити назву плагіна:

### 1. Відредагуйте `plugin/proGran3_loader.rb`:
```ruby
EXTENSION_NAME = "Нова Назва"
```

### 2. Відредагуйте `plugin/proGran3.rb`:
```ruby
::UI.menu("Plugins").add_item("Нова Назва") { ... }
toolbar = ::UI::Toolbar.new("Нова Назва")
```

### 3. Перезберіть плагін:
```bash
ruby build_rbz.rb
```

---

## ✅ **CURRENT STATUS**

✅ Extension правильно зареєстровано  
✅ Назва відображається в Extension Manager  
✅ Меню та toolbar працюють  
✅ RBZ файл готовий до розповсюдження

---

**Файл:** `dist/proGran3_latest.rbz` (8.67 MB)  
**Назва при встановленні:** **ProGran3 Конструктор**  
**Версія:** 3.2.1

