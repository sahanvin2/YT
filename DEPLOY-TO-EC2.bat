@echo off
echo ========================================
echo   Deploying Movia to EC2 Server
echo ========================================
echo.

set EC2_HOST=ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com
set KEY_FILE=movia.pem

echo 📤 Uploading deployment script to EC2...
scp -i %KEY_FILE% deploy-to-ec2-now.sh %EC2_HOST%:~/

echo.
echo 🔑 Connecting to EC2 and deploying...
echo.

ssh -i %KEY_FILE% %EC2_HOST% "chmod +x ~/deploy-to-ec2-now.sh && ~/deploy-to-ec2-now.sh"

echo.
echo ========================================
echo   Deployment Process Complete
echo ========================================
echo.
echo 🌐 Your site should be live at:
echo    http://ec2-3-238-106-222.compute-1.amazonaws.com:3000
echo.
echo 📊 To check status, run:
echo    ssh -i %KEY_FILE% %EC2_HOST% "pm2 status"
echo.
pause
