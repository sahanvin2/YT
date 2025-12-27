# Start Movia Backend and HLS Worker

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Movia Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Redis is running
Write-Host "Checking Redis..." -ForegroundColor Yellow
$redisRunning = $false

try {
    $null = redis-cli ping 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Redis is running" -ForegroundColor Green
        $redisRunning = $true
    }
} catch {
    try {
        $null = memurai-cli ping 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Memurai is running" -ForegroundColor Green
            $redisRunning = $true
        }
    } catch {
        Write-Host "✗ Redis/Memurai not running!" -ForegroundColor Red
        Write-Host "  Install: See REDIS_SETUP_WINDOWS.md" -ForegroundColor Yellow
    }
}

if (-not $redisRunning) {
    Write-Host ""
    Write-Host "ERROR: Redis is required for video processing!" -ForegroundColor Red
    Write-Host "Install Redis/Memurai first, then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Yellow
Write-Host ""

# Start backend in a new window
Write-Host "1. Starting Backend (port 5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'Backend Server' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 2

# Start HLS worker in a new window
Write-Host "2. Starting HLS Worker..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'HLS Worker' -ForegroundColor Green; node backend/hlsWorker.js"

Start-Sleep -Seconds 2

# Start frontend in a new window
Write-Host "3. Starting Frontend (port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\client'; Write-Host 'Frontend - React App' -ForegroundColor Green; npm start"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "3 new PowerShell windows opened:" -ForegroundColor White
Write-Host "  1. Backend Server (port 5000)" -ForegroundColor Cyan
Write-Host "  2. HLS Worker (video processing)" -ForegroundColor Cyan
Write-Host "  3. Frontend (port 3000)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Wait a few seconds, then:" -ForegroundColor Yellow
Write-Host "  → Visit http://localhost:3000" -ForegroundColor White
Write-Host "  → Upload a video to test processing" -ForegroundColor White
Write-Host ""
Write-Host "To stop services: Close the PowerShell windows" -ForegroundColor Yellow
Write-Host ""
