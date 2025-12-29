#!/bin/bash
# Deploy script to remove video processing from EC2

echo "🚀 Deploying video processing removal to EC2..."
echo ""

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
cd ~/YT
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Stop any HLS workers or processing queues
echo "🛑 Stopping any video processing workers..."
pm2 stop hls-worker 2>/dev/null || echo "No HLS worker running"
pm2 delete hls-worker 2>/dev/null || echo "No HLS worker to delete"

# Restart backend
echo "🔄 Restarting backend..."
pm2 restart backend

# Show status
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Current PM2 status:"
pm2 status

echo ""
echo "📋 Backend logs (last 10 lines):"
pm2 logs backend --lines 10 --nostream

echo ""
echo "✅ Videos will now upload directly to B2 without any processing!"
echo "✅ No more CPU-intensive video encoding!"

