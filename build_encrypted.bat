@echo off
REM build_encrypted.bat - Збірка захищеного плагіна

echo ==========================================
echo   ProGran3 Encrypted Build
echo ==========================================
echo.

ruby build_rbz_encrypted.rb

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo   SUCCESS! Encrypted plugin ready
    echo ==========================================
    echo.
    echo File: dist\proGran3_encrypted_latest.rbz
    echo.
) else (
    echo.
    echo [ERROR] Build failed!
    echo.
)

pause

