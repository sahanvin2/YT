#!/bin/bash
# Deploy to EC2 - December 27, 2025
# Usage: Run this script on EC2 server after SSH

echo "🚀 Deploying Movia to EC2..."
echo "=========================================="

# Navigate to project directory
cd ~/Movia || { echo "❌ Project directory not found"; exit 1; }

# Stop running services
echo "⏸️  Stopping services..."
pm2 stop all 2>/dev/null || true

# Pull latest code from GitHub
echo "📥 Pulling latest code from GitHub..."
git fetch origin
git reset --hard origin/main
git pull origin main

# Copy .env if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env..."
    if [ -f .env ]; then
        cp .env backend/.env
    else
        echo "⚠️  Warning: No .env file found! Please configure manually."
    fi
fi

# Install dependencies
echo "📦 Installing backend dependencies..."
cd ~/Movia
npm install --production

echo "📦 Installing frontend dependencies..."
cd ~/Movia/client
npm install --production

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Setup PM2 ecosystem if needed
cd ~/Movia
if [ ! -f ecosystem.config.js ]; then
    echo "📝 Creating PM2 ecosystem config..."
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'movia-backend',
      script: 'backend/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '1G',
      autorestart: true,
      watch: false
    },
    {
      name: 'movia-frontend',
      script: 'serve',
      args: '-s client/build -l 3000',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
EOF
fi

# Create logs directory
mkdir -p ~/Movia/logs

# Install serve globally if not present (for frontend)
if ! command -v serve &> /dev/null; then
    echo "📦 Installing serve..."
    npm install -g serve
fi

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Start services with PM2
echo "🚀 Starting services with PM2..."
pm2 start ecosystem.config.js
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo "Backend:  http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5000"
echo "Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
echo "=========================================="
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "📋 To view logs:"
echo "  Backend:  pm2 logs movia-backend"
echo "  Frontend: pm2 logs movia-frontend"
echo ""
echo "🔄 To restart:"
echo "  pm2 restart all"
