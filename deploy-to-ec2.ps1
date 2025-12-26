# Deploy Movia to EC2
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploying Movia to EC2" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$EC2_HOST = "ubuntu@13.211.161.39"
$PROJECT_DIR = "/home/ubuntu/YT"

Write-Host "`n📦 Step 1: Pulling latest code from GitHub..." -ForegroundColor Yellow

ssh $EC2_HOST @"
cd $PROJECT_DIR
echo '🔄 Pulling latest changes...'
git pull origin main

echo '📦 Installing backend dependencies...'
npm install --production

echo '🏗️  Building client...'
cd client
npm install
npm run build
cd ..

echo '🔄 Restarting backend with PM2...'
pm2 restart backend

echo '✅ Deployment complete!'
pm2 status
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Deployment Successful!" -ForegroundColor Green
    Write-Host "Visit: http://13.211.161.39" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Deployment Failed!" -ForegroundColor Red
    Write-Host "Check the error messages above." -ForegroundColor Yellow
}
