@echo off
echo.
echo ================================================
echo    MOVIA - SMTP SETUP INSTRUCTIONS
echo ================================================
echo.
echo YOUR CONNECTIONS:
echo   MongoDB: CONFIGURED ✅ (MongoDB Atlas)
echo   B2 Storage: CONFIGURED ✅ (Backblaze B2)
echo   Redis: CONFIGURED ✅ (Local)
echo   SMTP Email: NOT CONFIGURED ❌
echo.
echo ================================================
echo.
echo TO FIX SMTP (Takes 5 minutes):
echo.
echo 1. Go to: https://www.brevo.com/
echo    - Click "Sign up free"
echo    - Enter your email and create account
echo    - Verify your email
echo.
echo 2. Get SMTP Credentials:
echo    - Login to Brevo dashboard
echo    - Go to: Settings ^> SMTP ^& API
echo    - Click "SMTP" tab
echo    - Click "Create a new SMTP key"
echo    - Copy the SMTP key (looks like: xsmtpsib-xxx...)
echo.
echo 3. Update .env file:
echo    - Open .env file in this folder
echo    - Find these lines:
echo      MAIL_USERNAME=your-brevo-email@example.com
echo      MAIL_PASSWORD=your-brevo-smtp-key-here
echo.
echo    - Replace with:
echo      MAIL_USERNAME=your-actual-email@gmail.com
echo      MAIL_PASSWORD=xsmtpsib-your-actual-key-from-step2
echo.
echo 4. Save .env file and restart server
echo.
echo 5. Test with: node test-email.js your@email.com
echo.
echo 6. Send to all users: node send-verification-emails.js
echo.
echo ================================================
echo.
echo IMPORTANT NOTES:
echo   - Brevo FREE tier: 300 emails/day
echo   - No credit card required
echo   - Takes 5 minutes to setup
echo   - See SMTP_SETUP_GUIDE.md for details
echo.
echo ================================================
echo.
pause
