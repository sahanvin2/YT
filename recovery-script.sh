#!/bin/bash
# Complete EC2 Recovery and Connection Script
# Run this after main EC2 reboot

set -e

WORKER_IP="172.30.5.116"
MAIN_EC2="ec2-3-238-106-222.compute-1.amazonaws.com"
PEM_FILE="C:\Users\User\Downloads\movia.pem"

echo "🔧 Main EC2 Recovery & Worker Connection"
echo "========================================"
echo ""

# Step 1: Kill stuck processes
echo "1️⃣ Killing stuck video processing..."
ssh -i "$PEM_FILE" ubuntu@$MAIN_EC2 << 'EOF1'
echo "Killing ffmpeg processes..."
pkill -9 -f ffmpeg || true
pkill -9 -f videoTranscoder || true
echo "✅ Cleared stuck processes"
EOF1

# Step 2: Update backend configuration
echo ""
echo "2️⃣ Configuring backend to use worker Redis..."
ssh -i "$PEM_FILE" ubuntu@$MAIN_EC2 << 'EOF2'
cd /home/ubuntu/YT/backend

# Backup existing .env
cp .env .env.backup.$(date +%s)

# Update or add Redis configuration
if grep -q "REDIS_HOST" .env; then
    sed -i 's/^REDIS_HOST=.*/REDIS_HOST=172.30.5.116/' .env
    sed -i 's/^REDIS_PORT=.*/REDIS_PORT=6379/' .env
else
    cat >> .env << 'ENVEOF'

# Worker EC2 Redis Configuration
REDIS_HOST=172.30.5.116
REDIS_PORT=6379
USE_WORKER_QUEUE=true
VIDEO_PROCESSING_ENABLED=false
ENVEOF
fi

echo "✅ Backend configured"
cat .env | grep REDIS
EOF2

# Step 3: Upload new client with smartlink
echo ""
echo "3️⃣ Uploading updated client..."
scp -i "$PEM_FILE" -r client/src ubuntu@$MAIN_EC2:/home/ubuntu/YT/client/
echo "✅ Client uploaded"

# Step 4: Restart backend
echo ""
echo "4️⃣ Restarting backend..."
ssh -i "$PEM_FILE" ubuntu@$MAIN_EC2 << 'EOF4'
cd /home/ubuntu/YT/backend
pm2 restart all
sleep 3
pm2 list
echo ""
echo "Backend logs:"
pm2 logs --lines 10 --nostream
EOF4

# Step 5: Rebuild client
echo ""
echo "5️⃣ Rebuilding client..."
ssh -i "$PEM_FILE" ubuntu@$MAIN_EC2 << 'EOF5'
cd /home/ubuntu/YT/client
sudo rm -rf build
npm run build | tail -20
echo "✅ Client built"
EOF5

# Step 6: Reload nginx
echo ""
echo "6️⃣ Reloading Nginx..."
ssh -i "$PEM_FILE" ubuntu@$MAIN_EC2 << 'EOF6'
sudo nginx -t && sudo systemctl reload nginx
echo "✅ Nginx reloaded"
EOF6

# Step 7: Test connection
echo ""
echo "7️⃣ Testing Redis connection..."
ssh -i "$PEM_FILE" ubuntu@$MAIN_EC2 << 'EOF7'
# Test Redis connection from main to worker
redis-cli -h 172.30.5.116 -p 6379 ping || echo "❌ Cannot reach worker Redis - check security group!"
EOF7

echo ""
echo "✅ Recovery Complete!"
echo ""
echo "🔍 Verification:"
echo "- Worker EC2: http://ec2-3-227-1-7.compute-1.amazonaws.com"
echo "- Main website: https://xclub.asia"
echo ""
echo "📊 Monitor with:"
echo "  pm2 logs movia-backend    # Main EC2"
echo "  pm2 logs videoWorker       # Worker EC2"
