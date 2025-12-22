#!/bin/bash
# Emergency Main EC2 Recovery Script
# Run this when main EC2 becomes unresponsive

echo "🚨 Emergency Recovery for Main EC2"
echo "=================================="

# Wait for SSH to become available
echo "⏳ Waiting for SSH connection..."
for i in {1..30}; do
    if ssh -o ConnectTimeout=5 -i "C:\Users\User\Downloads\movia.pem" ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com "echo 'Connected'" 2>/dev/null; then
        echo "✅ Connected!"
        break
    fi
    echo "Attempt $i/30..."
    sleep 10
done

# Check system status
echo ""
echo "📊 System Status:"
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com << 'REMOTE_COMMANDS'

echo "CPU & Memory:"
top -bn1 | head -5

echo ""
echo "Disk Usage:"
df -h | head -3

echo ""
echo "PM2 Processes:"
pm2 list

echo ""
echo "High CPU processes:"
ps aux --sort=-%cpu | head -10

# Kill any stuck video processing
echo ""
echo "🔪 Killing stuck processes..."
pkill -f ffmpeg
pkill -f videoTranscoder

# Update configuration
echo ""
echo "⚙️ Updating configuration..."
cd /home/ubuntu/YT/backend

# Add Redis worker configuration
cat >> .env << 'ENV_EOF'

# Worker EC2 Connection
REDIS_HOST=172.30.5.116
REDIS_PORT=6379
USE_WORKER_QUEUE=true
VIDEO_PROCESSING_ENABLED=false
ENV_EOF

echo "✅ Configuration updated"

# Restart PM2
echo ""
echo "🔄 Restarting services..."
pm2 restart all
pm2 logs --lines 20 --nostream

REMOTE_COMMANDS

echo ""
echo "✅ Recovery complete!"
echo ""
echo "Next steps:"
echo "1. Check AWS Security Group - allow port 6379 from main to worker"
echo "2. Upload new client with smartlink ad"
echo "3. Rebuild client: cd /home/ubuntu/YT/client && npm run build"
echo "4. Monitor: pm2 logs"
