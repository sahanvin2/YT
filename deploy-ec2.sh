#!/bin/bash

echo "=================================="
echo "  Deploying Movia to EC2"
echo "=================================="

EC2_IP="13.211.161.39"
EC2_USER="ubuntu"
PROJECT_DIR="/home/ubuntu/YT"

echo "Connecting to EC2..."

ssh -o "StrictHostKeyChecking=no" ${EC2_USER}@${EC2_IP} << 'EOF'
cd /home/ubuntu/YT || exit 1

echo "Pulling latest changes..."
git pull origin main

echo "Installing backend dependencies..."
npm install --production

echo "Building client..."
cd client
npm install
npm run build
cd ..

echo "Restarting backend..."
pm2 restart backend

echo "Checking status..."
pm2 status

echo "Deployment complete!"
EOF

echo "✓ Deployment finished!"
echo "Visit: http://${EC2_IP}"
