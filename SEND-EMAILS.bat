@echo off
echo.
echo ========================================
echo    MOVIA - SEND VERIFICATION EMAILS
echo ========================================
echo.
echo This script will send verification emails to all registered users.
echo.
echo BEFORE RUNNING:
echo 1. Make sure you have configured SMTP in .env file
echo 2. Test email service first with: npm run email:test
echo.
pause
echo.
echo Starting email send...
echo.
node send-verification-emails.js
echo.
echo ========================================
echo    PROCESS COMPLETE
echo ========================================
echo.
pause
