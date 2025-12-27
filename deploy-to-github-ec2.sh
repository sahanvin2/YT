#!/bin/bash

# Deploy to GitHub and EC2
# This script pushes code changes to GitHub and deploys to EC2

echo "========================================"
echo "  XCLUB - Deploy to GitHub & EC2"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
EC2_HOST="3.238.106.222"
EC2_USER="ec2-user"
EC2_PATH="/home/ec2-user/movia"
GITHUB_BRANCH="main"

echo -e "${BLUE}Step 1: Git Status${NC}"
git status
echo ""

read -p "Enter commit message: " COMMIT_MESSAGE

if [ -z "$COMMIT_MESSAGE" ]; then
    COMMIT_MESSAGE="Update: $(date '+%Y-%m-%d %H:%M:%S')"
fi

echo ""
echo -e "${BLUE}Step 2: Committing Changes${NC}"
git add .
git commit -m "$COMMIT_MESSAGE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Changes committed${NC}"
else
    echo -e "${RED}❌ Commit failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 3: Pushing to GitHub${NC}"
git push origin $GITHUB_BRANCH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Pushed to GitHub${NC}"
else
    echo -e "${RED}❌ Push failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 4: Deploying to EC2${NC}"

# Files to exclude from EC2 (localhost-specific)
EXCLUDE_FILES=(
    "node_modules"
    "tmp"
    ".git"
    "client/node_modules"
    "client/build"
    ".env.local"
    "*.log"
    "dump.rdb"
)

# Build exclude string for rsync
EXCLUDE_STRING=""
for item in "${EXCLUDE_FILES[@]}"; do
    EXCLUDE_STRING="$EXCLUDE_STRING --exclude='$item'"
done

# Sync files to EC2 (excluding localhost video processing files)
echo "Syncing files to EC2..."
rsync -avz \
    --exclude='node_modules' \
    --exclude='tmp' \
    --exclude='.git' \
    --exclude='client/node_modules' \
    --exclude='client/build' \
    --exclude='*.log' \
    --exclude='dump.rdb' \
    --exclude='hlsWorker.js' \
    -e "ssh -i ~/your-key.pem" \
    ./ $EC2_USER@$EC2_HOST:$EC2_PATH/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Files synced to EC2${NC}"
else
    echo -e "${RED}❌ Sync failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 5: Updating EC2 Environment${NC}"

# SSH into EC2 and run commands
ssh -i ~/your-key.pem $EC2_USER@$EC2_HOST << 'EOF'
cd /home/ec2-user/movia

echo "Installing dependencies..."
npm install

echo "Updating .env with production values..."
# Keep SMTP, MongoDB, B2 configs but not HLS worker
sed -i 's/NODE_ENV=development/NODE_ENV=production/g' .env
sed -i 's/localhost:3000/your-domain.com/g' .env

echo "Building client..."
cd client
npm install
GENERATE_SOURCEMAP=false npm run build
cd ..

echo "Restarting PM2 services..."
pm2 restart backend

echo "✅ Deployment complete!"
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ EC2 deployment complete!${NC}"
else
    echo -e "${RED}❌ EC2 deployment failed${NC}"
    exit 1
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL!${NC}"
echo "========================================"
echo ""
echo "Changes deployed:"
echo "  ✅ GitHub: https://github.com/your-username/movia"
echo "  ✅ EC2: http://$EC2_HOST"
echo ""
echo "What was updated:"
echo "  • SMTP email service"
echo "  • MongoDB connection"
echo "  • B2 storage configuration"
echo "  • Performance optimizations"
echo "  • UI improvements"
echo ""
echo "NOT deployed (localhost only):"
echo "  • HLS Worker (video processing)"
echo "  • Temporary files"
echo "  • Development configs"
echo ""
