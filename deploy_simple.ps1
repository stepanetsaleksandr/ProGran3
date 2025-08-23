# deploy_simple.ps1
# Simple deployment script for ProGran3 plugin

param(
    [switch]$Watch,
    [string]$SketchUpVersion = "2024"
)

# Load configuration
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

# Get SketchUp plugins path
$SKETCHUP_PLUGINS_PATH = $config.sketchup_versions.$SketchUpVersion
if ($SKETCHUP_PLUGINS_PATH -like "*%APPDATA%*") {
    $SKETCHUP_PLUGINS_PATH = $SKETCHUP_PLUGINS_PATH -replace "%APPDATA%", $env:APPDATA
}

# Current project path
$CURRENT_PROJECT_PATH = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Deploying ProGran3 plugin..." -ForegroundColor Green

# Check if plugins folder exists
if (-not (Test-Path $SKETCHUP_PLUGINS_PATH)) {
    Write-Host "SketchUp plugins folder not found: $SKETCHUP_PLUGINS_PATH" -ForegroundColor Red
    Write-Host "Please check your SketchUp installation." -ForegroundColor Yellow
    exit 1
}

# Source and target paths
$sourceMainFile = Join-Path $CURRENT_PROJECT_PATH "proGran3.rb"
$sourceFolder = Join-Path $CURRENT_PROJECT_PATH "proGran3"
$targetMainFile = Join-Path $SKETCHUP_PLUGINS_PATH "proGran3.rb"
$targetFolder = Join-Path $SKETCHUP_PLUGINS_PATH "proGran3"

function Deploy-Plugin {
    try {
        # Copy main file
        if (Test-Path $sourceMainFile) {
            Copy-Item $sourceMainFile $targetMainFile -Force
            Write-Host "Copied: proGran3.rb" -ForegroundColor Green
        } else {
            Write-Host "File proGran3.rb not found!" -ForegroundColor Red
            return $false
        }
        
        # Copy proGran3 folder
        if (Test-Path $sourceFolder) {
            if (Test-Path $targetFolder) {
                Remove-Item $targetFolder -Recurse -Force
            }
            Copy-Item $sourceFolder $targetFolder -Recurse -Force
            Write-Host "Copied: proGran3 folder" -ForegroundColor Green
        } else {
            Write-Host "Folder proGran3 not found!" -ForegroundColor Red
            return $false
        }
        
        Write-Host "Plugin deployed successfully!" -ForegroundColor Green
        Write-Host "Location: $SKETCHUP_PLUGINS_PATH" -ForegroundColor Cyan
        Write-Host "Restart SketchUp or use ProGran3.reload in Ruby console" -ForegroundColor Yellow
        
        return $true
        
    } catch {
        Write-Host "Error during deployment: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main logic
if ($Watch) {
    Write-Host "Watch mode enabled..." -ForegroundColor Cyan
    Write-Host "Monitoring changes in: $CURRENT_PROJECT_PATH" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $CURRENT_PROJECT_PATH
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true
    
    $action = {
        Write-Host "`nChanges detected..." -ForegroundColor Yellow
        Deploy-Plugin
    }
    
    Register-ObjectEvent $watcher "Changed" -Action $action
    Register-ObjectEvent $watcher "Created" -Action $action
    Register-ObjectEvent $watcher "Deleted" -Action $action
    
    try {
        while ($true) { Start-Sleep -Seconds 1 }
    } catch {
        Write-Host "`nWatch mode stopped" -ForegroundColor Cyan
    }
} else {
    Deploy-Plugin
}
