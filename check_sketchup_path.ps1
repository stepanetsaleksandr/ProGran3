# check_sketchup_path.ps1
# Script for checking and configuring SketchUp path

param(
    [string]$SketchUpVersion = "2023"
)

Write-Host "Checking SketchUp path..." -ForegroundColor Cyan

# Typical SketchUp paths
$possiblePaths = @(
    "$env:APPDATA\SketchUp\SketchUp $SketchUpVersion\SketchUp\Plugins",
    "$env:LOCALAPPDATA\SketchUp\SketchUp $SketchUpVersion\SketchUp\Plugins",
    "C:\Users\$env:USERNAME\AppData\Roaming\SketchUp\SketchUp $SketchUpVersion\SketchUp\Plugins"
)

$foundPath = $null

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $foundPath = $path
        Write-Host "Found: $path" -ForegroundColor Green
        break
    } else {
        Write-Host "Not found: $path" -ForegroundColor Red
    }
}

if ($foundPath) {
    Write-Host "`nUpdating configuration..." -ForegroundColor Yellow
    
    # Update config.json
    $configPath = "config.json"
    if (Test-Path $configPath) {
        $config = Get-Content $configPath | ConvertFrom-Json
    } else {
        $config = @{
            sketchup_versions = @{}
            default_version = $SketchUpVersion
            plugin_name = "proGran3"
            auto_reload = $true
            backup_enabled = $true
            backup_folder = "backups"
        }
    }
    
    $config.sketchup_versions.$SketchUpVersion = $foundPath
    $config.default_version = $SketchUpVersion
    
    $config | ConvertTo-Json -Depth 10 | Set-Content $configPath
    
    Write-Host "Configuration updated!" -ForegroundColor Green
    Write-Host "Path: $foundPath" -ForegroundColor Cyan
    
    # Offer to deploy plugin
    Write-Host "`nDeploy plugin now? (y/n)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -eq "y" -or $response -eq "Y") {
        & ".\deploy_simple.ps1"
    }
    
} else {
    Write-Host "`nCould not find SketchUp plugins folder" -ForegroundColor Red
    Write-Host "Try:" -ForegroundColor Yellow
    Write-Host "  1. Make sure SketchUp is installed" -ForegroundColor White
    Write-Host "  2. Specify correct version: .\check_sketchup_path.ps1 -SketchUpVersion '2022'" -ForegroundColor White
    Write-Host "  3. Find folder manually and update config.json" -ForegroundColor White
}
