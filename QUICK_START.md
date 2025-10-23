# ⚡ ProGran3 Quick Start Guide

**Версія:** 3.2.1  
**Дата:** 23 жовтня 2025

---

## 🚀 Швидкий старт

### 1️⃣ Збірка плагіна

**Windows:**
```bash
build_rbz.bat
```

**Linux/Mac:**
```bash
chmod +x build_rbz.sh
./build_rbz.sh
```

**Результат:** `dist/proGran3_latest.rbz` (~8.67 MB)

---

### 2️⃣ Деплой сервера

**Перший раз:**
```bash
cd server
npm install
vercel --prod
```

**Наступні рази:**
```bash
cd server
vercel --prod
```

**Або через GitHub:**
```bash
git checkout main
git merge dev
git push origin main
```
→ Vercel автоматично задеплоїть

---

### 3️⃣ Оновлення API URL в плагіні

**Після кожного deploy сервера:**

1. Скопіюйте новий URL з Vercel
2. Відредагуйте `plugin/config.json`:
   ```json
   {
     "api": {
       "base_url": "https://your-new-url.vercel.app"
     }
   }
   ```
3. Перезберіть плагін: `build_rbz.bat`

**Або автоматично:**
```bash
deploy_smart.bat
```

---

### 4️⃣ Встановлення плагіна

1. Відкрийте SketchUp
2. `Window → Extension Manager`
3. `Install Extension`
4. Виберіть `dist/proGran3_latest.rbz`
5. Перезапустіть SketchUp

---

## 🌿 Git Workflow

### Розробка (dev)

```bash
git checkout dev
# ... робота ...
git add .
git commit -m "feat: new feature"
git push origin dev
```

### Production (main)

```bash
git checkout main
git merge dev
git push origin main
```

### Release

```bash
git checkout main
# Оновіть версію в build_rbz.rb та constants.rb
git add .
git commit -m "chore: bump version to 3.2.2"
git tag v3.2.2
git push origin main
git push origin v3.2.2
```

---

## 📦 Що де знаходиться

```
ProGran3/
├── plugin/              # 🔌 Плагін для SketchUp
│   ├── proGran3.rb     # Головний файл
│   ├── proGran3/       # Модулі
│   └── config.json     # API конфігурація
│
├── server/              # 🌐 Next.js сервер
│   ├── app/            # Next.js App Router
│   ├── lib/            # Utilities
│   └── package.json    # Dependencies
│
├── dist/               # 📦 Збірки плагіна (.rbz)
│
├── build_rbz.rb        # 🏗️ Збірка плагіна
├── build_rbz.bat       # Windows script
├── build_rbz.sh        # Linux/Mac script
│
└── deploy_smart.bat    # 🚀 Smart deploy (server + plugin)
```

---

## 🎯 Основні команди

### Плагін

```bash
# Збірка
build_rbz.bat

# Тестування
cd plugin/proGran3
ruby production_test.rb
```

### Сервер

```bash
# Local dev
cd server
npm run dev

# Production deploy
cd server
vercel --prod

# Build test
cd server
npm run build
```

### Smart Deploy (все разом)

```bash
# Деплой сервера + оновлення плагіна
deploy_smart.bat
```

---

## 🔐 Production Checklist

### Перед релізом:

- [ ] Тести пройдені (`ruby production_test.rb`)
- [ ] Версія оновлена в `build_rbz.rb`
- [ ] Версія оновлена в `plugin/proGran3/constants.rb`
- [ ] Changelog оновлено
- [ ] API URL правильний в `plugin/config.json`
- [ ] Сервер задеплоєно на Vercel
- [ ] Плагін зібрано (`build_rbz.bat`)
- [ ] Manual тест в SketchUp

### Після релізу:

- [ ] GitHub Release створено
- [ ] Клієнти отримали `.rbz` файл
- [ ] Документація оновлена

---

## 🆘 Troubleshooting

### "Build failed"

```bash
gem install rubyzip
ruby build_rbz.rb
```

### "API не відповідає"

1. Перевірте `plugin/config.json` → `api.base_url`
2. Перевірте Vercel Dashboard
3. Перевірте інтернет з'єднання

### "Extension не завантажується"

1. Перевірте Ruby Console в SketchUp
2. Перевірте версію SketchUp (мін. 2020)
3. Видаліть і перевстановіть плагін

---

## 📖 Детальна документація

- **Plugin Deployment:** `PLUGIN_DEPLOYMENT.md`
- **Production Analysis:** `PLUGIN_PRODUCTION_ANALYSIS.md`
- **Developer Guide:** `DEVELOPER_GUIDE.md`
- **Git Workflow:** `GIT_WORKFLOW.md`

---

## 🎯 Поточний статус

**Плагін:** ✅ Production Ready (9.5/10)
- ✅ Memory cleanup
- ✅ Error recovery
- ✅ Resource management
- ✅ Production tests passed

**Сервер:** ✅ Production Ready
- ✅ Vercel auto-deploy from `main`
- ✅ Environment variables configured
- ✅ API working

**Deployment:** ✅ Automated
- ✅ RBZ build system
- ✅ GitHub Actions
- ✅ Smart deploy script

---

**🚀 Все готово до production!**
