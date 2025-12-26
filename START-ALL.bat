@echo off
echo ================================================
echo MOVIA - Starting All Services (Stable Mode)
echo ================================================
echo.

REM Check Redis
echo Checking Redis...
wsl redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Redis not running!
    echo Please run: wsl sudo service redis-server start
    pause
    exit /b 1
)
echo [OK] Redis is running
echo.

REM Start Backend Server in new window
echo Starting Backend Server...
start "Movia Backend" cmd /k "cd /d D:\MERN\Movia && npm start"
timeout /t 5 /nobreak >nul
echo [OK] Backend started
echo.

REM Start HLS Worker in new window  
echo Starting HLS Worker...
start "Movia HLS Worker" cmd /k "cd /d D:\MERN\Movia && npm run hls-worker"
timeout /t 5 /nobreak >nul
echo [OK] HLS Worker started
echo.

REM Start Frontend in new window
echo Starting Frontend...
start "Movia Frontend" cmd /k "cd /d D:\MERN\Movia\client && npm start"
timeout /t 5 /nobreak >nul
echo [OK] Frontend started
echo.

echo ================================================
echo ALL SERVICES STARTED!
echo ================================================
echo.
echo Services running in separate windows:
echo - Backend: Port 5000
echo - Frontend: Port 3000  
echo - HLS Worker: GPU Processing
echo.
echo Access: http://localhost:3000
echo.
echo DO NOT CLOSE the service windows!
echo You can close THIS window safely.
echo.
pause
