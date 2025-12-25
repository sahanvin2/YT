# Stop All Movia Services

Write-Host "========================================" -ForegroundColor Red
Write-Host "  STOPPING ALL MOVIA SERVICES" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Stop all Node.js jobs
Write-Host "Stopping Node.js services..." -ForegroundColor Yellow
Get-Job | Where-Object { $_.State -eq "Running" } | ForEach-Object {
    Stop-Job -Job $_
    Remove-Job -Job $_
    Write-Host "  ✓ Stopped Job ID: $($_.Id)" -ForegroundColor Gray
}

# Stop Redis (if started by script)
Write-Host ""
Write-Host "Stopping Redis..." -ForegroundColor Yellow
$redisProcesses = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
if ($redisProcesses) {
    $redisProcesses | Stop-Process -Force
    Write-Host "  ✓ Redis stopped" -ForegroundColor Gray
} else {
    Write-Host "  • Redis not running" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ ALL SERVICES STOPPED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
