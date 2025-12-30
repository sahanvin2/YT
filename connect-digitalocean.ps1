# Simple script to connect to Digital Ocean droplet
# This will prompt for password interactively

$dropletIP = "134.209.105.201"
$password = "@20040301Sa"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Connecting to Digital Ocean Droplet" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IP: $dropletIP" -ForegroundColor Yellow
Write-Host "Password: $password" -ForegroundColor Yellow
Write-Host ""
Write-Host "Once connected, run these commands:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Update system:" -ForegroundColor White
Write-Host "   apt-get update -y && apt-get upgrade -y" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Download and run deployment script:" -ForegroundColor White
Write-Host "   cd /root" -ForegroundColor Gray
Write-Host "   wget https://raw.githubusercontent.com/sahanvin2/YT/main/deploy-digitalocean.sh" -ForegroundColor Gray
Write-Host "   chmod +x deploy-digitalocean.sh" -ForegroundColor Gray
Write-Host "   bash deploy-digitalocean.sh" -ForegroundColor Gray
Write-Host ""
Write-Host "3. After deployment, configure .env:" -ForegroundColor White
Write-Host "   nano /root/YT/.env" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Restart backend:" -ForegroundColor White
Write-Host "   pm2 restart backend" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Enter to connect..." -ForegroundColor Yellow
Read-Host

# Try to connect using SSH
ssh root@$dropletIP

