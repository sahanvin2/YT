#!/bin/bash

# EC2 Deployment Script - Update with Latest Changes
# ssh -i "movia.pem" ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com

echo "=================================================="
echo "🚀 EC2 DEPLOYMENT - LATEST UPDATES"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Navigate to project directory
cd /home/ubuntu/movia || { echo -e "${RED}❌ Failed to navigate to project directory${NC}"; exit 1; }

echo -e "${YELLOW}📥 Pulling latest changes from GitHub...${NC}"
git fetch origin
git reset --hard origin/main
git pull origin main

echo -e "${GREEN}✅ Code updated${NC}"
echo ""

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install
cd client && npm install && cd ..

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}⚙️  Updating .env configuration...${NC}"
# Add/Update MAX_VIDEO_SIZE_MB if not exists
if ! grep -q "MAX_VIDEO_SIZE_MB" .env; then
    echo "MAX_VIDEO_SIZE_MB=5120" >> .env
    echo -e "${GREEN}✅ Added MAX_VIDEO_SIZE_MB=5120${NC}"
else
    sed -i 's/MAX_VIDEO_SIZE_MB=.*/MAX_VIDEO_SIZE_MB=5120/' .env
    echo -e "${GREEN}✅ Updated MAX_VIDEO_SIZE_MB=5120${NC}"
fi

# Update HLS_WORKER_CONCURRENCY if not exists
if ! grep -q "HLS_WORKER_CONCURRENCY" .env; then
    echo "HLS_WORKER_CONCURRENCY=3" >> .env
    echo -e "${GREEN}✅ Added HLS_WORKER_CONCURRENCY=3${NC}"
fi

echo ""

echo -e "${YELLOW}🔧 Updating NGINX configuration...${NC}"
sudo sed -i 's/client_max_body_size [0-9]*[GM];/client_max_body_size 5G;/g' /etc/nginx/sites-available/movia
sudo nginx -t
sudo systemctl reload nginx

echo -e "${GREEN}✅ NGINX updated and reloaded${NC}"
echo ""

echo -e "${YELLOW}🏗️  Building React frontend...${NC}"
cd client
npm run build
cd ..

echo -e "${GREEN}✅ Frontend built${NC}"
echo ""

echo -e "${YELLOW}🔄 Restarting PM2 services...${NC}"
pm2 restart all
pm2 save

echo -e "${GREEN}✅ Services restarted${NC}"
echo ""

echo "=================================================="
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo "=================================================="
echo ""
echo "📊 Service Status:"
pm2 list

echo ""
echo "📝 Recent Logs:"
pm2 logs --lines 20 --nostream

echo ""
echo "🔍 Check Queue Status:"
echo "   node check-queue-status.js"
echo ""
echo "🌐 Test Upload:"
echo "   curl -X POST http://3.238.106.222:5000/api/test"
echo ""
