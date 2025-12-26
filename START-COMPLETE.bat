@echo off
echo ================================================
echo MOVIA - Complete Startup
echo ================================================
echo.

REM Check if Redis is running
C:\Redis\redis-cli.exe ping >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting Redis...
    start "Redis Server" /MIN C:\Redis\redis-server.exe C:\Redis\redis.conf
    timeout /t 5 /nobreak >nul
    echo [OK] Redis started
) else (
    echo [OK] Redis already running
)
echo.

REM Check Redis connection
C:\Redis\redis-cli.exe ping >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Redis not responding!
    pause
    exit /b 1
)
echo [OK] Redis connection verified
echo.

REM Start Backend Server
echo Starting Backend Server...
start "Movia Backend" cmd /k "cd /d D:\MERN\Movia && npm start"
timeout /t 8 /nobreak >nul
echo [OK] Backend started
echo.

REM Start HLS Worker
echo Starting HLS Worker...
start "Movia HLS Worker" cmd /k "cd /d D:\MERN\Movia && npm run hls-worker"
timeout /t 5 /nobreak >nul
echo [OK] HLS Worker started
echo.

REM Start Frontend
echo Starting Frontend...
start "Movia Frontend" cmd /k "cd /d D:\MERN\Movia\client && npm start"
timeout /t 5 /nobreak >nul
echo [OK] Frontend started
echo.

echo ================================================
echo ALL SERVICES STARTED!
echo ================================================
echo.
echo Services running:
echo - Redis: 127.0.0.1:6379 (Minimized)
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:3000
echo - HLS Worker: GPU Encoding Active
echo.
echo Access your site: http://localhost:3000
echo.
echo DO NOT CLOSE the service windows!
echo You can close THIS window safely.
echo.
pause
