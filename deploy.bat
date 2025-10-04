@echo off
REM ===========================================
REM ProGran3 Deployment Script (Windows)
REM ===========================================

echo 🚀 Starting ProGran3 Deployment...

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Not in project root directory. Please run from ProGran3 root.
    pause
    exit /b 1
)

REM Step 1: Check environment variables
echo [INFO] Checking environment variables...
if not exist "server\.env.local" (
    echo [WARNING] No .env.local file found. Please create it from env.template
    echo [INFO] Copying template...
    copy "server\env.template" "server\.env.local"
    echo [WARNING] Please edit server\.env.local with your actual values before deploying!
    pause
    exit /b 1
)

REM Step 2: Install dependencies
echo [INFO] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install root dependencies
    pause
    exit /b 1
)

cd server
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install server dependencies
    pause
    exit /b 1
)
cd ..

echo [SUCCESS] Dependencies installed successfully

REM Step 3: Test build
echo [INFO] Testing build...
cd server
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed. Please fix errors before deploying.
    pause
    exit /b 1
)
cd ..

echo [SUCCESS] Build test passed

REM Step 4: Check Vercel CLI
echo [INFO] Checking Vercel CLI...
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Vercel CLI not found. Installing...
    call npm install -g vercel
)

REM Step 5: Deploy to Vercel
echo [INFO] Deploying to Vercel...
call vercel --prod

if %errorlevel% equ 0 (
    echo [SUCCESS] Deployment completed successfully!
    echo [INFO] Your app is now live on Vercel
    echo [INFO] Check the deployment URL in your Vercel dashboard
) else (
    echo [ERROR] Deployment failed
    pause
    exit /b 1
)

REM Step 6: Post-deployment instructions
echo [INFO] Post-deployment steps:
echo   1. Set up environment variables in Vercel dashboard
echo   2. Run database migration: POST /api/final-migration
echo   3. Test all API endpoints
echo   4. Update plugin configuration with new API URL

echo [SUCCESS] Deployment script completed!
pause
