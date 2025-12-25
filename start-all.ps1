# Automated Startup Script for Movia Video Platform
# This script starts all required services automatically

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MOVIA VIDEO PLATFORM - AUTO START" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a process is running
function Test-ProcessRunning {
    param([string]$ProcessName)
    return (Get-Process -Name $ProcessName -ErrorAction SilentlyContinue) -ne $null
}

# Function to start a service in background
function Start-BackgroundService {
    param(
        [string]$Name,
        [string]$Command,
        [string]$WorkingDir = $PSScriptRoot
    )
    
    Write-Host "Starting $Name..." -ForegroundColor Yellow
    
    $job = Start-Job -ScriptBlock {
        param($cmd, $dir)
        Set-Location $dir
        Invoke-Expression $cmd
    } -ArgumentList $Command, $WorkingDir
    
    Start-Sleep -Seconds 2
    
    if ($job.State -eq "Running") {
        Write-Host "✅ $Name started successfully (Job ID: $($job.Id))" -ForegroundColor Green
        return $job
    } else {
        Write-Host "❌ $Name failed to start" -ForegroundColor Red
        return $null
    }
}

# Check Redis
Write-Host ""
Write-Host "Checking Redis..." -ForegroundColor Yellow
if (Test-ProcessRunning -ProcessName "redis-server") {
    Write-Host "✅ Redis is already running" -ForegroundColor Green
} else {
    Write-Host "Starting Redis..." -ForegroundColor Yellow
    try {
        Start-Process -FilePath "redis-server" -WindowStyle Hidden
        Start-Sleep -Seconds 2
        
        $redisTest = redis-cli ping 2>&1
        if ($redisTest -eq "PONG") {
            Write-Host "✅ Redis started successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Redis failed to start" -ForegroundColor Red
            Write-Host "Please install Redis: choco install redis-64" -ForegroundColor Yellow
            exit 1
        }
    } catch {
        Write-Host "❌ Redis not found. Install with: choco install redis-64" -ForegroundColor Red
        exit 1
    }
}

# Check MongoDB
Write-Host ""
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
if (Test-ProcessRunning -ProcessName "mongod") {
    Write-Host "✅ MongoDB is already running" -ForegroundColor Green
} else {
    Write-Host "⚠️  MongoDB not detected as running" -ForegroundColor Yellow
    Write-Host "   If MongoDB is a Windows service, this is normal" -ForegroundColor Gray
    Write-Host "   If not, please start MongoDB manually" -ForegroundColor Yellow
}

# Check GPU
Write-Host ""
Write-Host "Checking GPU..." -ForegroundColor Yellow
try {
    $gpuInfo = nvidia-smi --query-gpu=name --format=csv,noheader 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ GPU detected: $gpuInfo" -ForegroundColor Green
    } else {
        Write-Host "⚠️  GPU not detected - will use CPU encoding (slower)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  nvidia-smi not found - GPU encoding may not work" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  STARTING SERVICES" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start HLS Worker in background
$hlsWorkerJob = Start-BackgroundService -Name "HLS Worker" -Command "node backend/hlsWorker.js"

# Wait a moment for worker to initialize
Start-Sleep -Seconds 3

# Start Main Server in background
$serverJob = Start-BackgroundService -Name "Main Server" -Command "node backend/server.js"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ ALL SERVICES STARTED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services running:" -ForegroundColor White
Write-Host "  • Redis:      Running in background" -ForegroundColor Gray
Write-Host "  • HLS Worker: Job ID $($hlsWorkerJob.Id)" -ForegroundColor Gray
Write-Host "  • Main Server: Job ID $($serverJob.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "Server is ready at: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Yellow
Write-Host "  • HLS Worker: Get-Job $($hlsWorkerJob.Id) | Receive-Job -Keep" -ForegroundColor Gray
Write-Host "  • Main Server: Get-Job $($serverJob.Id) | Receive-Job -Keep" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop all services:" -ForegroundColor Yellow
Write-Host "  • Run: .\stop-all.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to view live logs (services continue in background)" -ForegroundColor Yellow
Write-Host ""

# Keep script alive and show logs
try {
    while ($true) {
        Start-Sleep -Seconds 5
        
        # Check if jobs are still running
        if ($hlsWorkerJob.State -ne "Running") {
            Write-Host "⚠️  HLS Worker stopped unexpectedly!" -ForegroundColor Red
            Receive-Job -Job $hlsWorkerJob
        }
        if ($serverJob.State -ne "Running") {
            Write-Host "⚠️  Main Server stopped unexpectedly!" -ForegroundColor Red
            Receive-Job -Job $serverJob
        }
    }
} finally {
    Write-Host ""
    Write-Host "Services are still running in background" -ForegroundColor Yellow
    Write-Host "To stop them, run: .\stop-all.ps1" -ForegroundColor Yellow
}
