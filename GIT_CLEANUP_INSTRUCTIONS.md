# Інструкція: Видалення master гілки

## ✅ Що вже зроблено:

1. ✅ `main` оновлено всіма змінами з `dev`
2. ✅ `main` запушено на GitHub
3. ⚠️ `master` НЕ видалено (це default branch)

---

## 🎯 Що треба зробити (2 хвилини):

### Крок 1: Змінити default branch на GitHub

**Перейди на GitHub:**
1. Відкрий: https://github.com/stepanetsaleksandr/ProGran3
2. Натисни: **Settings** (права верхня панель)
3. В лівому меню: **Branches**
4. В секції **Default branch** натисни кнопку зі стрілками ↔️
5. Вибери: **main**
6. Натисни: **Update**
7. Підтверди: **I understand, update the default branch**

---

### Крок 2: Видалити master

**Після того як зміниш default на main:**

```bash
# Видалити remote master
git push origin --delete master

# Видалити локальний master (якщо є)
git branch -d master
```

---

### Крок 3: Перевірка

```bash
# Подивись на гілки
git branch -a

# Має бути:
#   * main
#     dev
#     stable-base
#   remotes/origin/main
#   remotes/origin/dev
#   remotes/origin/stable-base
# (немає master)
```

---

## 🔧 Vercel налаштування

**Після cleanup гілок:**

1. Зайди в Vercel: https://vercel.com
2. Вибери project: **server**
3. Settings → Git
4. **Production Branch:** встанови `main`
5. Save

---

## ✅ Готово!

Після цього:
- ✅ `main` - єдина production гілка
- ✅ `dev` - розробка
- ✅ Vercel deploy з `main`
- ✅ Чиста структура

---

**Зайшов тут?** Пиши, допоможу!


