# 📦 Dynamic Modules для ProGran3

Динамічно завантажувані модулі для плагіна.

---

## 🚀 SETUP

### 1. Створити таблиці в Supabase:

```sql
-- Виконати в Supabase SQL Editor:
-- Файл: server/supabase_modules_schema.sql
```

### 2. Завантажити модуль в БД:

```bash
cd server
npm install
node scripts/upload-module.js
```

---

## 📋 МОДУЛІ:

### `report-generator.js`
- Генерація HTML звітів
- 826 рядків коду
- Cache TTL: 24 години
- Min plugin version: 3.2.0

---

## 🔄 ОНОВЛЕННЯ МОДУЛЯ:

1. Відредагувати `server/modules/report-generator.js`
2. Запустити: `node scripts/upload-module.js`
3. Клієнти отримають оновлення через 24 години (або при force reload)

---

## ✅ ГОТОВО!

