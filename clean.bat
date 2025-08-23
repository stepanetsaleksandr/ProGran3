@echo off
chcp 65001 >nul
echo ProGran3 - Clean and Deploy
echo.

if "%1"=="force" (
    echo Force cleaning and deploying...
    powershell -ExecutionPolicy Bypass -File "clean_and_deploy.ps1" -Force
) else (
    echo Checking for old versions...
    powershell -ExecutionPolicy Bypass -File "clean_and_deploy.ps1"
)

echo.
echo Done!
pause
