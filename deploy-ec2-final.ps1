Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploying Movia to EC2" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$PEM_FILE = "movia.pem"
$EC2_HOST = "ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com"
$PROJECT_DIR = "/home/ubuntu/YT"

Write-Host ""
Write-Host "Step 1: Pull latest code from GitHub" -ForegroundColor Yellow
ssh -i $PEM_FILE $EC2_HOST "cd $PROJECT_DIR && git pull origin main"

Write-Host ""
Write-Host "Step 2: Install backend dependencies" -ForegroundColor Yellow
ssh -i $PEM_FILE $EC2_HOST "cd $PROJECT_DIR && npm install --production"

Write-Host ""
Write-Host "Step 3: Build React client" -ForegroundColor Yellow
ssh -i $PEM_FILE $EC2_HOST "cd $PROJECT_DIR/client && npm install && npm run build"

Write-Host ""
Write-Host "Step 4: Restart backend with PM2" -ForegroundColor Yellow
ssh -i $PEM_FILE $EC2_HOST "cd $PROJECT_DIR && pm2 restart backend"

Write-Host ""
Write-Host "Step 5: Check PM2 status" -ForegroundColor Yellow
ssh -i $PEM_FILE $EC2_HOST "pm2 status"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Visit your site to test:" -ForegroundColor Cyan
Write-Host "- Gear icon on video player" -ForegroundColor White
Write-Host "- Audio playback" -ForegroundColor White
Write-Host "- Video quality selection" -ForegroundColor White
Write-Host ""
