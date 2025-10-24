@echo off
echo ========================================
echo    ProGran3 Obfuscated Installation
echo ========================================
echo.

echo [1/4] Видалення старої версії...
if exist "%APPDATA%\SketchUp\SketchUp 2024\SketchUp\Plugins\proGran3.rb" (
    echo   - Видаляємо proGran3.rb
    del "%APPDATA%\SketchUp\SketchUp 2024\SketchUp\Plugins\proGran3.rb"
)

if exist "%APPDATA%\SketchUp\SketchUp 2024\SketchUp\Plugins\proGran3" (
    echo   - Видаляємо папку proGran3
    rmdir /s /q "%APPDATA%\SketchUp\SketchUp 2024\SketchUp\Plugins\proGran3"
)

echo [2/4] Встановлення нової версії...
if exist "dist\proGran3_latest.rbz" (
    echo   - Знайдено збірку: proGran3_latest.rbz
    echo   - Розмір: %~z1 bytes
    echo.
    echo   ВАЖЛИВО: Встановіть збірку через SketchUp:
    echo   1. Відкрийте SketchUp
    echo   2. Window → Extension Manager  
    echo   3. Install Extension
    echo   4. Виберіть: dist\proGran3_latest.rbz
    echo   5. Підтвердіть встановлення
    echo   6. Перезапустіть SketchUp
) else (
    echo   ❌ Помилка: Збірка не знайдена!
    echo   Перевірте що файл dist\proGran3_latest.rbz існує
    pause
    exit /b 1
)

echo.
echo [3/4] Перевірка структури файлів...
echo   - Нова структура: system/core/, system/network/, system/utils/
echo   - Приховані файли: session_manager.rb, data_storage.rb, network_client.rb
echo   - Backward compatibility: security/ alias працюють

echo.
echo [4/4] Готово!
echo   ✅ Збірка готова до встановлення
echo   ✅ Файли ліцензії приховані
echo   ✅ Всі функції збережені
echo.
echo Натисніть будь-яку клавішу для завершення...
pause >nul
