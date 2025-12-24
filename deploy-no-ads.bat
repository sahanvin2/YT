@echo off
echo ========================================
echo DEPLOYING NO-ADS VERSION TO EC2
echo ========================================
echo.

REM Pull latest code from GitHub
echo [1/3] Pulling latest code from GitHub...
ssh -i "movia.pem" ubuntu@3.238.106.222 "cd ~/YT && git pull origin main"
if errorlevel 1 (
    echo ERROR: Failed to pull from GitHub
    pause
    exit /b 1
)
echo.

REM Build client
echo [2/3] Building React client...
ssh -i "movia.pem" ubuntu@3.238.106.222 "cd ~/YT/client && npm run build"
if errorlevel 1 (
    echo ERROR: Failed to build client
    pause
    exit /b 1
)
echo.

REM Restart backend (optional)
echo [3/3] Restarting backend (optional)...
ssh -i "movia.pem" ubuntu@3.238.106.222 "pm2 restart backend"
echo.

echo ========================================
echo DEPLOYMENT COMPLETE! 
echo All ads are now DISABLED.
echo Site is optimized for high traffic.
echo ========================================
pause
