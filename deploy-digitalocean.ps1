# PowerShell script to deploy to Digital Ocean droplet
# This script uploads the deployment script and runs it

$dropletIP = "134.209.105.201"
$password = "@20040301Sa"
$scriptPath = "deploy-digitalocean.sh"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MOVIA - Digital Ocean Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if plink (PuTTY) is available
$plinkPath = "plink.exe"
if (-not (Get-Command $plinkPath -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  plink.exe not found. Installing PuTTY tools..." -ForegroundColor Yellow
    
    # Try to find plink in common locations
    $possiblePaths = @(
        "${env:ProgramFiles}\PuTTY\plink.exe",
        "${env:ProgramFiles(x86)}\PuTTY\plink.exe",
        "$env:LOCALAPPDATA\Programs\PuTTY\plink.exe"
    )
    
    $found = $false
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $plinkPath = $path
            $found = $true
            break
        }
    }
    
    if (-not $found) {
        Write-Host "❌ plink.exe not found. Please install PuTTY or use manual deployment." -ForegroundColor Red
        Write-Host "   Download from: https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Alternatively, you can manually:" -ForegroundColor Yellow
        Write-Host "1. Copy deploy-digitalocean.sh to the server" -ForegroundColor Yellow
        Write-Host "2. SSH to the server: ssh root@134.209.105.201" -ForegroundColor Yellow
        Write-Host "3. Run: bash deploy-digitalocean.sh" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "📤 Uploading deployment script..." -ForegroundColor Blue

# Use SCP to upload script (requires pscp from PuTTY)
$pscpPath = $plinkPath -replace "plink.exe", "pscp.exe"
if (Test-Path $pscpPath) {
    $env:SSH_PASSWORD = $password
    & $pscpPath -pw $password -o StrictHostKeyChecking=no $scriptPath "root@${dropletIP}:/root/deploy-digitalocean.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Script uploaded" -ForegroundColor Green
    } else {
        Write-Host "❌ Upload failed. Trying alternative method..." -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  pscp.exe not found. Will use plink to create script remotely..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Running deployment script on server..." -ForegroundColor Blue
Write-Host "   (This may take 10-15 minutes)" -ForegroundColor Yellow
Write-Host ""

# Create command to run on server
$deployCommand = @"
cd /root
if [ -f deploy-digitalocean.sh ]; then
    chmod +x deploy-digitalocean.sh
    bash deploy-digitalocean.sh
else
    echo 'Script not found. Creating inline...'
    bash -c '$(Get-Content $scriptPath -Raw -Encoding UTF8)'
fi
"@

# Run via plink
$env:SSH_PASSWORD = $password
& $plinkPath -ssh -pw $password -o StrictHostKeyChecking=no root@${dropletIP} $deployCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. SSH to server: ssh root@134.209.105.201" -ForegroundColor White
    Write-Host "2. Edit .env file: nano /root/YT/.env" -ForegroundColor White
    Write-Host "3. Restart backend: pm2 restart backend" -ForegroundColor White
    Write-Host "4. Visit: http://134.209.105.201" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "⚠️  Deployment may have encountered issues." -ForegroundColor Yellow
    Write-Host "   Please SSH manually and check:" -ForegroundColor Yellow
    Write-Host "   ssh root@134.209.105.201" -ForegroundColor White
    Write-Host "   pm2 status" -ForegroundColor White
    Write-Host "   pm2 logs backend" -ForegroundColor White
}

