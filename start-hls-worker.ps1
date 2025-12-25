# Start HLS Worker with GPU Acceleration
# This script starts the local video processing worker

Write-Host "🎬 Starting HLS Worker with GPU Acceleration..." -ForegroundColor Cyan
Write-Host ""

# Check if Redis is running
Write-Host "Checking Redis..." -ForegroundColor Yellow
try {
    $redisTest = redis-cli ping 2>&1
    if ($redisTest -eq "PONG") {
        Write-Host "✅ Redis is running" -ForegroundColor Green
    } else {
        Write-Host "❌ Redis is not responding" -ForegroundColor Red
        Write-Host "Please start Redis first: redis-server" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Redis is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Install Redis: choco install redis-64" -ForegroundColor Yellow
    exit 1
}

# Check if MongoDB is running
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
try {
    $mongoTest = mongosh --eval "db.version()" --quiet 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MongoDB is running" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not verify MongoDB status" -ForegroundColor Yellow
    Write-Host "Make sure MongoDB is running" -ForegroundColor Yellow
}

# Check NVIDIA GPU
Write-Host "Checking GPU..." -ForegroundColor Yellow
try {
    $gpuInfo = nvidia-smi --query-gpu=name --format=csv,noheader 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ GPU detected: $gpuInfo" -ForegroundColor Green
    } else {
        Write-Host "⚠️  GPU not detected - will use CPU encoding" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  nvidia-smi not found - GPU may not be available" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HLS Worker Starting..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start the worker
node backend/hlsWorker.js
