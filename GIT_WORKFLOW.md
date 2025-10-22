# Git Workflow для ProGran3

## 📋 Поточний стан

**Гілки:**
- `master` (на GitHub) - основна
- `main` - дублікат
- `dev` - розробка
- `stable-base` - stable база

**Проблема:** Дублювання `master` ↔ `main`

---

## 🎯 Рекомендована структура

```
main (production)
  ├─ dev (розробка)
  │   └─ feature/* (нові features)
  │
  └─ hotfix/* (екстрені виправлення)
```

**Чому саме так:**
- `main` - стандарт GitHub (з 2020)
- `dev` - активна розробка
- `feature/*` - окремі features
- `hotfix/*` - швидкі fixes для production

---

## 🔄 Workflow

### 1. Розробка нової функції:

```bash
# 1. Створити feature branch від dev
git checkout dev
git pull origin dev
git checkout -b feature/my-feature

# 2. Робота над feature
git add .
git commit -m "feat: add my feature"

# 3. Push і створити PR
git push origin feature/my-feature
# Create PR: feature/my-feature → dev
```

### 2. Merge в dev:

```bash
# После review
git checkout dev
git merge feature/my-feature
git push origin dev
```

### 3. Deploy в production:

```bash
# Після тестування в dev
git checkout main
git merge dev
git push origin main

# Автоматичний deploy через GitHub Actions
# АБО мануальний: ./deploy_smart.bat
```

---

## 🧹 Очистка дублюючих гілок

### Варіант 1: Видалити `main`, залишити `master`

```bash
# Локально
git branch -d main

# Віддалено
git push origin --delete main

# Оновити default branch на GitHub:
# Settings → Branches → Default branch → master
```

### Варіант 2: Видалити `master`, залишити `main` (РЕКОМЕНДОВАНО)

```bash
# 1. Перейменувати master → main локально
git checkout master
git branch -m main

# 2. Push як main
git push origin main

# 3. Оновити default на GitHub
# Settings → Branches → Default branch → main

# 4. Видалити старий master
git push origin --delete master

# 5. Оновити upstream
git branch --set-upstream-to=origin/main main
```

### Варіант 3: Об'єднати гілки

```bash
# Якщо є різниця між master і main
git checkout main
git merge master
git push origin main
git push origin --delete master
```

---

## 🚀 Deploy процес

### Автоматичний (GitHub Actions):

```yaml
# .github/workflows/deploy.yml
# Deploy при push в main
```

**Налаштування:**
1. GitHub → Settings → Secrets
2. Додати:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

### Мануальний:

```bash
# Windows
deploy_smart.bat

# Linux/Mac
./deploy_smart.sh
```

**Переваги smart deploy:**
- ✅ Build test перед deploy
- ✅ Автоматичне оновлення config.json
- ✅ Backup старого URL
- ✅ Post-deploy інструкції

---

## 📝 Commit стандарти

**Semantic Commits:**

```bash
feat: нова функція
fix: виправлення бага
docs: документація
style: форматування (без змін логіки)
refactor: рефакторинг
test: тести
chore: рутинні task (deploy, config)
```

**Приклади:**

```bash
git commit -m "feat: add user dashboard"
git commit -m "fix: license activation timeout"
git commit -m "docs: update API documentation"
git commit -m "chore: update API URL after deploy"
```

---

## 🔐 Захист гілок

**Налаштування на GitHub:**

### main (production):
- ✅ Require pull request reviews (1 reviewer)
- ✅ Require status checks to pass (build test)
- ✅ Include administrators
- ❌ Allow force pushes (ЗАБОРОНЕНО)

### dev (розробка):
- ✅ Require pull request reviews (1 reviewer)
- ⚠️ Allow force pushes (тільки для maintainers)

---

## 🎯 Best Practices

1. **Завжди працювати з feature branches**
   ```bash
   # НЕ робити
   git checkout dev
   git commit ...  # ❌
   
   # Робити
   git checkout -b feature/my-feature
   git commit ...  # ✅
   ```

2. **Pull перед push**
   ```bash
   git pull origin dev
   git push origin dev
   ```

3. **Регулярні commits**
   ```bash
   # Кожні 1-2 години
   git add .
   git commit -m "feat: progress on feature X"
   ```

4. **Тестувати перед merge**
   ```bash
   npm run build  # Server
   # Test в SketchUp (Plugin)
   ```

5. **Cleanup після merge**
   ```bash
   # Видалити локальну feature branch
   git branch -d feature/my-feature
   
   # Видалити віддалену
   git push origin --delete feature/my-feature
   ```

---

## 🆘 Troubleshooting

### "Diverged branches"

```bash
# Якщо local і remote розійшлись
git fetch origin
git merge origin/dev
# Resolve conflicts
git push origin dev
```

### "Merge conflict"

```bash
# 1. Відкрити конфліктні файли
# 2. Знайти <<<<<<< HEAD
# 3. Вирішити вручну
# 4. 
git add .
git commit -m "fix: resolve merge conflict"
```

### "Force push needed"

```bash
# ТІЛЬКИ для feature branches!
git push origin feature/my-feature --force

# НІКОЛИ для main/dev без дозволу!
```

---

## 📊 Git команди (quick reference)

```bash
# Статус
git status
git log --oneline -10

# Гілки
git branch -a                    # Всі гілки
git checkout -b feature/name     # Нова гілка
git branch -d feature/name       # Видалити локальну
git push origin --delete name    # Видалити remote

# Sync
git fetch origin                 # Оновити remote info
git pull origin dev              # Pull з dev
git push origin dev              # Push в dev

# Stash (тимчасове збереження)
git stash                        # Зберегти зміни
git stash pop                    # Відновити зміни
git stash list                   # Список stash

# Скасування
git reset --hard HEAD            # Скасувати всі зміни
git checkout -- file.txt         # Скасувати зміни файлу
git revert <commit-hash>         # Скасувати commit
```

---

## 🎓 Навчальні ресурси

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Created:** 2025
**Maintainer:** ProGran3 Team  
**Status:** ✅ Рекомендований workflow

