@echo off
REM ===========================================
REM ProGran3 Smart Deployment Script (Windows)
REM Auto-updates config.json with new URL
REM ===========================================

echo.
echo ================================================
echo   ProGran3 Smart Deployment
echo ================================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Not in project root directory. Please run from ProGran3 root.
    pause
    exit /b 1
)

REM Step 1: Pre-deployment checks
echo [1/6] Pre-deployment checks...
echo.

REM Check environment variables
if not exist "server\.env.local" (
    echo [WARNING] No .env.local file found. Please create it from env.template
    echo [INFO] Copying template...
    copy "server\env.template" "server\.env.local"
    echo [WARNING] Please edit server\.env.local with your actual values before deploying!
    pause
    exit /b 1
)

REM Step 2: Test build
echo [2/6] Testing build...
echo.
cd server
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed. Please fix errors before deploying.
    cd ..
    pause
    exit /b 1
)
cd ..
echo [SUCCESS] Build test passed
echo.

REM Step 3: Deploy to Vercel
echo [3/6] Deploying to Vercel...
echo.
cd server
call vercel --prod --yes > deploy_output.txt 2>&1
set DEPLOY_EXIT=%errorlevel%
cd ..

if %DEPLOY_EXIT% neq 0 (
    echo [ERROR] Deployment failed. Check server\deploy_output.txt for details.
    pause
    exit /b 1
)

echo [SUCCESS] Deployment completed!
echo.

REM Step 4: Extract new URL
echo [4/6] Extracting deployment URL...
echo.

REM Parse URL from vercel output
for /f "tokens=*" %%a in ('findstr /C:"https://" server\deploy_output.txt') do (
    set DEPLOY_URL=%%a
)

REM Clean up URL (remove extra text)
echo %DEPLOY_URL% | findstr /R "https://server-.*-provis3ds-projects.vercel.app" > temp_url.txt
set /p NEW_URL=<temp_url.txt
del temp_url.txt

if "%NEW_URL%"=="" (
    echo [WARNING] Could not extract URL automatically.
    echo [INFO] Please check server\deploy_output.txt for deployment URL.
    set /p NEW_URL="Enter deployment URL manually: "
)

echo [INFO] New deployment URL: %NEW_URL%
echo.

REM Step 5: Update config.json
echo [5/6] Updating plugin config...
echo.

REM Backup current config
copy plugin\config.json plugin\config.json.backup >nul 2>&1

REM Use PowerShell to update JSON
powershell -Command "$config = Get-Content 'plugin\config.json' | ConvertFrom-Json; $config.api.base_url = '%NEW_URL%'; $config | ConvertTo-Json -Depth 10 | Set-Content 'plugin\config.json'"

if %errorlevel% equ 0 (
    echo [SUCCESS] Config updated successfully!
    echo [INFO] Old URL backed up to plugin\config.json.backup
) else (
    echo [ERROR] Failed to update config. Please update manually.
    echo [INFO] Restoring backup...
    copy plugin\config.json.backup plugin\config.json >nul 2>&1
)
echo.

REM Step 6: Post-deployment summary
echo [6/6] Post-deployment summary
echo.
echo ================================================
echo   Deployment Complete!
echo ================================================
echo.
echo   New URL: %NEW_URL%
echo   Config:  plugin\config.json (updated)
echo   Backup:  plugin\config.json.backup
echo.
echo ================================================
echo   Next Steps:
echo ================================================
echo.
echo   1. Test API endpoint:
echo      %NEW_URL%/api/licenses
echo.
echo   2. Redeploy plugin to SketchUp:
echo      - Run: plugin\deploy_simple.bat
echo      - Or manually copy to SketchUp Plugins folder
echo.
echo   3. Test license activation in SketchUp
echo.
echo   4. (Optional) Commit config changes:
echo      git add plugin\config.json
echo      git commit -m "chore: update API URL after deploy"
echo.
echo ================================================

REM Cleanup
if exist server\deploy_output.txt del server\deploy_output.txt

echo.
pause

