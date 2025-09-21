# 🚀 Deployment Checklist

## ⚠️ ВАЖЛИВО: Після кожного деплою сервера

### 1. 🔗 Перевірити новий URL
```bash
vercel ls
```
Знайти останній деплой та скопіювати новий URL.

### 2. 📝 Оновити URL в плагіні
Файл: `plugin/proGran3.rb`
```ruby
# Рядок 14 - оновити URL
@base_url = base_url || ENV['PROGRAN3_TRACKING_URL'] || 'НОВИЙ_URL_ТУТ'
```

### 3. ✅ Перевірити роботу
1. Перезавантажити плагін в SketchUp
2. Перевірити heartbeat логи
3. Протестувати блокування в dashboard

### 4. 🧪 Тестовий скрипт
```javascript
// test-server.js
const newUrl = 'НОВИЙ_URL_ТУТ';
// ... тест heartbeat
```

---

## 📋 Поточний статус

**Останній деплой:** `https://progran3-tracking-server-2fojxdkzj-provis3ds-projects.vercel.app`

**URL в плагіні:** ✅ Оновлено

**Статус:** 🟢 Готово до тестування

---

## 🔍 Як знайти новий URL

1. Запустити `vercel ls`
2. Знайти найновіший деплой (Age: 0-5m)
3. Скопіювати URL з колонки "Deployment"
4. Оновити в `plugin/proGran3.rb` рядок 14

---

## ⚡ Швидка перевірка

```bash
# Перевірити деплої
vercel ls

# Оновити URL в плагіні
# Файл: plugin/proGran3.rb, рядок 14

# Перезавантажити плагін в SketchUp
# Перевірити логи heartbeat
```

---

**💡 Пам'ятайте:** Vercel створює новий URL для кожного деплою!
