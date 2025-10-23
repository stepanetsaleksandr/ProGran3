# Git і Vercel - Поточний статус

**Дата перевірки:** 22 жовтня 2025

---

## ✅ Що в порядку

### Git:
- ✅ Зміни закомічені в `dev`
- ✅ Push на GitHub успішний
- ✅ Робоча копія чиста

### Vercel:
- ✅ Project налаштований: `server`
- ✅ `.env.local` присутній
- ✅ `vercel.json` правильний
- ✅ Build працює

---

## ⚠️ Що потребує уваги

### 1. Дублювання гілок master/main

**Проблема:**
```
Remote GitHub має:
  - master (основна на GitHub)
  - main (дублікат)
```

**Рекомендація:** Обрати одну основну гілку

**Варіант A: Залишити `main`, видалити `master` (РЕКОМЕНДОВАНО)**
```bash
# 1. Переконатись що на GitHub default = main
# GitHub → Settings → Branches → Default branch → main

# 2. Видалити локальну master (якщо є)
git branch -d master

# 3. Видалити remote master
git push origin --delete master
```

**Варіант B: Залишити `master`, видалити `main`**
```bash
# 1. Переконатись що на GitHub default = master
# GitHub → Settings → Branches → Default branch → master

# 2. Видалити локальну main
git branch -d main

# 3. Видалити remote main
git push origin --delete main
```

---

### 2. Рекомендована структура гілок

**Після cleanup:**
```
main (або master) - production
  └─ dev - активна розробка
      └─ feature/* - нові features
```

**Гілки для видалення (опціонально):**
- `stable-base` - не використовується?

```bash
# Якщо не потрібна:
git branch -d stable-base
git push origin --delete stable-base
```

---

## 🚀 Vercel налаштування

### Поточна конфігурація:
```json
{
  "projectId": "prj_FBg2s6z07kwJMhJ5u2SfvJW3bD3r",
  "orgId": "team_xl7fD6u23GKQEIHF0a7zQlS9",
  "projectName": "server"
}
```

### Рекомендації:

**1. Production Branch**
```
Vercel → Settings → Git → Production Branch
Встановити: main (або master)
```

**2. Environment Variables** ✅
```
Повинні бути встановлені:
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
✅ API_KEYS
✅ NEXT_PUBLIC_ADMIN_API_KEY
⚠️ HMAC_SECRET_KEY (опціонально)
⚠️ UPSTASH_REDIS_REST_URL (опціонально)
⚠️ UPSTASH_REDIS_REST_TOKEN (опціонально)
```

**3. Deploy Protection**
```
Vercel → Settings → Deployment Protection
Рекомендація: OFF (плагін не може пройти SSO)

АБО налаштувати Bypass:
- Protection Bypass для шляхів /api/*
```

**4. Custom Domain (опціонально)**
```
Для stable URL без змін при кожному deploy:

Vercel → Settings → Domains → Add Domain
Наприклад: progran3-api.yourdomain.com

Переваги:
✅ URL ніколи не міняється
✅ Не треба оновлювати config
✅ Професійно виглядає
```

---

## 📋 Workflow після cleanup

### Deploy процес:

**1. Розробка:**
```bash
git checkout dev
git pull origin dev

# Робота над кодом...

git add .
git commit -m "feat: опис змін"
git push origin dev
```

**2. Deploy в production:**
```bash
# Варіант A: Автоматичний (з GitHub Actions)
git checkout main
git merge dev
git push origin main
# → GitHub Actions автоматично deploy на Vercel

# Варіант B: Мануальний
deploy_smart.bat
```

**3. Plugin update:**
```bash
cd plugin
deploy_simple.bat
# Перезапусти SketchUp
```

---

## 🔧 Action Items

### HIGH Priority:

1. **Обрати основну гілку**
   - [ ] Вирішити: `main` чи `master`
   - [ ] Встановити default на GitHub
   - [ ] Видалити дублікат

2. **Vercel Production Branch**
   - [ ] Встановити Production Branch = обрана гілка
   - [ ] Перевірити Environment Variables

### MEDIUM Priority:

3. **Cleanup гілок**
   - [ ] Перевірити чи потрібна `stable-base`
   - [ ] Видалити якщо не використовується

4. **GitHub Actions**
   - [ ] Додати Vercel secrets в GitHub
   - [ ] Протестувати автоматичний deploy

### LOW Priority (опціонально):

5. **Custom Domain**
   - [ ] Купити/налаштувати домен
   - [ ] Прив'язати до Vercel
   - [ ] Оновити config

6. **Branch Protection**
   - [ ] Налаштувати правила для `main`
   - [ ] Require PR reviews
   - [ ] Заборонити force push

---

## ✅ Checklist для порядку

**Git:**
- [x] Зміни закомічені
- [x] Push на GitHub
- [ ] Cleanup дублюючих гілок
- [ ] Встановити default branch
- [ ] Видалити unused гілки

**Vercel:**
- [x] Project налаштований
- [x] Build працює
- [ ] Production branch встановлено
- [ ] Env vars перевірено
- [ ] Deploy protection налаштовано
- [ ] (Optional) Custom domain

**Workflow:**
- [x] Deploy скрипти готові
- [x] Git workflow documented
- [ ] GitHub Actions налаштовано
- [ ] Team знає процес

---

## 🎯 Рекомендації

### Мінімум для "в порядку":
1. Видалити дублікат `master`/`main` ✅
2. Встановити Production Branch в Vercel ✅
3. Перевірити Environment Variables ✅

### Для "професійно":
+ Налаштувати GitHub Actions
+ Custom domain
+ Branch protection rules

---

**Створено:** 22 жовтня 2025  
**Статус:** Потребує cleanup гілок  
**Пріоритет:** MEDIUM (не критично, але краще зробити)


