#!/usr/bin/env pwsh
# Quick service health check

Write-Host "`n🔍 SERVICE HEALTH CHECK" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# Redis
Write-Host "`n1. Redis (WSL):" -ForegroundColor Yellow
$redis = wsl redis-cli ping 2>$null
if ($redis -eq "PONG") {
    Write-Host "   ✅ RUNNING" -ForegroundColor Green
} else {
    Write-Host "   ❌ NOT RUNNING - Start with: wsl sudo service redis-server start" -ForegroundColor Red
}

# Backend (Port 5000)
Write-Host "`n2. Backend Server (Port 5000):" -ForegroundColor Yellow
$backend = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($backend) {
    Write-Host "   ✅ RUNNING (PID: $($backend[0].OwningProcess))" -ForegroundColor Green
} else {
    Write-Host "   ❌ NOT RUNNING - Start with: npm start" -ForegroundColor Red
}

# Frontend (Port 3000)
Write-Host "`n3. Frontend (Port 3000):" -ForegroundColor Yellow
$frontend = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($frontend) {
    Write-Host "   ✅ RUNNING (PID: $($frontend[0].OwningProcess))" -ForegroundColor Green
} else {
    Write-Host "   ❌ NOT RUNNING - Start with: cd client; npm start" -ForegroundColor Red
}

# HLS Worker (check by process name)
Write-Host "`n4. HLS Worker:" -ForegroundColor Yellow
$worker = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
    $cmd -like "*hlsWorker*"
}
if ($worker) {
    Write-Host "   ✅ RUNNING (PID: $($worker.Id))" -ForegroundColor Green
} else {
    Write-Host "   ❌ NOT RUNNING - Start with: npm run hls-worker" -ForegroundColor Red
}

# Queue Status
Write-Host "`n5. Video Queue:" -ForegroundColor Yellow
if ($redis -eq "PONG") {
    $waiting = wsl redis-cli LLEN bullmq:hls-processing:wait
    $active = wsl redis-cli LLEN bullmq:hls-processing:active
    $failed = wsl redis-cli LLEN bullmq:hls-processing:failed
    Write-Host "   📦 Waiting: $waiting" -ForegroundColor White
    Write-Host "   ⚡ Active: $active" -ForegroundColor White
    Write-Host "   ❌ Failed: $failed" -ForegroundColor White
} else {
    Write-Host "   ⚠️  Redis not available" -ForegroundColor Yellow
}

Write-Host "`n" -ForegroundColor White
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "💡 To start all services: .\start-all-services.ps1" -ForegroundColor Yellow
Write-Host "`n"
