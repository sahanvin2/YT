@echo off
echo Starting Movia Application...
echo.

:: Check if Redis is running
tasklist /FI "IMAGENAME eq redis-server.exe" 2>NUL | find /I /N "redis-server.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo Starting Redis...
    start "" "redis-server.exe"
    timeout /t 2 >nul
)

:: Start Backend Server
echo Starting Backend Server...
cd /d "%~dp0backend"
start "Movia Backend" /MIN powershell -NoExit -Command "node server.js"
timeout /t 5 >nul

:: Start Frontend Server
echo Starting Frontend...
cd /d "%~dp0client"
start "Movia Frontend" /MIN powershell -NoExit -Command "npm start"

echo.
echo ========================================
echo   Movia Application Starting...
echo ========================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to close this window...
pause >nul
