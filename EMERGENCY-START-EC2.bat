@echo off
echo.
echo ========================================
echo   EMERGENCY EC2 WEBSITE RECOVERY
echo ========================================
echo.
echo YOUR EC2 INSTANCE IS DOWN!
echo.
echo STEP 1: START EC2 FROM AWS CONSOLE
echo ----------------------------------------
echo 1. Go to: https://console.aws.amazon.com/ec2/
echo 2. Find instance: i-0721468aa96aa327c
echo 3. If STOPPED: Click "Instance state" -^> "Start instance"
echo 4. If RUNNING: Click "Instance state" -^> "Reboot instance"
echo 5. Wait 2-3 minutes
echo.
pause
echo.
echo STEP 2: WAITING FOR EC2 TO BOOT...
echo ----------------------------------------
timeout /t 90 /nobreak
echo.

echo STEP 3: TESTING CONNECTION...
echo ----------------------------------------
:RETRY
set /a attempts+=1
if %attempts% GTR 20 (
    echo FAILED: Cannot connect after 20 attempts
    echo Please check AWS Console if instance is running
    pause
    exit /b 1
)

echo Attempt %attempts%/20...
ssh -o ConnectTimeout=5 -i "C:\Users\User\Downloads\movia.pem" ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com "echo OK" 2>nul
if errorlevel 1 (
    timeout /t 10 /nobreak >nul
    goto RETRY
)

echo SUCCESS: Connected!
echo.

echo STEP 4: RESTARTING SERVICES...
echo ----------------------------------------
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com "sudo systemctl restart nginx && echo 'Nginx restarted' && cd /home/ubuntu/YT/backend && pm2 restart all && echo 'PM2 restarted' && pm2 list"
echo.

echo STEP 5: UPLOADING NEW CLIENT...
echo ----------------------------------------
scp -i "C:\Users\User\Downloads\movia.pem" -r client\src ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com:/home/ubuntu/YT/client/
echo.

echo STEP 6: REBUILDING CLIENT...
echo ----------------------------------------
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com "cd /home/ubuntu/YT/client && sudo rm -rf build && npm run build 2>&1 | tail -15 && sudo systemctl reload nginx"
echo.

echo STEP 7: TESTING WEBSITE...
echo ----------------------------------------
timeout /t 5 /nobreak >nul
curl -I https://xclub.asia 2>nul | findstr "200"
if errorlevel 1 (
    echo WARNING: Website may still be loading...
) else (
    echo SUCCESS: Website is ONLINE!
)
echo.

echo ========================================
echo   RECOVERY COMPLETE!
echo ========================================
echo.
echo Website: https://xclub.asia
echo.
echo Monitor with:
echo   ssh ubuntu@ec2-3-238-106-222 "pm2 logs"
echo.
pause
