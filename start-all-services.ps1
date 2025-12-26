#!/usr/bin/env pwsh
# Complete service startup script - prevents the service loop issue

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🚀 MOVIA - Starting All Services" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if port is in use
function Test-Port {
    param($Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $connection
}

# Function to kill process on port
function Stop-ProcessOnPort {
    param($Port, $ServiceName)
    if (Test-Port -Port $Port) {
        Write-Host "⚠️  Port $Port is in use, stopping $ServiceName..." -ForegroundColor Yellow
        Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
            ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Seconds 2
        Write-Host "✅ Port $Port cleared" -ForegroundColor Green
    }
}

# Function to start service in new terminal
function Start-ServiceInTerminal {
    param($Title, $Command, $Path)
    Write-Host "🔄 Starting $Title..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Path'; Write-Host '🚀 $Title' -ForegroundColor Green; $Command" -WindowStyle Normal
    Start-Sleep -Seconds 3
}

# Step 1: Check Redis (WSL)
Write-Host "1️⃣  Checking Redis..." -ForegroundColor Yellow
$redisCheck = wsl redis-cli ping 2>$null
if ($redisCheck -ne "PONG") {
    Write-Host "❌ Redis not running! Starting Redis in WSL..." -ForegroundColor Red
    Write-Host "   Run this command manually: wsl sudo service redis-server start" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter after starting Redis"
} else {
    Write-Host "✅ Redis is running" -ForegroundColor Green
}
Write-Host ""

# Step 2: Clean up any stuck processes
Write-Host "2️⃣  Cleaning up stuck processes..." -ForegroundColor Yellow
Stop-ProcessOnPort -Port 5000 -ServiceName "Backend Server"
Stop-ProcessOnPort -Port 3000 -ServiceName "Frontend"
Write-Host ""

# Step 3: Start Backend Server
Write-Host "3️⃣  Starting Backend Server (Port 5000)..." -ForegroundColor Yellow
Start-ServiceInTerminal -Title "Backend Server" -Command "npm start" -Path "D:\MERN\Movia"
Write-Host "✅ Backend Server started" -ForegroundColor Green
Write-Host ""

# Step 4: Start HLS Worker
Write-Host "4️⃣  Starting HLS Worker (GPU Processing)..." -ForegroundColor Yellow
Start-ServiceInTerminal -Title "HLS Worker" -Command "npm run hls-worker" -Path "D:\MERN\Movia"
Write-Host "✅ HLS Worker started" -ForegroundColor Green
Write-Host ""

# Step 5: Start Frontend
Write-Host "5️⃣  Starting Frontend (Port 3000)..." -ForegroundColor Yellow
Start-ServiceInTerminal -Title "Frontend" -Command "npm start" -Path "D:\MERN\Movia\client"
Write-Host "✅ Frontend started" -ForegroundColor Green
Write-Host ""

# Final status check
Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host ""

Write-Host "================================================" -ForegroundColor Green
Write-Host "✨ SERVICE STATUS CHECK" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Check each service
if (Test-Port -Port 5000) {
    Write-Host "✅ Backend Server: Running on port 5000" -ForegroundColor Green
} else {
    Write-Host "❌ Backend Server: NOT RUNNING" -ForegroundColor Red
}

if (Test-Port -Port 3000) {
    Write-Host "✅ Frontend: Running on port 3000" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend: NOT RUNNING" -ForegroundColor Red
}

$redisCheck = wsl redis-cli ping 2>$null
if ($redisCheck -eq "PONG") {
    Write-Host "✅ Redis: Running (WSL)" -ForegroundColor Green
} else {
    Write-Host "❌ Redis: NOT RUNNING" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🎉 ACCESS YOUR APPLICATION" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🌐 Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "🔧 Backend:   http://localhost:5000" -ForegroundColor White
Write-Host "📊 API Test:  http://localhost:5000/api/videos" -ForegroundColor White
Write-Host ""
Write-Host "💡 TIP: Each service runs in its own terminal window" -ForegroundColor Yellow
Write-Host "💡 TIP: Close this window but keep service windows open" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this startup script..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
