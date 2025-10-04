#!/bin/bash

# ===========================================
# ProGran3 Deployment Script
# ===========================================

echo "🚀 Starting ProGran3 Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in project root directory. Please run from ProGran3 root."
    exit 1
fi

# Step 1: Check environment variables
print_status "Checking environment variables..."
if [ ! -f "server/.env.local" ]; then
    print_warning "No .env.local file found. Please create it from env.template"
    print_status "Copying template..."
    cp server/env.template server/.env.local
    print_warning "Please edit server/.env.local with your actual values before deploying!"
    exit 1
fi

# Step 2: Install dependencies
print_status "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install root dependencies"
    exit 1
fi

cd server
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install server dependencies"
    exit 1
fi
cd ..

print_success "Dependencies installed successfully"

# Step 3: Test build
print_status "Testing build..."
cd server
npm run build
if [ $? -ne 0 ]; then
    print_error "Build failed. Please fix errors before deploying."
    exit 1
fi
cd ..

print_success "Build test passed"

# Step 4: Check Vercel CLI
print_status "Checking Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Step 5: Deploy to Vercel
print_status "Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    print_success "Deployment completed successfully!"
    print_status "Your app is now live on Vercel"
    print_status "Check the deployment URL in your Vercel dashboard"
else
    print_error "Deployment failed"
    exit 1
fi

# Step 6: Post-deployment checks
print_status "Running post-deployment checks..."

# Get the deployment URL (this is a simplified check)
print_status "Please test the following endpoints manually:"
echo "  - GET /api/test-connection"
echo "  - GET /api/check-state"
echo "  - GET /api/dashboard/stats"

print_success "Deployment script completed!"
print_status "Next steps:"
echo "  1. Set up environment variables in Vercel dashboard"
echo "  2. Run database migration: POST /api/final-migration"
echo "  3. Test all API endpoints"
echo "  4. Update plugin configuration with new API URL"
