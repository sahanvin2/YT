@echo off
echo ================================================
echo MOVIA - Stopping All Services
echo ================================================
echo.

echo Killing all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Checking ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000.*LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING"') do taskkill /F /PID %%a >nul 2>&1

echo.
echo [OK] All services stopped
echo.
pause
