#!/bin/bash

# URGENT: Disable video processing to reduce EC2 load (80% usage)

echo "=========================================="
echo "DISABLING VIDEO PROCESSING ON EC2"
echo "=========================================="
echo ""

# SSH into EC2
ssh -i "movia.pem" ubuntu@3.238.106.222 << 'ENDSSH'

# Pull latest code with disabled processing
cd ~/YT
git pull origin main

# Stop worker server if running (reduces CPU/RAM usage significantly)
pm2 delete workerServer 2>/dev/null || echo "Worker server not running"
pm2 delete videoWorker 2>/dev/null || echo "Video worker not running"

# Restart main backend with new code
pm2 restart backend

# Show status
pm2 status

echo ""
echo "✅ Video processing DISABLED"
echo "✅ All new uploads go directly to storage"
echo "✅ CPU/RAM load should drop significantly"
echo ""
echo "To re-enable processing later, see RE-ENABLE-PROCESSING.md"

ENDSSH

echo ""
echo "=========================================="
echo "DEPLOYMENT COMPLETE"
echo "=========================================="
