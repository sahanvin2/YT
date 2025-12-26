@echo off
cls
echo.
echo ========================================
echo   MOVIA - Starting Your Video Site
echo ========================================
echo.

REM Kill any old processes first
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Start Redis if not running
C:\Redis\redis-cli.exe ping >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting Redis...
    start "Redis" /MIN C:\Redis\redis-server.exe C:\Redis\redis.conf
    timeout /t 3 /nobreak >nul
)

REM Wait for Redis
:WAIT_REDIS
C:\Redis\redis-cli.exe ping >nul 2>&1
if %errorlevel% neq 0 (
    echo Waiting for Redis...
    timeout /t 1 /nobreak >nul
    goto WAIT_REDIS
)
echo [OK] Redis running

REM Start Backend
echo [OK] Starting Backend...
start "Movia Backend" cmd /k "cd /d D:\MERN\Movia && npm start"
timeout /t 10 /nobreak >nul

REM Start HLS Worker
echo [OK] Starting HLS Worker...
start "Movia HLS Worker" cmd /k "cd /d D:\MERN\Movia && npm run hls-worker"
timeout /t 5 /nobreak >nul

REM Start Frontend
echo [OK] Starting Frontend...
start "Movia Frontend" cmd /k "cd /d D:\MERN\Movia\client && npm start"
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   ALL SERVICES STARTED!
echo ========================================
echo.
echo Your site: http://localhost:3000
echo.
echo You will see 3 windows:
echo   1. Movia Backend
echo   2. Movia HLS Worker (shows encoding)
echo   3. Movia Frontend
echo.
echo Redis runs minimized in background.
echo.
echo DO NOT CLOSE THE 3 WINDOWS!
echo.
echo Press any key to open your site...
pause >nul
start http://localhost:3000
