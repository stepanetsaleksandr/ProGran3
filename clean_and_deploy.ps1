# clean_and_deploy.ps1
# Script for cleaning old plugin versions and deploying fresh

param(
    [switch]$Force
)

# Load configuration
$configPath = "config.json"
if (Test-Path $configPath) {
    $config = Get-Content $configPath | ConvertFrom-Json
    $defaultVersion = $config.default_version
} else {
    Write-Host "Config file not found!" -ForegroundColor Red
    exit 1
}

# Get SketchUp plugins path
$SKETCHUP_PLUGINS_PATH = $config.sketchup_versions.$defaultVersion
if ($SKETCHUP_PLUGINS_PATH -like "*%APPDATA%*") {
    $SKETCHUP_PLUGINS_PATH = $SKETCHUP_PLUGINS_PATH -replace "%APPDATA%", $env:APPDATA
}

# Current project path
$CURRENT_PROJECT_PATH = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Cleaning and deploying ProGran3 plugin..." -ForegroundColor Green

# Check if plugins folder exists
if (-not (Test-Path $SKETCHUP_PLUGINS_PATH)) {
    Write-Host "SketchUp plugins folder not found: $SKETCHUP_PLUGINS_PATH" -ForegroundColor Red
    exit 1
}

# List of old plugin folders to remove
$oldPlugins = @(
    "proGran3",
    "proGran", 
    "PG3D",
    "ProGran3D",
    "ProGran3DG",
    "RESERVE"
)

# List of old plugin files to remove
$oldFiles = @(
    "proGran3.rb",
    "proGran.rb",
    "PG3D.rb"
)

Write-Host "`nRemoving old plugin versions..." -ForegroundColor Yellow

# Remove old folders
foreach ($plugin in $oldPlugins) {
    $pluginPath = Join-Path $SKETCHUP_PLUGINS_PATH $plugin
    if (Test-Path $pluginPath) {
        if ($Force) {
            Remove-Item $pluginPath -Recurse -Force
            Write-Host "Removed folder: $plugin" -ForegroundColor Green
        } else {
            Write-Host "Found old folder: $plugin (use -Force to remove)" -ForegroundColor Yellow
        }
    }
}

# Remove old files
foreach ($file in $oldFiles) {
    $filePath = Join-Path $SKETCHUP_PLUGINS_PATH $file
    if (Test-Path $filePath) {
        if ($Force) {
            Remove-Item $filePath -Force
            Write-Host "Removed file: $file" -ForegroundColor Green
        } else {
            Write-Host "Found old file: $file (use -Force to remove)" -ForegroundColor Yellow
        }
    }
}

# Deploy new plugin
Write-Host "`nDeploying fresh plugin..." -ForegroundColor Cyan

$sourceMainFile = Join-Path $CURRENT_PROJECT_PATH "proGran3.rb"
$sourceFolder = Join-Path $CURRENT_PROJECT_PATH "proGran3"
$targetMainFile = Join-Path $SKETCHUP_PLUGINS_PATH "proGran3.rb"
$targetFolder = Join-Path $SKETCHUP_PLUGINS_PATH "proGran3"

try {
    # Copy main file
    if (Test-Path $sourceMainFile) {
        Copy-Item $sourceMainFile $targetMainFile -Force
        Write-Host "Copied: proGran3.rb" -ForegroundColor Green
    } else {
        Write-Host "File proGran3.rb not found!" -ForegroundColor Red
        exit 1
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
        exit 1
    }
    
    Write-Host "`nPlugin deployed successfully!" -ForegroundColor Green
    Write-Host "Location: $SKETCHUP_PLUGINS_PATH" -ForegroundColor Cyan
    Write-Host "Restart SketchUp or use ProGran3.reload in Ruby console" -ForegroundColor Yellow
    
} catch {
    Write-Host "Error during deployment: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
