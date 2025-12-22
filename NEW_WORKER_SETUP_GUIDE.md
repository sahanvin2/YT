# 🚀 Setup New Bigger EC2 Worker for Video Processing

## Current Status ✅

### System Disabled (Temporary):
- ✅ **Workers disabled**: `WORKERS_ENABLED=false`
- ✅ **Worker 1** (3.215.16.71): PM2 stopped
- ✅ **Worker 2** (98.80.144.199): PM2 stopped  
- ✅ **Worker 3** (3.227.1.7): PM2 stopped
- ✅ **Main EC2** (3.238.106.222): Backend running, website ONLINE
- ✅ **Website**: https://xclub.asia - Available (no video processing)

### What's Working:
- ✅ Users can browse videos
- ✅ Users can upload videos (saved but not processed)
- ✅ Website fully functional
- ❌ Video transcoding/decoding disabled

---

## 📋 When You Create New Bigger EC2

### Step 1: AWS Console - Launch Instance

**Recommended Specs for Heavy Processing:**
```
Instance Type: c5.4xlarge (16 vCPU, 32GB RAM)
  - Can handle 10+ videos simultaneously
  - Or: c5.2xlarge (8 vCPU, 16GB RAM) for moderate load
  
AMI: Ubuntu Server 22.04 LTS
Storage: 100 GB gp3 SSD
Region: Same as Main EC2 (us-east-1)
```

**Security Group Settings:**
```
Inbound Rules:
1. SSH (22)
   - Source: Your IP or 0.0.0.0/0
   
2. Custom TCP (3001)  
   - Source: 3.238.106.222/32 (Main EC2)
   - Description: Receive transcode jobs from main EC2

Outbound Rules:
- All traffic (default)
```

**Key Pair:**
- Use existing: `movia.pem`
- Or create new and share with me

---

## 🔧 Step 2: Setup Commands (Run These After EC2 is Ready)

### A. Initial Setup (on new worker)

```bash
# SSH to new worker
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@NEW_WORKER_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install FFmpeg
sudo apt install -y ffmpeg

# Verify installations
node --version    # Should show v18.x.x
npm --version
ffmpeg -version

# Install PM2
sudo npm install -g pm2

# Create worker directory
mkdir -p /home/ubuntu/worker
cd /home/ubuntu/worker
```

### B. Install Dependencies

```bash
cd /home/ubuntu/worker

# Initialize npm
npm init -y

# Install packages
npm install express axios fluent-ffmpeg ffmpeg-static ffprobe-static cors dotenv
```

### C. Create Worker Server

I'll create the `server.js` and `ecosystem.config.js` files for you. Just provide:
1. **New Worker IP address**
2. **Tell me when EC2 is ready**

---

## 🎯 Step 3: Connect to Main EC2 (I'll Do This)

When you give me the new worker IP, I will:

### A. Update Main EC2 Configuration
```bash
# Set new worker IP
WORKER_IPS=NEW_WORKER_IP
WORKERS_ENABLED=true

# Restart backend
pm2 restart backend
```

### B. Upload Worker Files
- Create optimized `server.js` for c5.4xlarge
- Configure multi-threading for FFmpeg
- Setup PM2 auto-restart

### C. Test Connection
```bash
# From main EC2, test worker
curl http://NEW_WORKER_IP:3001/health

# Should return: {"status":"healthy","jobs":0,...}
```

---

## 📊 What to Expect After Setup

### Single Bigger Worker (c5.4xlarge):

**Capacity:**
- ✅ 10-15 videos processing simultaneously
- ✅ 30-50 videos per hour
- ✅ 720+ videos per day
- ✅ No crashes under heavy load

**Cost:**
- ~$0.68/hour = ~$16/day (if running 24/7)
- Can stop when not needed to save costs

**Performance:**
- 1080p video (5min): ~3-5 minutes processing
- 720p video (5min): ~2-3 minutes processing
- Parallel processing: Up to 10 videos at once

---

## 🔄 How It Will Work

```
User uploads video
  ↓
Main EC2 receives upload
  ↓
Saves to B2 storage
  ↓
Adds to job queue
  ↓
Checks worker health
  ↓
Sends job to NEW_WORKER_IP:3001
  ↓
Worker processes with FFmpeg
  - Creates 360p, 480p, 720p, 1080p variants
  - Uses 8-16 CPU cores
  - Parallel processing
  ↓
Worker uploads variants to B2
  ↓
Worker sends callback to Main EC2
  ↓
Main EC2 updates video status: "completed"
  ↓
Video available for streaming
```

---

## ⚙️ Optimization for Bigger EC2

### FFmpeg Settings (I'll configure):

```javascript
// For c5.4xlarge (16 cores)
const ffmpegOptions = [
  '-threads 4',           // Use 4 threads per transcode
  '-preset fast',         // Fast encoding
  '-crf 23',             // Quality
  '-movflags +faststart'  // Web optimized
];

// Allows 4 videos in parallel (4 threads × 4 jobs = 16 cores)
```

### PM2 Configuration:

```javascript
{
  name: 'video-worker',
  instances: 1,
  max_memory_restart: '28G',  // Restart if exceeds 28GB
  autorestart: true
}
```

---

## 📝 Information Needed from You

When you create the new EC2, please provide:

1. **Public IP address**: `XX.XX.XX.XX`
2. **Instance ID**: `i-XXXXXXXXXX`
3. **Instance type**: (e.g., c5.4xlarge, c5.2xlarge)
4. **Security group**: Confirm port 3001 is open from 3.238.106.222/32

Then I will:
- ✅ Upload worker server files
- ✅ Configure for your instance size
- ✅ Connect to main EC2
- ✅ Test video processing
- ✅ Enable system

---

## 🚨 Current Videos Status

**Videos uploaded during downtime:**
- Saved to database
- Stored in B2 storage
- Status: "pending" or "queued"
- Will be processed once worker is connected

**After enabling new worker:**
- I'll run: `retryFailedVideos()` function
- All pending videos will be processed
- Usually completes within 1-2 hours

---

## 🎯 Advantages of Single Bigger EC2

**vs Multiple Small Workers:**
- ✅ Simpler management (one instance)
- ✅ Better resource utilization
- ✅ Lower network overhead
- ✅ Easier monitoring
- ✅ Cost effective for consistent load

**When to add more workers:**
- If single worker CPU consistently >80%
- If job queue consistently >20 videos
- If videos taking >10 minutes to process

---

## 📞 Next Steps

**What you need to do:**
1. Launch new EC2 with specs above
2. Give me the IP address
3. Confirm SSH access with movia.pem

**What I'll do:**
1. Setup worker server
2. Install dependencies  
3. Configure FFmpeg optimization
4. Connect to main EC2
5. Enable system
6. Process pending videos
7. Test with new upload

**Estimated setup time:** 10-15 minutes after you provide credentials

---

## ⚡ Quick Reference

**To check system status later:**
```powershell
ssh -i "C:\Users\User\Downloads\movia.pem" ubuntu@3.238.106.222 "cat /home/ubuntu/YT/.env | grep WORKER"
```

**To stop worker temporarily:**
```bash
ssh -i movia.pem ubuntu@WORKER_IP "pm2 stop video-worker"
```

**To start worker:**
```bash
ssh -i movia.pem ubuntu@WORKER_IP "pm2 start video-worker"
```

**To check worker status:**
```bash
ssh -i movia.pem ubuntu@WORKER_IP "pm2 logs video-worker --lines 20"
```

---

## 💰 Cost Optimization Tips

**Auto-stop during off-hours:**
```bash
# Cron job on main EC2 (stop at 2 AM, start at 8 AM)
0 2 * * * aws ec2 stop-instances --instance-ids i-WORKER-ID
0 8 * * * aws ec2 start-instances --instance-ids i-WORKER-ID
```

**Scale based on queue:**
- If queue < 5: Use t3.xlarge ($0.17/hr)
- If queue > 10: Use c5.2xlarge ($0.34/hr)
- If queue > 20: Use c5.4xlarge ($0.68/hr)

Ready when you are! Just provide the new EC2 IP address. 🚀
