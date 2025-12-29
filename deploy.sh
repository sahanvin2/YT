#!/bin/bash

# Deployment Script for EC2
# This script will deploy the application to EC2 instance

set -e

echo "🚀 Starting Deployment Process..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# EC2 Configuration
EC2_PUBLIC_IP="3.238.106.222"
EC2_PRIVATE_IP="172.30.5.141"
EC2_USER="ec2-user"  # Change if using Ubuntu (ubuntu) or other
SSH_KEY_PATH="~/.ssh/your-key.pem"  # Update with your SSH key path

echo -e "${BLUE}📦 Step 1: Building Frontend...${NC}"
cd client
npm install
npm run build
cd ..

echo -e "${BLUE}📦 Step 2: Preparing Backend...${NC}"
# Install backend dependencies if needed
npm install

echo -e "${BLUE}📦 Step 3: Committing to Git...${NC}"
git add .
git commit -m "Deploy: Add category images and update UI" || echo "No changes to commit"
git push origin main || git push origin master

echo -e "${GREEN}✅ All changes pushed to GitHub!${NC}"

echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo -e "1. SSH into your EC2 instance:"
echo -e "   ${BLUE}ssh -i ${SSH_KEY_PATH} ${EC2_USER}@${EC2_PUBLIC_IP}${NC}"
echo ""
echo -e "2. Once connected, run these commands on EC2:"
echo -e "   ${BLUE}cd /path/to/your/app${NC}"
echo -e "   ${BLUE}git pull origin main${NC}"
echo -e "   ${BLUE}cd client && npm install && npm run build${NC}"
echo -e "   ${BLUE}cd .. && npm install${NC}"
echo -e "   ${BLUE}pm2 restart all${NC}  # or your process manager"
echo ""
echo -e "${GREEN}✅ Deployment script completed!${NC}"

