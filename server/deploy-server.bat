@echo off
chcp 65001 >nul
echo ProGran3 Server Deployment
echo.

echo Checking prerequisites...

:: Перевірка Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)

:: Перевірка npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm not found! Please install npm first.
    pause
    exit /b 1
)

:: Перевірка Vercel CLI
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Vercel CLI...
    npm install -g vercel
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Vercel CLI
        pause
        exit /b 1
    )
)

echo.
echo Prerequisites check completed!
echo.

:: Перехід в папку сервера
cd /d "%~dp0"

echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Running tests...
npm run test
if %errorlevel% neq 0 (
    echo WARNING: Tests failed, but continuing deployment...
)

echo.
echo Building project...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo Checking environment variables...
if not exist ".env.local" (
    echo WARNING: .env.local not found!
    echo Please create .env.local with your environment variables.
    echo See DEPLOY_SERVER.md for details.
    echo.
    echo Do you want to continue without .env.local? (y/n)
    set /p continue=
    if /i not "%continue%"=="y" (
        echo Deployment cancelled.
        pause
        exit /b 1
    )
)

echo.
echo Deploying to Vercel...
vercel --prod
if %errorlevel% neq 0 (
    echo ERROR: Deployment failed
    pause
    exit /b 1
)

echo.
echo ✅ Server deployed successfully!
echo.
echo Next steps:
echo 1. Configure environment variables in Vercel Dashboard
echo 2. Test the deployment using the URLs provided
echo 3. Check DEPLOY_SERVER.md for testing instructions
echo.
pause
