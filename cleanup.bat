@echo off
echo 🔧 Очищення проекту ProGran3...

echo.
echo 📁 Видалення зайвих файлів...

REM Видалення тестових файлів з активів
if exist "proGran3\assets\steles\stele_TEST.skp" del "proGran3\assets\steles\stele_TEST.skp"
if exist "proGran3\assets\steles\stele_TEST2.skp" del "proGran3\assets\steles\stele_TEST2.skp"
if exist "proGran3\assets\stands\stand_test.skp" del "proGran3\assets\stands\stand_test.skp"
if exist "proGran3\assets\flowerbeds\flowerbed_test.skp" del "proGran3\assets\flowerbeds\flowerbed_test.skp"

REM Видалення тимчасових файлів
if exist "*.tmp" del "*.tmp"
if exist "*.log" del "*.log"

echo.
echo ✅ Очищення завершено!
echo.
echo 📊 Статистика:
echo - Видалено тестові .skp файли
echo - Видалено тимчасові файли
echo - Проект готовий до використання
echo.
pause
