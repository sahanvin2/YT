@echo off
echo ==========================================
echo DISABLING VIDEO PROCESSING ON EC2
echo ==========================================
echo.

REM Pull latest code with disabled processing
echo [1/3] Pulling latest code from GitHub...
ssh -i "movia.pem" ubuntu@3.238.106.222 "cd ~/YT && git pull origin main"
if errorlevel 1 (
    echo ERROR: Failed to pull from GitHub
    pause
    exit /b 1
)
echo.

REM Stop worker processes to free up CPU/RAM
echo [2/3] Stopping video processing workers...
ssh -i "movia.pem" ubuntu@3.238.106.222 "pm2 delete workerServer 2>/dev/null; pm2 delete videoWorker 2>/dev/null; echo Workers stopped"
echo.

REM Restart backend with disabled processing
echo [3/3] Restarting backend...
ssh -i "movia.pem" ubuntu@3.238.106.222 "pm2 restart backend && pm2 status"
echo.

echo ==========================================
echo VIDEO PROCESSING DISABLED!
echo ==========================================
echo.
echo ✓ All new uploads go directly to storage
echo ✓ No transcoding = much lower CPU/RAM usage
echo ✓ Worker processes stopped
echo.
echo To re-enable later, see RE-ENABLE-PROCESSING.md
echo.
pause
