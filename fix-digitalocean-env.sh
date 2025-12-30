#!/bin/bash
# Fix .env file loading issue on Digital Ocean

echo "🔧 Fixing .env file configuration..."

cd /root/YT

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

echo "✅ .env file exists"

# Check if dotenv is loading from the right location
# The .env file should be in /root/YT (project root)
# But dotenv might be looking in /root/YT/backend

# Create a symlink in backend directory to ensure dotenv finds it
if [ ! -f backend/.env ]; then
    ln -sf /root/YT/.env backend/.env
    echo "✅ Created symlink: backend/.env -> /root/YT/.env"
fi

# Also ensure .env is in the root where PM2 runs from
if [ ! -f /root/YT/.env ]; then
    echo "❌ .env file missing in /root/YT/"
    exit 1
fi

# Fix CLIENT_URL in .env (should be the Digital Ocean IP, not localhost)
sed -i 's|CLIENT_URL=http://localhost:3000|CLIENT_URL=http://134.209.105.201|g' /root/YT/.env

echo "✅ Fixed CLIENT_URL in .env"

# Verify .env file has required variables
echo ""
echo "📋 Checking .env file contents..."
echo "MONGO_URI: $(grep MONGO_URI /root/YT/.env | head -1)"
echo "B2_BUCKET: $(grep B2_BUCKET /root/YT/.env | head -1)"
echo "CLIENT_URL: $(grep CLIENT_URL /root/YT/.env | head -1)"

# Restart PM2 with explicit env file
echo ""
echo "🔄 Restarting backend with proper .env loading..."

# Stop backend
pm2 delete backend 2>/dev/null || true

# Start backend with explicit .env file path
cd /root/YT
pm2 start backend/server.js --name backend --cwd /root/YT --env production

# Wait a moment
sleep 3

# Check status
pm2 status

# Show logs
echo ""
echo "📋 Recent backend logs:"
pm2 logs backend --lines 15 --nostream

echo ""
echo "✅ Fix complete!"
echo ""
echo "If MongoDB still fails, check:"
echo "1. MongoDB Atlas IP whitelist (allow 0.0.0.0/0 or Digital Ocean IP)"
echo "2. MongoDB connection string is correct"
echo "3. Run: pm2 logs backend --lines 50"

