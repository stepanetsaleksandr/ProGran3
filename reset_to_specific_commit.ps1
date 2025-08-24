Write-Host "Виконую reset до коміту c59d799ec91630726d324143d0d239e871c7ae46..." -ForegroundColor Yellow
git reset --hard c59d799ec91630726d324143d0d239e871c7ae46 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Reset виконано успішно!" -ForegroundColor Green
    Write-Host "Поточний стан:" -ForegroundColor Cyan
    git status
} else {
    Write-Host "Помилка при виконанні reset!" -ForegroundColor Red
}

