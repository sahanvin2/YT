# PowerShell Script for EC2 Deployment
# This script will deploy the latest changes to your EC2 instance

param(
    [string]$SSHKey = "$env:USERPROFILE\.ssh\id_rsa",
    [string]$EC2User = "ec2-user",
    [string]$EC2IP = "3.238.106.222",
    [string]$AppPath = "/home/ec2-user/Movia"
)

Write-Host "🚀 Starting EC2 Deployment..." -ForegroundColor Cyan
Write-Host ""

# Check if SSH key exists
if (-not (Test-Path $SSHKey)) {
    Write-Host "❌ SSH key not found at: $SSHKey" -ForegroundColor Red
    Write-Host "Please update the SSHKey parameter or place your key at the default location" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ SSH key found" -ForegroundColor Green
Write-Host "📦 Building frontend..." -ForegroundColor Cyan

# Build frontend
Set-Location client
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed" -ForegroundColor Red
    exit 1
}

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host "✅ Frontend built successfully" -ForegroundColor Green
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Cyan

# Commit and push (if there are changes)
git add .
$commitMessage = "Deploy: Update category images and latest changes"
git commit -m $commitMessage 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    git push origin main
    Write-Host "✅ Pushed to GitHub" -ForegroundColor Green
} else {
    Write-Host "⚠️  No changes to commit" -ForegroundColor Yellow
}

Write-Host "🌐 Deploying to EC2..." -ForegroundColor Cyan
Write-Host ""

# Create deployment commands
$deployCommands = @"
cd $AppPath
echo '📥 Pulling latest changes from GitHub...'
git pull origin main || git pull origin master

echo '📦 Installing dependencies...'
cd client
npm install
npm run build
cd ..
npm install

echo '🔄 Restarting application...'
if command -v pm2 &> /dev/null; then
    pm2 restart all || pm2 start ecosystem.config.js
elif systemctl is-active --quiet movia; then
    sudo systemctl restart movia
else
    echo '⚠️  Please restart your application manually'
fi

echo '✅ Deployment complete on EC2!'
"@

# Execute on EC2
Write-Host "Connecting to EC2 instance..." -ForegroundColor Cyan
ssh -i $SSHKey -o StrictHostKeyChecking=no ${EC2User}@${EC2IP} $deployCommands

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Please check the error messages above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual deployment steps:" -ForegroundColor Yellow
    Write-Host "1. SSH into EC2: ssh -i $SSHKey ${EC2User}@${EC2IP}"
    Write-Host "2. cd $AppPath"
    Write-Host "3. git pull origin main"
    Write-Host "4. cd client && npm install && npm run build"
    Write-Host "5. cd .. && npm install"
    Write-Host "6. pm2 restart all (or your process manager)"
}
