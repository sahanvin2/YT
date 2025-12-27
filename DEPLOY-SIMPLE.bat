@echo off
echo ========================================
echo   Deploying to EC2 (No GPU Tasks)
echo ========================================
echo.

set EC2_HOST=ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com
set PEM_FILE=movia.pem

echo 1. Connecting to EC2...
echo.

ssh -i %PEM_FILE% %EC2_HOST% "cd /home/ubuntu/movia && git pull origin main && npm install && pm2 restart backend || npm install && npm run build && pm2 restart backend"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   Deployment Complete!
    echo ========================================
    echo.
    echo Backend updated successfully
    echo Website: http://ec2-3-238-106-222.compute-1.amazonaws.com
    echo.
) else (
    echo.
    echo ========================================
    echo   Deployment Failed!
    echo ========================================
    echo.
    echo Check your SSH connection and try again
    echo.
)

pause
