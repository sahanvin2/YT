#!/bin/bash

echo "🔧 Quick Server Fix After Crash"
echo "==============================="

# Kill any ffmpeg processes (they crash the server)
echo "Killing ffmpeg processes..."
pkill -9 ffmpeg 2>/dev/null

# Restart services
echo "Restarting nginx..."
sudo systemctl restart nginx

echo "Restarting backend..."
cd /home/ubuntu/YT/backend
pm2 restart backend

# Add worker config (disabled by default)
if ! grep -q "WORKER_ENABLED" .env 2>/dev/null; then
    cat >> .env << 'EOF'

WORKER_ENABLED=false
WORKER_URL=http://WORKER-IP:3001
API_URL=http://3.238.106.222:5000
EOF
fi

# Install axios
npm install axios --save > /dev/null 2>&1

echo ""
echo "✅ Done! Server should be back up."
echo "   Check: pm2 logs backend"
