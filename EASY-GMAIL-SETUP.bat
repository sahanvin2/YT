@echo off
echo.
echo ========================================================
echo    GMAIL SMTP SETUP - EASIEST SOLUTION!
echo ========================================================
echo.
echo This will guide you to set up Gmail SMTP in 3 minutes.
echo Gmail is MUCH easier than Brevo!
echo.
echo ========================================================
echo.
echo STEP 1: Enable 2-Factor Authentication
echo.
echo 1. Go to: https://myaccount.google.com/security
echo 2. Find "2-Step Verification"
echo 3. Click "Get Started" if not enabled
echo 4. Follow the simple steps
echo.
pause
echo.
echo ========================================================
echo.
echo STEP 2: Generate App Password
echo.
echo 1. Go to: https://myaccount.google.com/apppasswords
echo 2. If asked, login again
echo 3. Select "Mail" and your device name
echo 4. Click "Generate"
echo 5. Copy the 16-character password (looks like: xxxx xxxx xxxx xxxx)
echo.
pause
echo.
echo ========================================================
echo.
echo STEP 3: Update .env File
echo.
echo Opening .env file now...
echo.
echo Find these lines:
echo   MAIL_HOST=smtp-relay.sendinblue.com
echo   MAIL_USERNAME=snawarathne33@gmail.com
echo   MAIL_PASSWORD=xsmtpsib-...
echo.
echo Replace with:
echo   MAIL_HOST=smtp.gmail.com
echo   MAIL_USERNAME=snawarathne33@gmail.com
echo   MAIL_PASSWORD=your-16-char-password-here
echo.
echo (Paste the password you copied from Step 2)
echo.
pause
echo.
notepad .env
echo.
echo ========================================================
echo.
echo STEP 4: Test Email
echo.
echo After saving .env, we'll test...
echo.
pause
echo.
echo Testing email...
node test-email.js snawarathne33@gmail.com
echo.
echo ========================================================
echo.
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS! Email sent!
    echo.
    echo Now sending to all 8 users...
    pause
    node send-welcome-emails.js
) else (
    echo Test failed. Please check your App Password.
    echo Make sure you copied it correctly without spaces.
)
echo.
echo ========================================================
echo.
pause
