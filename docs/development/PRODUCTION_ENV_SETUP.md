# 🚀 Production Environment Variables Setup

## 📋 Environment Variables для Vercel Dashboard

Скопіюйте ці змінні в Vercel Dashboard → Settings → Environment Variables:

### **Обов'язкові змінні:**

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
CRYPTO_SECRET_KEY=your-very-secret-key-here-32-chars-minimum
NEXT_PUBLIC_API_URL=https://your-app.vercel.app/api
PROGRAN3_API_URL=https://your-app.vercel.app/api
PROGRAN3_API_KEY=your-api-key-here
```

### **Інструкції для налаштування:**

1. **Заходьте на Vercel Dashboard**
   - https://vercel.com/dashboard
   - Виберіть ваш проект ProGran3

2. **Додайте Environment Variables**
   - Settings → Environment Variables
   - Додайте кожну змінну з вище
   - Встановіть **Environment** як "Production"
   - Натисніть "Save"

3. **Отримайте ключі Supabase**
   - Зайдіть на https://supabase.com/dashboard
   - Виберіть ваш проект
   - Settings → API
   - Скопіюйте Project URL та ключі

4. **Згенеруйте безпечні ключі**
   ```bash
   # Для CRYPTO_SECRET_KEY (32 символи)
   openssl rand -hex 32
   
   # Для PROGRAN3_API_KEY (16 символів)
   openssl rand -hex 16
   ```

5. **Оновіть URL після деплою**
   - Після деплою отримайте URL з Vercel
   - Оновіть NEXT_PUBLIC_API_URL та PROGRAN3_API_URL

## 🔧 Перевірка після налаштування

Після встановлення всіх змінних:

1. **Redeploy проект**
2. **Перевірте API endpoints:**
   ```bash
   curl https://your-app.vercel.app/api/test-connection
   curl https://your-app.vercel.app/api/check-state
   ```

3. **Виконайте міграцію БД:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/final-migration
   ```

## ⚠️ Важливо

- **НІКОЛИ не публікуйте ці ключі**
- **Використовуйте різні ключі для development та production**
- **Регулярно оновлюйте ключі безпеки**
