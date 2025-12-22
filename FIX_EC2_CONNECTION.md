# EC2 Connection & Video Processing Fix

## Problem Identified
- **Main EC2 (ec2-3-238-106-222)**: 100% CPU usage, processing videos itself
- **Worker EC2 (ec2-3-227-1-7)**: Idle, not receiving jobs
- **Issue**: Redis not properly configured for cross-EC2 communication

## Solution Steps

### 1. Configure Worker EC2 Redis (ec2-3-227-1-7)

```bash
# SSH to worker
ssh -i "movia.pem" ubuntu@ec2-3-227-1-7.compute-1.amazonaws.com

# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# Find and change these lines:
bind 127.0.0.1 172.30.5.116  # Already configured!
protected-mode no             # Change from 'yes' to 'no'

# Save and restart Redis
sudo systemctl restart redis-server
sudo systemctl status redis-server

# Verify Redis is accessible
redis-cli ping
```

### 2. Update Main EC2 Configuration (ec2-3-238-106-222)

```bash
# SSH to main EC2
ssh -i "movia.pem" ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com

# Update .env file
nano /home/ubuntu/YT/backend/.env

# Add/Update these lines:
REDIS_HOST=172.30.5.116        # Worker EC2 private IP
REDIS_PORT=6379
VIDEO_PROCESSING_ENABLED=true
USE_WORKER_QUEUE=true

# Restart backend
cd /home/ubuntu/YT/backend
pm2 restart all
pm2 logs --lines 50
```

### 3. AWS Security Group Configuration

**IMPORTANT**: In AWS Console, update security groups:

#### Worker EC2 Security Group:
- **Inbound Rule**: Add custom TCP rule
  - Port: 6379
  - Source: Security group of main EC2 (or 172.30.x.x/16)
  - Description: Redis from main EC2

#### Main EC2 Security Group:
- **Outbound Rule**: Allow all (default) or specific to 172.30.5.116:6379

### 4. Test Connection

```bash
# From main EC2, test Redis connection
redis-cli -h 172.30.5.116 -p 6379 ping
# Should return: PONG

# Test queue job
redis-cli -h 172.30.5.116 -p 6379 LPUSH video-processing '{"test":"job"}'

# Check worker logs
ssh ubuntu@ec2-3-227-1-7.compute-1.amazonaws.com "pm2 logs videoWorker --lines 20"
```

### 5. Deploy Updated Client (New Smartlink Ad)

```bash
# From local machine
scp -i "C:\Users\User\Downloads\movia.pem" -r client/src ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com:/home/ubuntu/YT/client/

# SSH to main EC2 and rebuild
ssh -i "movia.pem" ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com
cd /home/ubuntu/YT/client
npm run build
sudo systemctl reload nginx
```

## Updated Smartlink URL
✅ New URL: `https://www.effectivegatecpm.com/idfx3p15i3?key=9d603a856f9d9a37ec5ef196269b06e7`

## Verification Checklist

- [ ] Redis accessible from main EC2 to worker EC2
- [ ] Worker EC2 videoWorker PM2 process running
- [ ] Main EC2 backend connected to worker Redis
- [ ] Videos uploading without CPU spike on main EC2
- [ ] Worker EC2 CPU increases when processing videos
- [ ] New smartlink ad working on website
- [ ] Users staying logged in
- [ ] Videos loading properly

## Monitoring

```bash
# Watch worker EC2 logs
ssh ubuntu@ec2-3-227-1-7.compute-1.amazonaws.com "pm2 logs videoWorker --lines 0 --raw"

# Watch main EC2 logs
ssh ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com "pm2 logs movia-backend --lines 0 --raw"

# Check Redis queue
redis-cli -h 172.30.5.116 -p 6379 LLEN video-processing
```

## If Main EC2 is Unresponsive

1. **Restart from AWS Console**: EC2 → Select instance → Instance state → Reboot
2. **Wait 2-3 minutes** for services to restart
3. **Check PM2 processes**: `pm2 list`
4. **Restart if needed**: `pm2 restart all`
