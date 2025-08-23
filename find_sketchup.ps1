# find_sketchup.ps1
# Script for finding installed SketchUp

Write-Host "Searching for SketchUp installations..." -ForegroundColor Cyan

# Common installation paths
$searchPaths = @(
    "$env:APPDATA\SketchUp",
    "$env:LOCALAPPDATA\SketchUp",
    "C:\Program Files\SketchUp",
    "C:\Program Files (x86)\SketchUp",
    "C:\Users\$env:USERNAME\AppData\Roaming\SketchUp",
    "C:\Users\$env:USERNAME\AppData\Local\SketchUp"
)

$foundInstallations = @()

foreach ($basePath in $searchPaths) {
    if (Test-Path $basePath) {
        Write-Host "Checking: $basePath" -ForegroundColor Yellow
        
        # Look for SketchUp folders
        $sketchupFolders = Get-ChildItem -Path $basePath -Directory -Name "SketchUp*" -ErrorAction SilentlyContinue
        
        foreach ($folder in $sketchupFolders) {
            $fullPath = Join-Path $basePath $folder
            $pluginsPath = Join-Path $fullPath "SketchUp\Plugins"
            
            if (Test-Path $pluginsPath) {
                Write-Host "  Found: $pluginsPath" -ForegroundColor Green
                $foundInstallations += $pluginsPath
            } else {
                Write-Host "  No plugins folder: $fullPath" -ForegroundColor Gray
            }
        }
    }
}

if ($foundInstallations.Count -gt 0) {
    Write-Host "`nFound SketchUp installations:" -ForegroundColor Green
    for ($i = 0; $i -lt $foundInstallations.Count; $i++) {
        Write-Host "  $($i + 1). $($foundInstallations[$i])" -ForegroundColor Cyan
    }
    
    Write-Host "`nTo use one of these paths, update your config.json:" -ForegroundColor Yellow
    Write-Host "Example:" -ForegroundColor White
    Write-Host '  "sketchup_versions": {' -ForegroundColor Gray
    Write-Host '    "2023": "' + $foundInstallations[0] + '"' -ForegroundColor Gray
    Write-Host '  }' -ForegroundColor Gray
    
} else {
    Write-Host "`nNo SketchUp installations found!" -ForegroundColor Red
    Write-Host "Please install SketchUp first." -ForegroundColor Yellow
}
