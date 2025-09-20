@echo off
chcp 65001 >nul
echo ProGran3 - Simple Deployment
echo.

if "%1"=="watch" (
    echo Watch mode enabled...
    powershell -ExecutionPolicy Bypass -File "deploy.ps1" -Watch
) else (
    echo Deploying plugin...
    powershell -ExecutionPolicy Bypass -File "deploy.ps1"
)

echo.
echo Done!
pause
