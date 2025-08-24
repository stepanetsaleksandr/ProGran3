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
$sourceFolder = Join-Path $CURRENT_PROJECT_PATH "proGran3"
$targetMainFile = Join-Path $SKETCHUP_PLUGINS_PATH "proGran3.rb"
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
    Write-Host "Restart SketchUp or use ProGran3.reload in Ruby console" -ForegroundColor Yellow
    
} catch {
    Write-Host "Error during deployment: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
