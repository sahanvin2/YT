#!/bin/bash

# Movia EC2 Setup Script
# Run this script on your EC2 instance after connecting via SSH

set -e  # Exit on error

echo "=========================================="
echo "  Movia EC2 Deployment Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Generate SSH Key for GitHub
echo -e "${YELLOW}Step 1: Generating SSH key for GitHub...${NC}"
if [ ! -f ~/.ssh/id_ed25519 ]; then
    ssh-keygen -t ed25519 -C "ec2-movia-deployment" -f ~/.ssh/id_ed25519 -N ""
    echo -e "${GREEN}✓ SSH key generated${NC}"
else
    echo -e "${GREEN}✓ SSH key already exists${NC}"
fi

echo ""
echo -e "${YELLOW}=== IMPORTANT: Copy the following public key to GitHub ===${NC}"
echo ""
cat ~/.ssh/id_ed25519.pub
echo ""
echo -e "${YELLOW}Go to: GitHub → Settings → SSH and GPG keys → New SSH key${NC}"
echo -e "${YELLOW}Press Enter after you've added the key to GitHub...${NC}"
read

# Step 2: Update system
echo -e "${YELLOW}Step 2: Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y
echo -e "${GREEN}✓ System updated${NC}"

# Step 3: Install Node.js
echo -e "${YELLOW}Step 3: Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    echo -e "${GREEN}✓ Node.js installed: $(node --version)${NC}"
else
    echo -e "${GREEN}✓ Node.js already installed: $(node --version)${NC}"
fi

# Step 4: Skip MongoDB (using MongoDB Atlas)
echo -e "${YELLOW}Step 4: MongoDB Atlas will be used (no local installation needed)${NC}"
echo -e "${GREEN}✓ Using MongoDB Atlas - make sure to configure MONGO_URI in .env${NC}"

# Step 5: Install Nginx
echo -e "${YELLOW}Step 5: Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    echo -e "${GREEN}✓ Nginx installed${NC}"
else
    echo -e "${GREEN}✓ Nginx already installed${NC}"
fi

# Step 6: Install PM2
echo -e "${YELLOW}Step 6: Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo -e "${GREEN}✓ PM2 installed${NC}"
else
    echo -e "${GREEN}✓ PM2 already installed${NC}"
fi

# Step 7: Install Git
echo -e "${YELLOW}Step 7: Installing Git...${NC}"
if ! command -v git &> /dev/null; then
    sudo apt install -y git
    echo -e "${GREEN}✓ Git installed${NC}"
else
    echo -e "${GREEN}✓ Git already installed${NC}"
fi

# Step 8: Clone repository
echo -e "${YELLOW}Step 8: Cloning repository...${NC}"
if [ ! -d ~/YT ]; then
    cd ~
    git clone git@github.com:sahanvin2/YT.git || git clone https://github.com/sahanvin2/YT.git
    echo -e "${GREEN}✓ Repository cloned${NC}"
else
    echo -e "${GREEN}✓ Repository already exists${NC}"
fi

# Step 9: Install dependencies
echo -e "${YELLOW}Step 9: Installing project dependencies...${NC}"
cd ~/YT
npm install
cd client
npm install
cd ..
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 10: Create .env file if it doesn't exist
echo -e "${YELLOW}Step 10: Setting up environment variables...${NC}"
if [ ! -f ~/YT/.env ]; then
    cat > ~/YT/.env << EOF
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/movia?retryWrites=true&w=majority
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=30d
CLIENT_URL=http://MOVIA.PUBLICVM.COM
FILE_UPLOAD_PATH=./uploads

# Backblaze B2 Storage Configuration
B2_BUCKET=your-b2-bucket-name
B2_PUBLIC_BASE=https://f000.backblazeb2.com/file/your-bucket-name
B2_ENDPOINT=https://s3.us-west-000.backblazeb2.com
B2_ACCESS_KEY_ID=your-b2-application-key-id
B2_SECRET_ACCESS_KEY=your-b2-application-key
MAX_VIDEO_SIZE_MB=500
EOF
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠ IMPORTANT: Update the following in ~/YT/.env:${NC}"
    echo -e "${YELLOW}  1. MONGO_URI - MongoDB Atlas connection string${NC}"
    echo -e "${YELLOW}  2. B2_BUCKET - Your Backblaze B2 bucket name${NC}"
    echo -e "${YELLOW}  3. B2_PUBLIC_BASE - Your B2 public URL${NC}"
    echo -e "${YELLOW}  4. B2_ENDPOINT - Your B2 S3-compatible endpoint${NC}"
    echo -e "${YELLOW}  5. B2_ACCESS_KEY_ID - Your B2 Application Key ID${NC}"
    echo -e "${YELLOW}  6. B2_SECRET_ACCESS_KEY - Your B2 Application Key${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Step 11: Build React app
echo -e "${YELLOW}Step 11: Building React frontend...${NC}"
cd ~/YT/client
npm run build
cd ..
echo -e "${GREEN}✓ React app built${NC}"

echo ""
echo -e "${GREEN}=========================================="
echo "  Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Configure Nginx (see EC2_DEPLOYMENT_GUIDE.md)"
echo "2. Start the application with: pm2 start backend/server.js --name movia-backend"
echo "3. Configure your domain DNS"
echo "4. Update Security Group to allow port 80"
echo ""
echo "For detailed instructions, see: EC2_DEPLOYMENT_GUIDE.md"

