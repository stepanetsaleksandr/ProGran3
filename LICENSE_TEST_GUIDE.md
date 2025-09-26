# 🧪 Тестування Ліцензійної Системи ProGran3

## 📋 Доступні Тестові Ліцензії

### 1. **Trial Ліцензія (30 днів)**
- **Ключ:** `TQ58-IKVR-9X2M-7N4P`
- **Email:** `test@progran3.com`
- **Тип:** Trial
- **Термін:** 30 днів

### 2. **Demo Ліцензія (7 днів)**
- **Ключ:** `DEMO-1234-5678-9ABC`
- **Email:** `demo@progran3.com`
- **Тип:** Demo
- **Термін:** 7 днів

### 3. **Full Ліцензія (365 днів)**
- **Ключ:** `FULL-ABCD-EFGH-IJKL`
- **Email:** `full@progran3.com`
- **Тип:** Full
- **Термін:** 365 днів

## 🔧 Як Протестувати

### Крок 1: Відкрийте UI
```ruby
ProGran3::UI.show_dialog
```

### Крок 2: Перевірте Footer
- Подивіться внизу екрану
- Має показувати: "Ліцензія: Не активована"

### Крок 3: Активація Ліцензії
1. Введіть email: `test@progran3.com`
2. Введіть ключ: `TQ58-IKVR-9X2M-7N4P`
3. Натисніть "Активувати ліцензію"

### Крок 4: Перевірте Результат
- Footer має показувати: "Ліцензія: test@progran3.com"
- Ключ має показувати: "TQ58-IKVR..."

## 🐛 Налагодження

### Перевірка Статусу
```ruby
ProGran3.has_license?
ProGran3.license_info
```

### Перевірка Сервера
```bash
curl https://progran3-tracking-server-84mng0cwn-provis3ds-projects.vercel.app/api/init
```

## ✅ Очікуваний Результат

**До активації:**
- Footer: "Ліцензія: Не активована"

**Після активації:**
- Footer: "Ліцензія: test@progran3.com TQ58-IKVR..."

## 🔄 Скидання Ліцензії

```ruby
ProGran3.clear_license
```

## 📊 Статус Відстеження

```ruby
ProGran3.tracking_status
```
