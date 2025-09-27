@echo off
echo ========================================
echo    ProGran3 Server Deploy Script
echo ========================================
echo.

echo [1/4] Перевірка Vercel CLI...
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI не встановлено!
    echo Встановіть: npm install -g vercel
    pause
    exit /b 1
)
echo ✅ Vercel CLI знайдено

echo.
echo [2/4] Деплой на production...
vercel --prod
if %errorlevel% neq 0 (
    echo ❌ Помилка деплою!
    pause
    exit /b 1
)

echo.
echo [3/4] Отримання URL...
echo ✅ Деплой завершено!
echo.
echo 📋 Наступні кроки:
echo 1. Скопіюйте новий URL з виводу вище
echo 2. Оновіть посилання в плагіні:
echo    - plugin/proGran3/security/license_manager.rb
echo    - plugin/proGran3/callback_manager.rb
echo 3. Запустіть deploy_simple.bat для плагіна
echo.

echo [4/4] Показ поточних деплоїв...
vercel ls

echo.
echo ========================================
echo    Деплой сервера завершено!
echo ========================================
echo.
echo 🔧 Для автоматичного оновлення посилань:
echo node update-plugin-links.js <новый_url>
echo.
echo 📋 Або оновіть вручну:
echo 1. plugin/proGran3/security/license_manager.rb
echo 2. plugin/proGran3/callback_manager.rb
echo.
pause