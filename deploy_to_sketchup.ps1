# deploy_to_sketchup.ps1
# PowerShell скрипт для копіювання файлів плагіна в папку SketchUp

param(
    [switch]$Watch,
    [string]$SketchUpVersion = "2023",
    [switch]$ListVersions,
    [switch]$Backup
)

# Завантажуємо конфігурацію
$configPath = Join-Path $PSScriptRoot "config.json"
if (Test-Path $configPath) {
    $config = Get-Content $configPath | ConvertFrom-Json
    $defaultVersion = $config.default_version
    if (-not $SketchUpVersion -or $SketchUpVersion -eq "2023") {
        $SketchUpVersion = $defaultVersion
    }
} else {
    $config = @{
        sketchup_versions = @{
            "2023" = "%APPDATA%\SketchUp\SketchUp 2023\SketchUp\Plugins"
            "2022" = "%APPDATA%\SketchUp\SketchUp 2022\SketchUp\Plugins"
            "2021" = "%APPDATA%\SketchUp\SketchUp 2021\SketchUp\Plugins"
        }
        default_version = "2023"
    }
}

# Шлях до папки плагінів SketchUp
$SKETCHUP_PLUGINS_PATH = $config.sketchup_versions.$SketchUpVersion -replace "%APPDATA%", $env:APPDATA

# Шлях до поточного проекту
$CURRENT_PROJECT_PATH = Split-Path -Parent $MyInvocation.MyCommand.Path

# Встановлюємо кодування UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "🚀 Розгортання плагіна ProGran3..." -ForegroundColor Green

# Перевіряємо чи існує папка плагінів
if (-not (Test-Path $SKETCHUP_PLUGINS_PATH)) {
    Write-Host "❌ Папка плагінів SketchUp не знайдена: $SKETCHUP_PLUGINS_PATH" -ForegroundColor Red
    Write-Host "📝 Будь ласка, вкажіть правильний шлях до папки плагінів SketchUp" -ForegroundColor Yellow
    exit 1
}

# Шляхи для копіювання
$sourceMainFile = Join-Path $CURRENT_PROJECT_PATH "proGran3.rb"
$sourceFolder = Join-Path $CURRENT_PROJECT_PATH "proGran3"
$targetMainFile = Join-Path $SKETCHUP_PLUGINS_PATH "proGran3.rb"
$targetFolder = Join-Path $SKETCHUP_PLUGINS_PATH "proGran3"

function Deploy-Plugin {
    try {
        # Копіюємо головний файл
        if (Test-Path $sourceMainFile) {
            Copy-Item $sourceMainFile $targetMainFile -Force
            Write-Host "✅ Скопійовано: proGran3.rb" -ForegroundColor Green
        } else {
            Write-Host "❌ Файл proGran3.rb не знайдено" -ForegroundColor Red
            return $false
        }
        
        # Копіюємо папку proGran3
        if (Test-Path $sourceFolder) {
            if (Test-Path $targetFolder) {
                Remove-Item $targetFolder -Recurse -Force
            }
            Copy-Item $sourceFolder $targetFolder -Recurse -Force
            Write-Host "✅ Скопійовано: папка proGran3" -ForegroundColor Green
        } else {
            Write-Host "❌ Папка proGran3 не знайдена" -ForegroundColor Red
            return $false
        }
        
        Write-Host "🎉 Плагін успішно розгорнуто!" -ForegroundColor Green
        Write-Host "📍 Розташування: $SKETCHUP_PLUGINS_PATH" -ForegroundColor Cyan
        Write-Host "💡 Перезапустіть SketchUp або використайте команду ProGran3.reload в консолі Ruby" -ForegroundColor Yellow
        
        return $true
        
    } catch {
        Write-Host "❌ Помилка при копіюванні: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Watch-And-Deploy {
    Write-Host "👀 Режим спостереження за змінами..." -ForegroundColor Cyan
    Write-Host "📁 Відстежую зміни в: $CURRENT_PROJECT_PATH" -ForegroundColor Cyan
    Write-Host "🔄 Автоматично копіюватиму зміни в SketchUp" -ForegroundColor Cyan
    Write-Host "⏹️  Натисніть Ctrl+C для зупинки" -ForegroundColor Yellow
    
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $CURRENT_PROJECT_PATH
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true
    
    $action = {
        Write-Host "`n🔄 Виявлено зміни..." -ForegroundColor Yellow
        Deploy-Plugin
    }
    
    Register-ObjectEvent $watcher "Changed" -Action $action
    Register-ObjectEvent $watcher "Created" -Action $action
    Register-ObjectEvent $watcher "Deleted" -Action $action
    
    try {
        while ($true) { Start-Sleep -Seconds 1 }
    } catch {
        Write-Host "`n👋 Зупинено спостереження" -ForegroundColor Cyan
    }
}

function Show-Versions {
    Write-Host "📋 Доступні версії SketchUp:" -ForegroundColor Cyan
    foreach ($version in $config.sketchup_versions.Keys) {
        $path = $config.sketchup_versions.$version -replace "%APPDATA%", $env:APPDATA
        $exists = Test-Path $path
        $status = if ($exists) { "✅" } else { "❌" }
        Write-Host "  $status $version`: $path" -ForegroundColor $(if ($exists) { "Green" } else { "Red" })
    }
    Write-Host "`n💡 Використання: .\deploy_to_sketchup.ps1 -SketchUpVersion '2022'" -ForegroundColor Yellow
}

function Backup-Plugin {
    Write-Host "💾 Створення резервної копії..." -ForegroundColor Cyan
    
    $backupFolder = Join-Path $PSScriptRoot "backups"
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $backupPath = Join-Path $backupFolder "backup_$timestamp"
    
    if (-not (Test-Path $backupFolder)) {
        New-Item -ItemType Directory -Path $backupFolder | Out-Null
    }
    
    if (Test-Path $targetMainFile) {
        Copy-Item $targetMainFile (Join-Path $backupPath "proGran3.rb") -Force
    }
    
    if (Test-Path $targetFolder) {
        Copy-Item $targetFolder (Join-Path $backupPath "proGran3") -Recurse -Force
    }
    
    Write-Host "✅ Резервна копія створена: $backupPath" -ForegroundColor Green
}

# Головна логіка
if ($ListVersions) {
    Show-Versions
} elseif ($Backup) {
    Backup-Plugin
} elseif ($Watch) {
    Watch-And-Deploy
} else {
    Deploy-Plugin
}
