@echo off
REM build_rbz.bat
REM Windows script для збірки плагіна ProGran3

echo ==========================================
echo   ProGran3 Plugin Builder
echo ==========================================
echo.

REM Перевіряємо наявність Ruby
where ruby >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Ruby не знайдено!
    echo Встановіть Ruby: https://rubyinstaller.org/
    pause
    exit /b 1
)

REM Перевіряємо наявність rubyzip gem
ruby -e "require 'zip'" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Встановлюємо rubyzip gem...
    gem install rubyzip
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Не вдалося встановити rubyzip!
        pause
        exit /b 1
    )
)

REM Запускаємо збірку
echo [INFO] Запуск збірки...
echo.
ruby build_rbz.rb

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo   SUCCESS! Plugin built successfully
    echo ==========================================
    echo.
    echo Open dist/ folder to find your .rbz file
    echo.
) else (
    echo.
    echo [ERROR] Build failed!
    echo.
)

pause

