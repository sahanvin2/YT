#!/bin/bash

# Direct EC2 Deployment Script
# This script will SSH into EC2 and deploy automatically

set -e

# Configuration
EC2_PUBLIC_IP="3.238.106.222"
EC2_USER="ec2-user"  # Change to 'ubuntu' if using Ubuntu
SSH_KEY_PATH="${HOME}/.ssh/id_rsa"  # Update with your SSH key
APP_PATH="/home/${EC2_USER}/Movia"  # Update with your app path on EC2

echo "🚀 Starting EC2 Deployment..."

# Check if SSH key exists
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "❌ SSH key not found at $SSH_KEY_PATH"
    echo "Please update SSH_KEY_PATH in deploy-ec2.sh"
    exit 1
fi

# Build locally first
echo "📦 Building frontend..."
cd client
npm install
npm run build
cd ..

# Commit and push to GitHub
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Deploy: Add category images, loading animations, and UI improvements" || echo "No changes to commit"
git push origin main || git push origin master

echo "✅ Pushed to GitHub!"

# Deploy to EC2
echo "🌐 Deploying to EC2..."
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_PUBLIC_IP} << 'ENDSSH'
    cd /home/ec2-user/Movia  # Update this path
    
    echo "📥 Pulling latest changes from GitHub..."
    git pull origin main || git pull origin master
    
    echo "📦 Installing dependencies..."
    cd client
    npm install
    npm run build
    cd ..
    npm install
    
    echo "🔄 Restarting application..."
    # Use PM2 if installed
    if command -v pm2 &> /dev/null; then
        pm2 restart all || pm2 start ecosystem.config.js
    else
        # Or use your process manager
        sudo systemctl restart movia || echo "Please restart your app manually"
    fi
    
    echo "✅ Deployment complete on EC2!"
ENDSSH

echo "🎉 Deployment finished!"
