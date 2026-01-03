#!/bin/bash
# Deploy Movia to DigitalOcean Droplet
# This script deploys the updated Movia application with M logo and 2GB upload support

set -e

DROPLET_IP="159.203.70.1"
DROPLET_USER="root"  # Try root first
PROJECT_DIR="/root/YT"

echo "🚀 Deploying Movia to Droplet"
echo "=============================="
echo "Droplet IP: $DROPLET_IP"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Step 1: Test connection
echo "📡 Testing connection..."
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $DROPLET_USER@$DROPLET_IP "echo 'Connected'" 2>/dev/null; then
    print_status 0 "Connection successful"
else
    DROPLET_USER="ubuntu"
    PROJECT_DIR="/home/ubuntu/YT"
    if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $DROPLET_USER@$DROPLET_IP "echo 'Connected'" 2>/dev/null; then
        print_status 0 "Connection successful with ubuntu user"
    else
        print_status 1 "Cannot connect. Please check SSH key and IP address."
        exit 1
    fi
fi

# Step 2: Upload code (if using SCP, otherwise use git)
echo ""
echo "📤 Uploading code..."
echo "Note: If using git, code will be pulled. Otherwise, upload files manually."

# Step 3: Setup on droplet
echo ""
echo "⚙️  Setting up on droplet..."
ssh $DROPLET_USER@$DROPLET_IP << REMOTE_SCRIPT
set -e

cd $PROJECT_DIR

# Pull latest code if git repo
if [ -d ".git" ]; then
    echo "Pulling latest code from git..."
    git pull origin main || git pull origin master || echo "Git pull failed, continuing..."
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install --production

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ../client
npm install --production

# Build frontend
echo "Building frontend..."
npm run build

cd $PROJECT_DIR

# Update .env - ensure MAX_VIDEO_SIZE_MB is 2048
if [ -f .env ]; then
    # Remove worker dependencies
    sed -i '/REDIS_HOST/d' .env
    sed -i '/REDIS_PORT/d' .env
    sed -i '/USE_WORKER_QUEUE/d' .env
    sed -i '/WORKER_URL/d' .env
    sed -i '/WORKER_ENABLED/d' .env
    
    # Set upload limit to 2GB
    if grep -q "MAX_VIDEO_SIZE_MB" .env; then
        sed -i 's/^MAX_VIDEO_SIZE_MB=.*/MAX_VIDEO_SIZE_MB=2048/' .env
    else
        echo "MAX_VIDEO_SIZE_MB=2048" >> .env
    fi
fi

# Create symlink for backend .env
if [ -f .env ] && [ ! -f backend/.env ]; then
    ln -sf $PROJECT_DIR/.env backend/.env
fi

# Create ecosystem.config.js if needed
if [ ! -f ecosystem.config.js ]; then
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
        PORT: 5000,
        NODE_OPTIONS: '--max-old-space-size=4096'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '3G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      autorestart: true,
      watch: false,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};
EOF
fi

# Create logs directory
mkdir -p logs

echo "✅ Setup complete"
REMOTE_SCRIPT

print_status 0 "Code setup complete"

# Step 4: Update nginx config
echo ""
echo "🌐 Updating Nginx configuration..."
ssh $DROPLET_USER@$DROPLET_IP << REMOTE_SCRIPT
set -e

# Update nginx config with 2GB upload limit
sudo bash -c 'cat > /etc/nginx/sites-available/movia << "NGINXEOF"
server {
    listen 80;
    server_name xclub.asia www.xclub.asia 159.203.70.1;
    
    # 2GB Upload Limit
    client_max_body_size 2500M;
    client_body_timeout 600s;
    client_header_timeout 600s;
    keepalive_timeout 65;
    send_timeout 600s;
    
    root $PROJECT_DIR/client/build;
    index index.html;
    
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
    
    location /api/health {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_connect_timeout 5s;
        proxy_read_timeout 5s;
        proxy_send_timeout 5s;
        access_log off;
    }
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 7200s;
        proxy_read_timeout 7200s;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        proxy_next_upstream_tries 2;
        proxy_next_upstream_timeout 10s;
        proxy_intercept_errors on;
        error_page 502 503 504 = @backend_fallback;
    }
    
    location @backend_fallback {
        default_type application/json;
        return 503 '\''{"error":"Service temporarily unavailable","message":"Backend server is restarting. Please try again in a few seconds."}'\'';
    }
}
NGINXEOF
'

# Enable site
sudo ln -sf /etc/nginx/sites-available/movia /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart nginx
sudo nginx -t && sudo systemctl restart nginx && sudo systemctl enable nginx

echo "✅ Nginx updated"
REMOTE_SCRIPT

print_status 0 "Nginx configured"

# Step 5: Restart application
echo ""
echo "🔄 Restarting application..."
ssh $DROPLET_USER@$DROPLET_IP << REMOTE_SCRIPT
set -e

cd $PROJECT_DIR

# Stop existing processes
pm2 delete all 2>/dev/null || true

# Start backend
pm2 start ecosystem.config.js
pm2 save

# Setup PM2 startup
pm2 startup systemd -u $DROPLET_USER --hp $(eval echo ~$DROPLET_USER) 2>/dev/null || pm2 startup

echo "✅ Application restarted"
REMOTE_SCRIPT

print_status 0 "Application restarted"

# Step 6: Verify
echo ""
echo "🔍 Verifying deployment..."
ssh $DROPLET_USER@$DROPLET_IP << REMOTE_SCRIPT
set -e

cd $PROJECT_DIR

echo ""
echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== Backend Health ==="
sleep 3
curl -s http://localhost:5000/api/health | head -5 || echo "Backend starting..."

echo ""
echo "=== Port 5000 ==="
sudo lsof -i :5000 | head -2 || echo "Port 5000 check..."

echo ""
echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager | head -3 || true

REMOTE_SCRIPT

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=================================================="
echo ""
echo "Your Movia site is now deployed!"
echo ""
echo "Next steps:"
echo "1. Visit: http://$DROPLET_IP"
echo "2. Test upload: Try uploading a video up to 2GB"
echo "3. Check logs: ssh $DROPLET_USER@$DROPLET_IP 'pm2 logs movia-backend'"
echo "4. Setup SSL: sudo certbot --nginx -d xclub.asia -d www.xclub.asia"
echo ""




