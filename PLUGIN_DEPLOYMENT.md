# 🚀 ProGran3 Plugin Deployment Guide

**Версія:** 3.2.1  
**Дата:** 23 жовтня 2025

---

## 📦 Збірка плагіна (.rbz)

### Звичайна збірка (Windows)

```bash
build_rbz.bat
```

### 🔐 Захищена збірка (обфусковано)

```bash
build_encrypted.bat
```

**Захист включає:**
- ✅ Видалення коментарів
- ✅ Мінімізація коду
- ✅ Видалення порожніх рядків
- ⚠️ Структура папок залишається (SketchUp вимога)

### Автоматична збірка (Linux/Mac)

```bash
chmod +x build_rbz.sh
./build_rbz.sh
```

### Ручна збірка

```bash
gem install rubyzip
ruby build_rbz.rb
```

---

## 📂 Структура збірки

```
dist/
├── proGran3_v3.2.1_20251023_205318.rbz  # Версія з timestamp
└── proGran3_latest.rbz                   # Завжди остання версія
```

**Розмір збірки:** ~8.67 MB

---

## 🎯 Деплой для користувачів

### Спосіб 1: Через Extension Manager (Рекомендований)

1. Відкрийте SketchUp
2. `Window → Extension Manager`
3. `Install Extension`
4. Виберіть `.rbz` файл
5. Підтвердіть встановлення
6. Перезапустіть SketchUp

### Спосіб 2: Ручне встановлення

1. Розпакуйте `.rbz` файл (це ZIP архів)
2. Скопіюйте файли в:
   ```
   %APPDATA%\SketchUp\SketchUp 2024\SketchUp\Plugins\
   ```
3. Перезапустіть SketchUp

---

## 🔄 CI/CD (GitHub Actions)

### Автоматична збірка при push

- **Гілки:** `main`, `dev`
- **Теги:** `v*` (наприклад, `v3.2.1`)

### Ручна збірка

1. Перейдіть до: `Actions → Build Plugin RBZ`
2. Натисніть `Run workflow`
3. Вкажіть версію (опціонально)
4. Натисніть `Run`

### Завантаження артефактів

1. Перейдіть до: `Actions → Build Plugin RBZ`
2. Виберіть успішний workflow
3. Завантажте `proGran3-plugin-*.zip`
4. Розпакуйте та використовуйте `.rbz` файл

---

## 📋 Версіонування

### Семантичне версіонування (SemVer)

```
MAJOR.MINOR.PATCH
3.2.1

MAJOR - Breaking changes
MINOR - New features (backwards compatible)
PATCH - Bug fixes
```

### Оновлення версії

**1. В `build_rbz.rb`:**
```ruby
VERSION = '3.2.1'
```

**2. В `plugin/proGran3/constants.rb`:**
```ruby
VERSION = "3.2.1"
```

**3. Commit та tag:**
```bash
git add .
git commit -m "chore: bump version to 3.2.1"
git tag v3.2.1
git push origin dev
git push origin v3.2.1
```

---

## 🌿 Git Workflow для деплою

### Development (dev гілка)

```bash
# Розробка в dev
git checkout dev
# ... робота ...
git add .
git commit -m "feat: new feature"
git push origin dev
```

**Результат:** Автоматична збірка dev версії

### Production (main гілка)

```bash
# Коли готові до production
git checkout main
git merge dev
git push origin main
```

**Результат:** Автоматична збірка production версії

### Release (з тегом)

```bash
# Створення релізу
git checkout main
# Оновіть версію в файлах
git add .
git commit -m "chore: bump version to 3.2.1"
git tag v3.2.1
git push origin main
git push origin v3.2.1
```

**Результат:** 
- Автоматична збірка
- GitHub Release з `.rbz` файлом

---

## 📊 Що включено в збірку

### ✅ Включено:

- `proGran3.rb` - головний файл
- `proGran3/` - всі модулі плагіна
- `config.json` - конфігурація
- Assets (моделі, іконки)
- Web UI (HTML, CSS, JS)
- Security модулі
- Builders

### ❌ Виключено:

- `.git/` - Git репозиторій
- `production_test.rb` - тести
- `TEST_*.rb` - тестові файли
- `backups/` - резервні копії
- `.log`, `.tmp` - тимчасові файли

---

## 🔐 Security в продакшн збірці

### Що включено:

- ✅ Hardware fingerprinting
- ✅ License validation
- ✅ AES-256 encryption
- ✅ HMAC signatures
- ✅ Retry logic
- ✅ Resource management

### API Configuration:

```json
{
  "api": {
    "base_url": "https://server-hbf7li0u7-provis3ds-projects.vercel.app",
    "timeout": 10,
    "retry_attempts": 3
  }
}
```

**Оновлення URL:** Після кожного deploy сервера оновіть `config.json`

---

## 📝 Changelog

### v3.2.1 (2025-10-23)

**Production Ready:**
- ✅ Memory cleanup механізми
- ✅ Error recovery з retry logic
- ✅ Resource management з timeout
- ✅ Performance monitoring
- ✅ Production тести пройдені

**Bug Fixes:**
- Fixed memory leaks in StateManager
- Fixed missing cleanup on reload
- Fixed SketchUp context issues

---

## 🧪 Тестування перед релізом

### Чек-лист:

- [ ] Build успішний без помилок
- [ ] Розмір файлу прийнятний (< 10 MB)
- [ ] API URL правильний в config.json
- [ ] Версія оновлена в усіх файлах
- [ ] Changelog оновлено
- [ ] Production тести пройдені
- [ ] Manual тест встановлення в SketchUp

### Тестування в SketchUp:

```bash
# 1. Встановіть плагін
# 2. Відкрийте SketchUp Ruby Console
# 3. Запустіть тести:
load 'C:/path/to/plugin/proGran3/production_test.rb'
ProGran3::ProductionTest.run_all_tests
```

---

## 📦 Розповсюдження

### Внутрішнє (для клієнтів):

1. Завантажте `.rbz` з GitHub Releases
2. Надішліть клієнту
3. Надайте інструкції з встановлення

### Публічне (опціонально):

- SketchUp Extension Warehouse
- GitHub Releases (public repo)
- Власний сайт з завантаженням

---

## 🆘 Troubleshooting

### "Extension failed to load"

**Причина:** Відсутні залежності або помилка в коді

**Рішення:**
1. Перевірте Ruby Console в SketchUp
2. Перевірте версію SketchUp (мін. 2020)
3. Перевірте права доступу до файлів

### "License validation failed"

**Причина:** Немає інтернету або API недоступний

**Рішення:**
1. Перевірте інтернет з'єднання
2. Перевірте API URL в config.json
3. Використайте grace period (1 день offline)

### "Plugin crashes on startup"

**Причина:** Конфлікт з іншими плагінами

**Рішення:**
1. Disable інші плагіни
2. Перевірте Ruby Console для stack trace
3. Перезапустіть SketchUp

---

## 📞 Підтримка

**Розробник:** ProVis3D  
**Email:** support@progran3.com  
**Документація:** `/DEVELOPER_GUIDE.md`

---

**✅ Плагін готовий до production deployment!** 🚀
