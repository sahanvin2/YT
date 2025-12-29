#!/bin/bash
# Deploy login fix to EC2

echo "🔧 Deploying login fix to EC2..."
echo ""

# Pull latest code
echo "📥 Pulling latest code..."
cd ~/YT
git pull origin main

# Build frontend
echo "🔨 Building frontend..."
cd client
npm install
npm run build
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Restart backend
echo "🔄 Restarting backend..."
pm2 restart backend

# Show status
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 PM2 status:"
pm2 status

echo ""
echo "📋 Backend logs (last 10 lines):"
pm2 logs backend --lines 10 --nostream

echo ""
echo "✅ Login should now work correctly on EC2!"

