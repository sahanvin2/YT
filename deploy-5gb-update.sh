#!/bin/bash

echo "🚀 Updating Movia to support 5GB uploads..."
echo "=============================================="

# Go to project directory
cd /home/ubuntu/YT

# Backup nginx config
echo "📦 Backing up nginx config..."
sudo cp /etc/nginx/sites-available/movia /etc/nginx/sites-available/movia.backup

# Pull latest changes
echo "⬇️  Pulling latest changes from git..."
git stash
git pull origin main

# Update backend server.js
echo "🔧 Updating backend limits to 5GB..."
cd backend
sed -i "s/const maxSizeMb = parseInt(process.env.MAX_VIDEO_SIZE_MB || '[0-9]*'); \/\/ [0-9]*GB default/const maxSizeMb = parseInt(process.env.MAX_VIDEO_SIZE_MB || '5120'); \/\/ 5GB default/" server.js
sed -i "s/responseOnLimit: 'File size limit exceeded. Maximum allowed: [0-9]*GB'/responseOnLimit: 'File size limit exceeded. Maximum allowed: 5GB'/" server.js

# Update uploadController.js
echo "🔧 Updating upload controller..."
cd controllers
sed -i "s/\/\/ Check file size ([0-9]*GB = [0-9]* bytes)/\/\/ Check file size (5GB = 5368709120 bytes)/" uploadController.js
sed -i "s/message: 'File too large. Maximum size is [0-9]*GB'/message: 'File too large. Maximum size is 5GB'/" uploadController.js
sed -i "s/errorMessage = 'File too large. Maximum size is [0-9]*GB.'/errorMessage = 'File too large. Maximum size is 5GB.'/" uploadController.js

# Update nginx config
echo "🌐 Updating nginx to 5GB..."
cd /home/ubuntu/YT
sudo sed -i 's/client_max_body_size [0-9]*G;/client_max_body_size 5G;/' /etc/nginx/sites-available/movia

# Test nginx config
echo "✅ Testing nginx config..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config is valid!"
    
    # Reload nginx
    echo "🔄 Reloading nginx..."
    sudo systemctl reload nginx
    
    # Restart backend
    echo "🔄 Restarting backend..."
    cd /home/ubuntu/YT/backend
    pm2 restart backend
    
    # Rebuild frontend
    echo "🏗️  Rebuilding frontend (this may take a few minutes)..."
    cd /home/ubuntu/YT/client
    npm run build
    
    echo ""
    echo "✅ =============================================="
    echo "✅ SUCCESS! Your site now supports 5GB uploads!"
    echo "✅ =============================================="
    echo ""
    echo "📊 Current status:"
    pm2 list
    
else
    echo "❌ Nginx config test failed. Rolling back..."
    sudo cp /etc/nginx/sites-available/movia.backup /etc/nginx/sites-available/movia
    exit 1
fi
