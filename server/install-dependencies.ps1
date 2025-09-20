# ProGran3 Tracking Server - Встановлення залежностей
# PowerShell скрипт для Windows

Write-Host "🔧 Встановлення залежностей для ProGran3 Tracking Server..." -ForegroundColor Green

# Перевіряємо чи встановлений Node.js
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js $nodeVersion знайдено" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js не знайдено. Будь ласка, встановіть Node.js 18+ спочатку." -ForegroundColor Red
    Write-Host "Завантажте з: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Перевіряємо версію Node.js
$versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($versionNumber -lt 18) {
    Write-Host "❌ Потрібна Node.js версія 18 або вище. Поточна версія: $nodeVersion" -ForegroundColor Red
    exit 1
}

# Встановлюємо залежності
Write-Host "📦 Встановлення npm пакетів..." -ForegroundColor Blue
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Залежності встановлено успішно!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Наступні кроки:" -ForegroundColor Cyan
    Write-Host "1. Скопіюйте env.example в .env.local:" -ForegroundColor White
    Write-Host "   Copy-Item env.example .env.local" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Налаштуйте змінні середовища в .env.local" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Запустіть сервер:" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🌐 Сервер буде доступний на http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "❌ Помилка встановлення залежностей" -ForegroundColor Red
    exit 1
}
