@echo off
echo ========================================
echo   COMPLETE EC2 RECOVERY AFTER REBOOT
echo ========================================
echo.
echo Waiting 180 seconds for EC2 to fully boot...
timeout /t 180 /nobreak
echo.

:CONNECT
echo Testing connection...
ssh -o ConnectTimeout=5 -i "C:\Users\User\Downloads\movia.pem" ubuntu@3.238.106.222 "echo OK" 2>nul
if errorlevel 1 (
    echo Still booting, waiting 15 more seconds...
    timeout /t 15 /nobreak >nul
    goto CONNECT
)

echo.
echo ========================================
echo   CONNECTED! Starting Recovery...
echo ========================================
echo.

echo [1] Stopping video processing to prevent crash...
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@3.238.106.222 "pkill -9 -f ffmpeg; pkill -9 -f videoTranscoder; echo 'Stopped video processing'"

echo.
echo [2] Configuring to use worker EC2...
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@3.238.106.222 "cd /home/ubuntu/YT/backend && echo 'REDIS_HOST=172.30.5.116' >> .env && echo 'REDIS_PORT=6379' >> .env && echo 'VIDEO_PROCESSING_ENABLED=false' >> .env && echo 'Config updated'"

echo.
echo [3] Restarting services...
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@3.238.106.222 "sudo systemctl restart nginx && cd /home/ubuntu/YT/backend && pm2 restart all"

timeout /t 5 /nobreak >nul

echo.
echo [4] Uploading new client...
scp -i "C:\Users\User\Downloads\movia.pem" -r client\src ubuntu@3.238.106.222:/home/ubuntu/YT/client/

echo.
echo [5] Rebuilding client...
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@3.238.106.222 "cd /home/ubuntu/YT/client && sudo rm -rf build && npm run build && sudo systemctl reload nginx"

echo.
echo ========================================
echo   TESTING WEBSITE
echo ========================================
timeout /t 5 /nobreak >nul
curl -I https://xclub.asia 2>nul | findstr "HTTP"

echo.
echo ========================================
echo   DONE! Website should be working now
echo ========================================
echo.
echo Website: https://xclub.asia
echo.
echo IMPORTANT: Videos will now process on worker EC2
echo No more crashes from video uploads!
echo.
pause
