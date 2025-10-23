# Перевірка Vercel налаштувань

## 🎯 Що перевірити:

### 1. Production Branch може бути вже налаштовано

**Як перевірити:**
1. Vercel → Project "server"
2. Settings → найди розділ який містить слова:
   - "Git"
   - "Repository" 
   - "Branch"
   - "Production"

**Можливі місця:**
- Settings → Git
- Settings → General → Git Configuration
- Project Settings → Git Repository

---

### 2. Альтернативний спосіб (якщо не знайдеш)

**Vercel автоматично визначає production branch з GitHub!**

Якщо на GitHub default branch = `main`, то Vercel теж використає `main`.

**Перевірка:**
- На GitHub: https://github.com/stepanetsaleksandr/ProGran3
- Зверху має бути написано: `main` branch

Якщо так - **все вже в порядку!** Vercel автоматично deploy з `main`.

---

### 3. Як це перевірити (працює чи ні):

**Тестовий deploy:**
```bash
# В main гілці
git checkout main

# Невеликі зміни
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "test: vercel deploy check"
git push origin main

# Vercel має автоматично почати deploy
```

**Перейди на Vercel:**
- Має з'явитись новий deployment
- З гілки `main`
- Статус: Building / Ready

---

### 4. Що показує твій Vercel?

**Коли відкриваєш Project "server", що бачиш?**

Скопіюй назви табів/секцій які є в Settings:
- [ ] General
- [ ] Domains
- [ ] Git
- [ ] Environment Variables
- [ ] Functions
- [ ] ...інші?

**Напиши які секції бачиш - допоможу знайти!**

---

## ✅ Швидка перевірка (можливо вже працює):

### На Vercel перейди на головну проекту "server":

Зверху має бути:
```
Latest Deployment
[Картинка preview]
Branch: ??? ← Яка гілка тут?
```

**Якщо написано `main` - все ОК!** ✅

**Якщо `master` або інше - треба змінити.**

---

## 📸 Допоможи мені допомогти тобі:

**Що ти бачиш:**
1. Які табі/секції в Settings?
2. В Latest Deployment яка Branch?
3. Чи є якісь згадки про "git" або "branch"?

**Напиши - знайдемо разом!** 🔍


