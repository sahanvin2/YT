# Setup Redis and HLS Worker as Windows Service
# Run this script as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  WINDOWS SERVICE SETUP" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "Then run this script again" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Install NSSM (Non-Sucking Service Manager) if not present
Write-Host "Checking for NSSM..." -ForegroundColor Yellow
$nssmPath = "C:\nssm\nssm.exe"

if (-not (Test-Path $nssmPath)) {
    Write-Host "Installing NSSM..." -ForegroundColor Yellow
    
    # Try to install via Chocolatey
    try {
        choco install nssm -y
        Write-Host "✅ NSSM installed via Chocolatey" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Chocolatey not available" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please install NSSM manually:" -ForegroundColor Yellow
        Write-Host "1. Download from: https://nssm.cc/download" -ForegroundColor White
        Write-Host "2. Extract to C:\nssm\" -ForegroundColor White
        Write-Host "3. Run this script again" -ForegroundColor White
        exit 1
    }
}

Write-Host "✅ NSSM is available" -ForegroundColor Green
Write-Host ""

$projectPath = $PSScriptRoot
$nodePath = (Get-Command node).Source

Write-Host "Project Path: $projectPath" -ForegroundColor Gray
Write-Host "Node.js Path: $nodePath" -ForegroundColor Gray
Write-Host ""

# Setup Redis Service
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting up Redis Service..." -ForegroundColor Yellow

$redisPath = (Get-Command redis-server -ErrorAction SilentlyContinue).Source
if ($redisPath) {
    # Check if service already exists
    $redisService = Get-Service -Name "Movia-Redis" -ErrorAction SilentlyContinue
    if ($redisService) {
        Write-Host "  Service already exists, removing..." -ForegroundColor Gray
        Stop-Service -Name "Movia-Redis" -Force -ErrorAction SilentlyContinue
        & nssm remove "Movia-Redis" confirm
    }
    
    # Install service
    & nssm install "Movia-Redis" $redisPath
    & nssm set "Movia-Redis" DisplayName "Movia Video Platform - Redis"
    & nssm set "Movia-Redis" Description "Redis queue for Movia video processing"
    & nssm set "Movia-Redis" Start SERVICE_AUTO_START
    
    # Start service
    Start-Service -Name "Movia-Redis"
    Write-Host "✅ Redis service installed and started" -ForegroundColor Green
} else {
    Write-Host "⚠️  Redis not found. Please install: choco install redis-64" -ForegroundColor Yellow
}

Write-Host ""

# Setup HLS Worker Service
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting up HLS Worker Service..." -ForegroundColor Yellow

$hlsService = Get-Service -Name "Movia-HLS-Worker" -ErrorAction SilentlyContinue
if ($hlsService) {
    Write-Host "  Service already exists, removing..." -ForegroundColor Gray
    Stop-Service -Name "Movia-HLS-Worker" -Force -ErrorAction SilentlyContinue
    & nssm remove "Movia-HLS-Worker" confirm
}

# Install service
& nssm install "Movia-HLS-Worker" $nodePath "$projectPath\backend\hlsWorker.js"
& nssm set "Movia-HLS-Worker" AppDirectory $projectPath
& nssm set "Movia-HLS-Worker" DisplayName "Movia Video Platform - HLS Worker"
& nssm set "Movia-HLS-Worker" Description "GPU-accelerated video processing worker"
& nssm set "Movia-HLS-Worker" Start SERVICE_AUTO_START
& nssm set "Movia-HLS-Worker" AppStdout "$projectPath\logs\hls-worker.log"
& nssm set "Movia-HLS-Worker" AppStderr "$projectPath\logs\hls-worker-error.log"

# Create logs directory
New-Item -ItemType Directory -Path "$projectPath\logs" -Force | Out-Null

# Start service
Start-Service -Name "Movia-HLS-Worker"
Write-Host "✅ HLS Worker service installed and started" -ForegroundColor Green

Write-Host ""

# Setup Main Server Service
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting up Main Server Service..." -ForegroundColor Yellow

$serverService = Get-Service -Name "Movia-Server" -ErrorAction SilentlyContinue
if ($serverService) {
    Write-Host "  Service already exists, removing..." -ForegroundColor Gray
    Stop-Service -Name "Movia-Server" -Force -ErrorAction SilentlyContinue
    & nssm remove "Movia-Server" confirm
}

# Install service
& nssm install "Movia-Server" $nodePath "$projectPath\backend\server.js"
& nssm set "Movia-Server" AppDirectory $projectPath
& nssm set "Movia-Server" DisplayName "Movia Video Platform - Main Server"
& nssm set "Movia-Server" Description "Main API server for Movia video platform"
& nssm set "Movia-Server" Start SERVICE_AUTO_START
& nssm set "Movia-Server" AppStdout "$projectPath\logs\server.log"
& nssm set "Movia-Server" AppStderr "$projectPath\logs\server-error.log"

# Start service
Start-Service -Name "Movia-Server"
Write-Host "✅ Main Server service installed and started" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ WINDOWS SERVICES INSTALLED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services installed:" -ForegroundColor White
Write-Host "  • Movia-Redis       (Auto-start on boot)" -ForegroundColor Gray
Write-Host "  • Movia-HLS-Worker  (Auto-start on boot)" -ForegroundColor Gray
Write-Host "  • Movia-Server      (Auto-start on boot)" -ForegroundColor Gray
Write-Host ""
Write-Host "These services will now start automatically when Windows boots!" -ForegroundColor Cyan
Write-Host ""
Write-Host "To manage services:" -ForegroundColor Yellow
Write-Host "  • View status:  services.msc" -ForegroundColor Gray
Write-Host "  • Stop all:     Stop-Service Movia-*" -ForegroundColor Gray
Write-Host "  • Start all:    Start-Service Movia-*" -ForegroundColor Gray
Write-Host "  • View logs:    Get-Content logs\*.log -Tail 50" -ForegroundColor Gray
Write-Host ""
Write-Host "Server is ready at: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
