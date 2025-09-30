@echo off
echo ========================================
echo ProGran3 - Очищення ліцензії
echo ========================================
echo.

echo Очищення реєстру Windows...
reg delete "HKEY_CURRENT_USER\Software\ProGran3" /f >nul 2>&1

if %errorlevel% equ 0 (
    echo ✅ Реєстр очищено успішно
) else (
    echo ℹ️ Реєстр вже очищений або не існував
)

echo.
echo ========================================
echo Очищення завершено!
echo.
echo Тепер:
echo 1. Перезапустіть SketchUp
echo 2. Відкрийте ProGran3
echo 3. Активуйте ліцензію знову
echo ========================================
echo.
pause


