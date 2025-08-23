@echo off
chcp 65001 >nul
echo ProGran3 - Checking SketchUp path
echo.

powershell -ExecutionPolicy Bypass -File "check_sketchup_path.ps1"

echo.
pause
