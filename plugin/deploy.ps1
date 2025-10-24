# deploy.ps1
# Простий скрипт деплою для ProGran3

param(
    [string]$SketchUpVersion = "2024"
)

# Завантажуємо конфігурацію
$configPath = "config.json"
if (Test-Path $configPath) {
    $config = Get-Content $configPath | ConvertFrom-Json
    $defaultVersion = $config.default_version
    if (-not $SketchUpVersion -or $SketchUpVersion -eq "2024") {
        $SketchUpVersion = $defaultVersion
    }
} else {
    Write-Host "Config file not found!" -ForegroundColor Red
    exit 1
}

# Отримуємо шлях до плагінів SketchUp
$SKETCHUP_PLUGINS_PATH = $config.sketchup_versions.$SketchUpVersion
if ($SKETCHUP_PLUGINS_PATH -like "*%APPDATA%*") {
    $SKETCHUP_PLUGINS_PATH = $SKETCHUP_PLUGINS_PATH -replace "%APPDATA%", $env:APPDATA
}

# Поточний шлях проекту
$CURRENT_PROJECT_PATH = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Deploying ProGran3 plugin..." -ForegroundColor Green

# Перевіряємо чи існує папка плагінів
if (-not (Test-Path $SKETCHUP_PLUGINS_PATH)) {
    Write-Host "SketchUp plugins folder not found: $SKETCHUP_PLUGINS_PATH" -ForegroundColor Red
    Write-Host "Please check your SketchUp installation." -ForegroundColor Yellow
    exit 1
}

# Шляхи до файлів
$sourceMainFile = Join-Path $CURRENT_PROJECT_PATH "proGran3.rb"
$sourceCoreFile = Join-Path $CURRENT_PROJECT_PATH "proGran3_core.rb"
$sourceLoaderFile = Join-Path $CURRENT_PROJECT_PATH "proGran3_loader.rb"
$sourceReloadFile = Join-Path $CURRENT_PROJECT_PATH "force_reload_plugin.rb"
$sourceFolder = Join-Path $CURRENT_PROJECT_PATH "proGran3"
$targetMainFile = Join-Path $SKETCHUP_PLUGINS_PATH "proGran3.rb"
$targetCoreFile = Join-Path $SKETCHUP_PLUGINS_PATH "proGran3_core.rb"
$targetLoaderFile = Join-Path $SKETCHUP_PLUGINS_PATH "proGran3_loader.rb"
$targetReloadFile = Join-Path $SKETCHUP_PLUGINS_PATH "force_reload_plugin.rb"
$targetFolder = Join-Path $SKETCHUP_PLUGINS_PATH "proGran3"

try {
    # Копіюємо головний файл
    if (Test-Path $sourceMainFile) {
        Copy-Item $sourceMainFile $targetMainFile -Force
        Write-Host "Copied: proGran3.rb" -ForegroundColor Green
    } else {
        Write-Host "File proGran3.rb not found!" -ForegroundColor Red
        exit 1
    }
    
    # Копіюємо core файл (якщо існує)
    if (Test-Path $sourceCoreFile) {
        Copy-Item $sourceCoreFile $targetCoreFile -Force
        Write-Host "Copied: proGran3_core.rb" -ForegroundColor Green
    } else {
        Write-Host "File proGran3_core.rb not found!" -ForegroundColor Yellow
    }
    
    # Копіюємо завантажувач
    if (Test-Path $sourceLoaderFile) {
        Copy-Item $sourceLoaderFile $targetLoaderFile -Force
        Write-Host "Copied: proGran3_loader.rb" -ForegroundColor Green
    } else {
        Write-Host "File proGran3_loader.rb not found!" -ForegroundColor Yellow
    }
    
    # force_reload_plugin.rb видалено - не потрібен користувачам
    # Це інструмент тільки для розробки
    
    # Копіюємо папку proGran3
    if (Test-Path $sourceFolder) {
        if (Test-Path $targetFolder) {
            Remove-Item $targetFolder -Recurse -Force
        }
        Copy-Item $sourceFolder $targetFolder -Recurse -Force
        Write-Host "Copied: proGran3 folder" -ForegroundColor Green
    } else {
        Write-Host "Folder proGran3 not found!" -ForegroundColor Red
        exit 1
    }
    
    
    Write-Host "Plugin deployed successfully!" -ForegroundColor Green
    Write-Host "Location: $SKETCHUP_PLUGINS_PATH" -ForegroundColor Cyan
    Write-Host "Files deployed:" -ForegroundColor Cyan
    Write-Host "  - proGran3.rb (main plugin file)" -ForegroundColor White
    Write-Host "  - proGran3_core.rb (core plugin file, if exists)" -ForegroundColor White
    Write-Host "  - proGran3_loader.rb (plugin loader)" -ForegroundColor White
    Write-Host "  - force_reload_plugin.rb (development tool)" -ForegroundColor White
    Write-Host "  - proGran3/ (plugin folder with all modules)" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "Note: force_reload_plugin.rb is only needed for development" -ForegroundColor Yellow
    Write-Host "Restart SketchUp or use ProGran3.reload in Ruby console" -ForegroundColor Yellow
    
} catch {
    Write-Host "Error during deployment: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
