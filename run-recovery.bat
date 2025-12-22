@echo off
REM EC2 Recovery Script - Run AFTER rebooting main EC2 from AWS Console
echo.
echo ========================================
echo   EC2 Recovery and Configuration
echo ========================================
echo.

cd /d D:\MERN\Movia

echo [1/7] Testing connection to main EC2...
ssh -o ConnectTimeout=10 -i "C:\Users\User\Downloads\movia.pem" ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com "echo Connected successfully" 2>nul
if errorlevel 1 (
    echo ERROR: Cannot connect to main EC2
    echo Please reboot the instance from AWS Console first
    pause
    exit /b 1
)
echo SUCCESS: Connected to main EC2
echo.

echo [2/7] Killing stuck video processing...
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com "pkill -9 -f ffmpeg 2>/dev/null; pkill -9 -f videoTranscoder 2>/dev/null; echo Processes cleared"
echo.

echo [3/7] Configuring worker Redis connection...
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com "cd /home/ubuntu/YT/backend && cp .env .env.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2% 2>/dev/null; echo '' >> .env; echo 'REDIS_HOST=172.30.5.116' >> .env; echo 'REDIS_PORT=6379' >> .env; echo 'USE_WORKER_QUEUE=true' >> .env; echo 'VIDEO_PROCESSING_ENABLED=false' >> .env; echo Redis configuration added"
echo.

echo [4/7] Restarting backend...
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com "cd /home/ubuntu/YT/backend && pm2 restart all"
timeout /t 3 /nobreak >nul
echo.

echo [5/7] Uploading new client with updated smartlink...
scp -i "C:\Users\User\Downloads\movia.pem" -r client\src ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com:/home/ubuntu/YT/client/
if errorlevel 1 (
    echo WARNING: Upload may have failed
) else (
    echo SUCCESS: Client uploaded
)
echo.

echo [6/7] Rebuilding client...
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com "cd /home/ubuntu/YT/client && sudo rm -rf build && npm run build 2>&1 | tail -20"
echo.

echo [7/7] Reloading Nginx...
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com "sudo nginx -t && sudo systemctl reload nginx"
echo.

echo ========================================
echo   RECOVERY COMPLETE!
echo ========================================
echo.
echo Website: https://xclub.asia
echo Worker EC2 Redis: 172.30.5.116:6379
echo.
echo Monitor with:
echo   ssh ubuntu@ec2-3-238-106-222 "pm2 logs"
echo   ssh ubuntu@ec2-3-227-1-7 "pm2 logs videoWorker"
echo.
pause
