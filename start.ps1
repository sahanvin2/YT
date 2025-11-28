# Movia - Quick Start Script
# Run this script to check prerequisites and start the application

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  MOVIA - Video Platform Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check Node.js
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found! Please install Node.js first." -ForegroundColor Red
    Write-Host "  Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check MongoDB
Write-Host "`nChecking MongoDB connection..." -ForegroundColor Yellow
try {
    mongosh --eval "db.version()" --quiet 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ MongoDB is running" -ForegroundColor Green
    } else {
        Write-Host "✗ MongoDB is not running!" -ForegroundColor Red
        Write-Host "  Please start MongoDB service first." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "⚠ MongoDB check skipped (mongosh not found)" -ForegroundColor Yellow
    Write-Host "  Make sure MongoDB is running before starting the app" -ForegroundColor Yellow
}

# Check if dependencies are installed
Write-Host "`nChecking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install backend dependencies!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Backend dependencies already installed" -ForegroundColor Green
}

if (-not (Test-Path "client\node_modules")) {
    Write-Host "`nInstalling frontend dependencies..." -ForegroundColor Yellow
    Set-Location client
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install frontend dependencies!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    Set-Location ..
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Frontend dependencies already installed" -ForegroundColor Green
}

# Create uploads directory if it doesn't exist
if (-not (Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" | Out-Null
    Write-Host "✓ Created uploads directory" -ForegroundColor Green
}

# Start the application
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Starting Movia..." -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend API will be available at: http://localhost:5000" -ForegroundColor Green
Write-Host "`nPress Ctrl+C to stop the servers`n" -ForegroundColor Yellow

npm run dev
