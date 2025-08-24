Write-Host "Скидаю git налаштування..." -ForegroundColor Yellow

# Скидаємо pager налаштування
git config --global --unset core.pager
git config --global core.pager cat

# Скидаємо інші проблемні налаштування
git config --global --unset core.editor
git config --global --unset init.defaultBranch

# Перевіряємо версію git
Write-Host "Версія Git:" -ForegroundColor Cyan
git --version

# Перевіряємо поточний стан репозиторію
Write-Host "Поточний стан репозиторію:" -ForegroundColor Cyan
git status

Write-Host "Git налаштування скинуто!" -ForegroundColor Green

