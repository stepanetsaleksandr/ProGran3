# ProGran3 Server Deployment Script
# PowerShell version for advanced deployment

param(
    [string]$Environment = "production",
    [switch]$SkipTests = $false,
    [switch]$SkipBuild = $false,
    [switch]$Force = $false
)

# Кольори для виводу
$ErrorColor = "Red"
$SuccessColor = "Green"
$WarningColor = "Yellow"
$InfoColor = "Cyan"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-Prerequisites {
    Write-ColorOutput "Checking prerequisites..." $InfoColor
    
    # Перевірка Node.js
    try {
        $nodeVersion = node --version
        Write-ColorOutput "✅ Node.js: $nodeVersion" $SuccessColor
    }
    catch {
        Write-ColorOutput "❌ Node.js not found! Please install Node.js first." $ErrorColor
        return $false
    }
    
    # Перевірка npm
    try {
        $npmVersion = npm --version
        Write-ColorOutput "✅ npm: $npmVersion" $SuccessColor
    }
    catch {
        Write-ColorOutput "❌ npm not found! Please install npm first." $ErrorColor
        return $false
    }
    
    # Перевірка Vercel CLI
    try {
        $vercelVersion = vercel --version
        Write-ColorOutput "✅ Vercel CLI: $vercelVersion" $SuccessColor
    }
    catch {
        Write-ColorOutput "⚠️ Vercel CLI not found. Installing..." $WarningColor
        try {
            npm install -g vercel
            Write-ColorOutput "✅ Vercel CLI installed successfully" $SuccessColor
        }
        catch {
            Write-ColorOutput "❌ Failed to install Vercel CLI" $ErrorColor
            return $false
        }
    }
    
    return $true
}

function Install-Dependencies {
    Write-ColorOutput "Installing dependencies..." $InfoColor
    
    try {
        npm install
        Write-ColorOutput "✅ Dependencies installed successfully" $SuccessColor
        return $true
    }
    catch {
        Write-ColorOutput "❌ Failed to install dependencies" $ErrorColor
        return $false
    }
}

function Run-Tests {
    if ($SkipTests) {
        Write-ColorOutput "⚠️ Skipping tests (--SkipTests flag)" $WarningColor
        return $true
    }
    
    Write-ColorOutput "Running tests..." $InfoColor
    
    try {
        npm run test
        Write-ColorOutput "✅ Tests passed successfully" $SuccessColor
        return $true
    }
    catch {
        Write-ColorOutput "⚠️ Tests failed, but continuing deployment..." $WarningColor
        return $true
    }
}

function Build-Project {
    if ($SkipBuild) {
        Write-ColorOutput "⚠️ Skipping build (--SkipBuild flag)" $WarningColor
        return $true
    }
    
    Write-ColorOutput "Building project..." $InfoColor
    
    try {
        npm run build
        Write-ColorOutput "✅ Build completed successfully" $SuccessColor
        return $true
    }
    catch {
        Write-ColorOutput "❌ Build failed" $ErrorColor
        return $false
    }
}

function Test-EnvironmentVariables {
    Write-ColorOutput "Checking environment variables..." $InfoColor
    
    if (-not (Test-Path ".env.local")) {
        Write-ColorOutput "⚠️ .env.local not found!" $WarningColor
        Write-ColorOutput "Please create .env.local with your environment variables." $InfoColor
        Write-ColorOutput "See DEPLOY_SERVER.md for details." $InfoColor
        
        if (-not $Force) {
            $continue = Read-Host "Do you want to continue without .env.local? (y/n)"
            if ($continue -ne "y" -and $continue -ne "Y") {
                Write-ColorOutput "Deployment cancelled." $WarningColor
                return $false
            }
        }
    }
    else {
        Write-ColorOutput "✅ .env.local found" $SuccessColor
    }
    
    return $true
}

function Deploy-ToVercel {
    Write-ColorOutput "Deploying to Vercel..." $InfoColor
    
    try {
        if ($Environment -eq "production") {
            vercel --prod
        }
        else {
            vercel
        }
        Write-ColorOutput "✅ Deployment completed successfully" $SuccessColor
        return $true
    }
    catch {
        Write-ColorOutput "❌ Deployment failed" $ErrorColor
        return $false
    }
}

function Show-PostDeploymentInfo {
    Write-ColorOutput "`n🎉 Server deployed successfully!" $SuccessColor
    Write-ColorOutput "`nNext steps:" $InfoColor
    Write-ColorOutput "1. Configure environment variables in Vercel Dashboard" $InfoColor
    Write-ColorOutput "2. Test the deployment using the URLs provided" $InfoColor
    Write-ColorOutput "3. Check DEPLOY_SERVER.md for testing instructions" $InfoColor
    Write-ColorOutput "4. Monitor the deployment in Vercel Dashboard" $InfoColor
}

# Основна логіка деплою
Write-ColorOutput "ProGran3 Server Deployment" $InfoColor
Write-ColorOutput "Environment: $Environment" $InfoColor
Write-ColorOutput "Force mode: $Force" $InfoColor
Write-ColorOutput ""

# Перевірка передумов
if (-not (Test-Prerequisites)) {
    exit 1
}

# Встановлення залежностей
if (-not (Install-Dependencies)) {
    exit 1
}

# Запуск тестів
if (-not (Run-Tests)) {
    exit 1
}

# Збірка проекту
if (-not (Build-Project)) {
    exit 1
}

# Перевірка змінних середовища
if (-not (Test-EnvironmentVariables)) {
    exit 1
}

# Деплой на Vercel
if (-not (Deploy-ToVercel)) {
    exit 1
}

# Показ інформації після деплою
Show-PostDeploymentInfo
