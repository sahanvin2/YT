Write-Host "Deploying to EC2..." -ForegroundColor Cyan

$EC2_HOST = "ubuntu@13.211.161.39"
$PROJECT_DIR = "/home/ubuntu/YT"

Write-Host "Pulling latest code..." -ForegroundColor Yellow

ssh $EC2_HOST "cd $PROJECT_DIR && git pull origin main && npm install --production && cd client && npm install && npm run build && cd .. && pm2 restart backend && pm2 status"

Write-Host "Deployment complete!" -ForegroundColor Green
