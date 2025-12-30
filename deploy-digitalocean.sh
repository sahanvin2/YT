#!/bin/bash

# Digital Ocean Droplet Deployment Script
# This script sets up the entire Movia application on a fresh Digital Ocean droplet

set -e  # Exit on error

echo "========================================"
echo "  MOVIA - Digital Ocean Deployment"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/sahanvin2/YT.git"
APP_DIR="/root/YT"
NODE_VERSION="18"

echo -e "${BLUE}Step 1: Updating system packages...${NC}"
apt-get update -y
apt-get upgrade -y
echo -e "${GREEN}✅ System updated${NC}"
echo ""

echo -e "${BLUE}Step 2: Installing essential packages...${NC}"
apt-get install -y curl wget git build-essential nginx ufw
echo -e "${GREEN}✅ Essential packages installed${NC}"
echo ""

echo -e "${BLUE}Step 3: Installing Node.js ${NODE_VERSION}...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
fi
node --version
npm --version
echo -e "${GREEN}✅ Node.js installed${NC}"
echo ""

echo -e "${BLUE}Step 4: Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
pm2 --version
echo -e "${GREEN}✅ PM2 installed${NC}"
echo ""

echo -e "${BLUE}Step 5: Cloning repository...${NC}"
if [ -d "$APP_DIR" ]; then
    echo -e "${YELLOW}Repository exists, pulling latest changes...${NC}"
    cd $APP_DIR
    git pull origin main
else
    cd /root
    git clone $REPO_URL
    cd $APP_DIR
fi
echo -e "${GREEN}✅ Repository cloned/updated${NC}"
echo ""

echo -e "${BLUE}Step 6: Installing backend dependencies...${NC}"
cd $APP_DIR
npm install
echo -e "${GREEN}✅ Backend dependencies installed${NC}"
echo ""

echo -e "${BLUE}Step 7: Installing frontend dependencies...${NC}"
cd $APP_DIR/client
npm install
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
echo ""

echo -e "${BLUE}Step 8: Building frontend...${NC}"
cd $APP_DIR/client
npm run build
echo -e "${GREEN}✅ Frontend built${NC}"
echo ""

echo -e "${BLUE}Step 9: Setting up environment variables...${NC}"
if [ ! -f "$APP_DIR/.env" ]; then
    echo -e "${YELLOW}Creating .env file template...${NC}"
    cat > $APP_DIR/.env << 'EOF'
NODE_ENV=production
PORT=5000
MONGO_URI=your_mongodb_uri_here
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d
CLIENT_URL=http://134.209.105.201

# Backblaze B2 Storage Configuration
B2_BUCKET=your_b2_bucket
B2_PUBLIC_BASE=your_b2_public_base
B2_ENDPOINT=your_b2_endpoint
B2_ACCESS_KEY_ID=your_b2_access_key
B2_SECRET_ACCESS_KEY=your_b2_secret_key
CDN_BASE=your_cdn_base
MAX_VIDEO_SIZE_MB=5120
EOF
    echo -e "${YELLOW}⚠️  Please edit $APP_DIR/.env with your actual credentials${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi
echo ""

echo -e "${BLUE}Step 10: Configuring PM2...${NC}"
cd $APP_DIR
pm2 delete backend 2>/dev/null || true
pm2 start backend/server.js --name backend --cwd $APP_DIR
pm2 save
pm2 startup
echo -e "${GREEN}✅ PM2 configured${NC}"
echo ""

echo -e "${BLUE}Step 11: Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/movia << 'EOF'
server {
    listen 80;
    server_name 134.209.105.201;

    # Frontend (React build)
    location / {
        root /root/YT/client/build;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 7200s;
        proxy_connect_timeout 7200s;
    }

    # Upload endpoint with longer timeout
    location /api/uploads/stream {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 7200s;
        proxy_connect_timeout 7200s;
        client_max_body_size 5120M;
    }

    # Static files
    location /categories {
        root /root/YT/client/public;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    client_max_body_size 5120M;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/movia /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Restart nginx
systemctl restart nginx
systemctl enable nginx
echo -e "${GREEN}✅ Nginx configured${NC}"
echo ""

echo -e "${BLUE}Step 12: Configuring firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo -e "${GREEN}✅ Firewall configured${NC}"
echo ""

echo -e "${BLUE}Step 13: Cleaning up temp files...${NC}"
cd $APP_DIR
if [ -f "backend/scripts/cleanup-temp-files.js" ]; then
    node backend/scripts/cleanup-temp-files.js
fi
echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Edit $APP_DIR/.env with your actual credentials"
echo "2. Restart backend: pm2 restart backend"
echo "3. Check status: pm2 status"
echo "4. View logs: pm2 logs backend"
echo "5. Visit: http://134.209.105.201"
echo ""

