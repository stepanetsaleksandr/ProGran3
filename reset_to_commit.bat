@echo off
echo Виконую reset до коміту c59d799ec91630726d324143d0d239e871c7ae46...
git reset --hard c59d799ec91630726d324143d0d239e871c7ae46
if %errorlevel% equ 0 (
    echo Reset виконано успішно!
    echo Поточний стан:
    git status
) else (
    echo Помилка при виконанні reset!
)
pause


