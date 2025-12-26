@echo off
echo.
echo Stopping all Movia services...
echo.

REM Stop all Node processes
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Services stopped
) else (
    echo [OK] No services running
)

REM Stop Redis (optional - can leave running)
REM taskkill /F /IM redis-server.exe >nul 2>&1

echo.
echo All services stopped!
echo.
pause
