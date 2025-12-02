#!/bin/bash

# Quick Update Script for EC2
# Run this on your EC2 instance to pull latest changes from GitHub

set -e

echo "=========================================="
echo "  Updating Movia from GitHub"
echo "=========================================="
echo ""

# Navigate to project directory
cd ~/YT || { echo "Error: ~/YT directory not found!"; exit 1; }

# Pull latest changes
echo "Pulling latest changes from GitHub..."
git fetch origin
git pull origin main

# Install/update backend dependencies
echo ""
echo "Updating backend dependencies..."
npm install

# Install/update frontend dependencies
echo ""
echo "Updating frontend dependencies..."
cd client
npm install

# Build frontend
echo ""
echo "Building frontend..."
npm run build
cd ..

# Restart the application with PM2
echo ""
echo "Restarting application..."
pm2 restart movia-backend

# Show status
echo ""
echo "=========================================="
echo "  Update Complete!"
echo "=========================================="
echo ""
pm2 status
echo ""
echo "View logs with: pm2 logs movia-backend"

