@echo off
echo.
echo ========================================
echo  STARTING ALL SERVICES
echo ========================================
echo.

REM Start backend server (Terminal 1)
echo [1/3] Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0 && npm run server"
timeout /t 5 /nobreak > nul

REM Start HLS Worker (Terminal 2)
echo [2/3] Starting HLS Worker...
start "HLS Worker" cmd /k "cd /d %~dp0 && npm run hls-worker"
timeout /t 3 /nobreak > nul

REM Start Frontend (Terminal 3)
echo [3/3] Starting Frontend...
start "Frontend" cmd /k "cd /d %~dp0 && npm run client"

echo.
echo ========================================
echo  ALL SERVICES STARTING!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo HLS Worker: Running in background
echo.
echo Press any key to close this window...
pause > nul
