@echo off
REM Deploy to GitHub and EC2 (Windows Version)

echo.
echo ========================================
echo   XCLUB - Deploy to GitHub ^& EC2
echo ========================================
echo.

REM Configuration
set EC2_HOST=3.238.106.222
set EC2_USER=ec2-user
set GITHUB_BRANCH=main

echo Step 1: Git Status
echo ----------------------------------------
git status
echo.

set /p COMMIT_MESSAGE="Enter commit message: "

if "%COMMIT_MESSAGE%"=="" (
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
    for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
    set COMMIT_MESSAGE=Update: %mydate% %mytime%
)

echo.
echo Step 2: Committing Changes
echo ----------------------------------------
git add .
git commit -m "%COMMIT_MESSAGE%"

if errorlevel 1 (
    echo.
    echo ❌ Commit failed
    pause
    exit /b 1
)

echo ✅ Changes committed
echo.

echo Step 3: Pushing to GitHub
echo ----------------------------------------
git push origin %GITHUB_BRANCH%

if errorlevel 1 (
    echo.
    echo ❌ Push failed
    pause
    exit /b 1
)

echo ✅ Pushed to GitHub
echo.

echo Step 4: Deploying to EC2
echo ----------------------------------------
echo.
echo ⚠️  Manual EC2 Deployment Steps:
echo.
echo 1. SSH into EC2:
echo    ssh -i your-key.pem %EC2_USER%@%EC2_HOST%
echo.
echo 2. Pull latest code:
echo    cd /home/ec2-user/movia
echo    git pull origin %GITHUB_BRANCH%
echo.
echo 3. Install dependencies:
echo    npm install
echo    cd client ^&^& npm install ^&^& cd ..
echo.
echo 4. Build frontend:
echo    cd client
echo    GENERATE_SOURCEMAP=false npm run build
echo    cd ..
echo.
echo 5. Update .env with production values:
echo    nano .env
echo    (Update SMTP, MongoDB, B2 configs)
echo.
echo 6. Restart services:
echo    pm2 restart backend
echo    pm2 save
echo.
echo ========================================
echo.
echo ✅ GitHub push complete!
echo ⏳ Please complete EC2 deployment manually
echo.
echo Changes to deploy:
echo   • SMTP email service
echo   • MongoDB connection
echo   • B2 storage configuration
echo   • Performance optimizations
echo   • UI improvements
echo.
echo NOT deploying (localhost only):
echo   • HLS Worker (video processing)
echo   • Temporary files
echo   • Development configs
echo.
echo ========================================
echo.
pause
