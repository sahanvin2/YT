#!/bin/bash

# Deploy admin system to EC2

echo "Pulling latest changes..."
git pull origin main

echo "Running admin setup script..."
node backend/scripts/set_upload_admins.js

echo "Restarting backend..."
pm2 restart backend

echo "Admin system deployed successfully!"
