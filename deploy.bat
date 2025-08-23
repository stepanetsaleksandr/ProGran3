@echo off
chcp 65001 >nul
echo 🚀 ProGran3 - Розгортання плагіна
echo.

if "%1"=="watch" (
    echo 👀 Запуск режиму спостереження...
    powershell -ExecutionPolicy Bypass -File "deploy_to_sketchup.ps1" -Watch
) else (
    echo 📦 Розгортання плагіна...
    powershell -ExecutionPolicy Bypass -File "deploy_to_sketchup.ps1"
)

echo.
echo ✅ Готово!
pause
