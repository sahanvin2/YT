Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Movia Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking Redis..." -ForegroundColor Yellow

# Simple Redis check
$redisOk = $false
try {
    $testConnection = Test-NetConnection -ComputerName 127.0.0.1 -Port 6379 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($testConnection.TcpTestSucceeded) {
        Write-Host "OK - Redis is running on port 6379" -ForegroundColor Green
        $redisOk = $true
    } else {
        Write-Host "ERROR - Redis not running on port 6379!" -ForegroundColor Red
        Write-Host "Install: See REDIS_SETUP_WINDOWS.md" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR - Could not check Redis!" -ForegroundColor Red
}

if (-not $redisOk) {
    Write-Host ""
    Write-Host "Redis is required for video processing!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting services in new windows..." -ForegroundColor Yellow
Write-Host ""

# Start backend
Write-Host "1. Backend Server (port 5000)" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'Backend Server' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 2

# Start HLS worker
Write-Host "2. HLS Worker" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'HLS Worker' -ForegroundColor Green; node backend/hlsWorker.js"

Start-Sleep -Seconds 2

# Start frontend
Write-Host "3. Frontend (port 3000)" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\client'; Write-Host 'Frontend - React App' -ForegroundColor Green; npm start"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "3 new PowerShell windows opened" -ForegroundColor White
Write-Host ""
Write-Host "Wait 30 seconds, then visit:" -ForegroundColor Yellow
Write-Host "  http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
