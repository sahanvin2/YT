# 🚀 Localhost Video Processing Setup - Complete Guide

## Overview

This guide will help you set up **HLS video processing** on your Windows localhost, so you can upload and process videos locally with GPU acceleration (NVIDIA).

---

## 📋 Prerequisites

### Required Software:
- ✅ **Node.js** v18+ (already installed)
- ✅ **MongoDB** (using Atlas cloud)
- ✅ **Redis** (Memurai or WSL2)
- ✅ **FFmpeg** with NVENC support
- ✅ **NVIDIA GPU** (for h264_nvenc encoding)

---

## Step 1: Install Redis (Windows)

### Option A: Memurai (Recommended)
```powershell
# Download and install Memurai
# https://www.memurai.com/get-memurai

# Start service
Start-Service Memurai

# Verify
memurai-cli ping
# Should return: PONG
```

### Option B: Docker
```powershell
# Pull and run Redis
docker run -d --name redis -p 6379:6379 redis:alpine

# Verify
docker ps
```

**See full guide:** [REDIS_SETUP_WINDOWS.md](REDIS_SETUP_WINDOWS.md)

---

## Step 2: Install FFmpeg with NVIDIA Support

### Download FFmpeg (GPU-enabled build)
```powershell
# Option 1: Download from official site
# https://www.gyan.dev/ffmpeg/builds/
# Get "ffmpeg-release-essentials.zip"

# Option 2: Use Chocolatey
choco install ffmpeg
```

### Add FFmpeg to PATH
```powershell
# Add to System Environment Variables
# Path: C:\ffmpeg\bin

# Verify installation
ffmpeg -version
ffmpeg -encoders | findstr nvenc
# Should show: h264_nvenc, hevc_nvenc
```

### Check GPU Support
```powershell
# Test NVIDIA encoder
ffmpeg -encoders | findstr nvenc

# Should show:
# h264_nvenc    (NVIDIA NVENC H.264 encoder)
# hevc_nvenc    (NVIDIA NVENC HEVC encoder)
```

---

## Step 3: Configure Environment Variables

Your `.env` file should have:
```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB
MONGO_URI=mongodb+srv://...

# Redis (localhost)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# B2 Storage
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_ACCESS_KEY_ID=your-key
B2_SECRET_ACCESS_KEY=your-secret
B2_BUCKET=movia-prod

# Email (Brevo - see EMAIL_SETUP_GUIDE.md)
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-smtp-key
```

---

## Step 4: Start Backend Services

### Terminal 1: Start Backend API
```bash
# Navigate to project
cd D:\MERN\Movia

# Install dependencies (if not done)
npm install

# Start backend
npm run dev
```

**Expected output:**
```
✅ Connected to MongoDB
✅ Server running on port 5000
✅ Connected to Redis for HLS queue
```

### Terminal 2: Start HLS Worker
```bash
# Navigate to project
cd D:\MERN\Movia

# Start HLS worker
node backend/hlsWorker.js
```

**Expected output:**
```
✅ HLS Worker connected to Redis
✅ HLS Worker started - waiting for jobs...
🎬 Checking for videos needing HLS processing...
```

---

## Step 5: Start Frontend

### Terminal 3: Start React App
```bash
# Navigate to client folder
cd D:\MERN\Movia\client

# Install dependencies (if not done)
npm install

# Start development server
npm start
```

**Expected output:**
```
Compiled successfully!

You can now view xclub-client in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

---

## Step 6: Upload and Process Video

### 1. Register/Login
1. Go to `http://localhost:3000`
2. Create account or login
3. Verify email (check spam folder)

### 2. Upload Video
1. Click **Upload** button in navbar
2. Select a video file (MP4, MKV, AVI, MOV)
3. Fill in video details:
   - Title
   - Description
   - Category (Movies/Series/Documentaries/Animation)
   - Genre
   - Thumbnail (optional)
4. Click **Upload Video**

### 3. Monitor Processing

**Backend Terminal (Terminal 1):**
```
📤 Video uploaded: video-id
✅ Video added to HLS queue
```

**HLS Worker Terminal (Terminal 2):**
```
🎬 Processing video: video-id
📊 Video info: 1920x1080, 30fps, 5.2MB
🎞️  Generating HLS variants:
  - 1080p (h264_nvenc)
  - 720p (h264_nvenc)
  - 480p (h264_nvenc)
  - 360p (h264_nvenc)
⏱️  Processing time: 45s
✅ HLS processing complete!
📦 Uploading to B2...
✅ Video published: video-id
```

### 4. Watch Video
1. Go to homepage
2. Video should appear after processing completes
3. Click to watch
4. Quality selector (⚙️) should show: Auto, 360p, 480p, 720p, 1080p

---

## Monitoring & Debugging

### Check Redis Queue
```bash
# Connect to Redis
redis-cli

# Check queue status
LLEN bull:hls-processing:waiting
LLEN bull:hls-processing:active
LLEN bull:hls-processing:completed
LLEN bull:hls-processing:failed

# View queue contents
LRANGE bull:hls-processing:waiting 0 -1
```

### Check Backend Logs
```bash
# View real-time logs
tail -f backend/logs/combined.log

# Or in PowerShell
Get-Content backend/logs/combined.log -Wait -Tail 50
```

### Check Video Status
```bash
# Query MongoDB
mongosh "your-mongodb-uri"
use movia
db.videos.find({}, {title: 1, processingStatus: 1, isPublished: 1})
```

---

## Troubleshooting

### 1. Redis Connection Error
```
❌ Redis connection error: ECONNREFUSED 127.0.0.1:6379
```

**Solution:**
```powershell
# Check if Redis is running
Get-Service Memurai

# Start if stopped
Start-Service Memurai

# Or for Docker
docker start redis
```

### 2. FFmpeg Not Found
```
❌ Error: FFmpeg not found in PATH
```

**Solution:**
```powershell
# Check if FFmpeg is installed
ffmpeg -version

# If not, add to PATH
$env:Path += ";C:\ffmpeg\bin"

# Make permanent:
# System Properties → Environment Variables → Path → Add C:\ffmpeg\bin
```

### 3. NVIDIA Encoder Not Found
```
❌ Error: Encoder 'h264_nvenc' not found
```

**Solution:**
- Make sure you have NVIDIA GPU
- Update NVIDIA drivers: https://www.nvidia.com/Download/index.aspx
- Download FFmpeg with NVENC support
- Test: `ffmpeg -encoders | findstr nvenc`

### 4. Video Stuck in Processing
```
Video status: processing (forever)
```

**Solution:**
```bash
# Check HLS worker logs
# Terminal 2 should show processing activity

# Restart HLS worker
Ctrl+C
node backend/hlsWorker.js

# Check video in MongoDB
# processingStatus should be 'processing', 'completed', or 'failed'
```

### 5. Video Not Showing on Homepage
```
Video uploaded but not visible
```

**Solution:**
- Wait for processing to complete (check HLS worker logs)
- Video only appears when `isPublished: true`
- Admins can see all videos in `/admin` panel
- Check `processingStatus` in MongoDB

---

## Performance Tips

### GPU Encoding (NVIDIA)
Your system uses NVIDIA NVENC for hardware-accelerated encoding:
```bash
# Encoding command (automatic in worker):
ffmpeg -i input.mp4 -c:v h264_nvenc -preset fast -b:v 3M output.mp4
```

**Encoding Speed:**
- **1080p video (10 min):** ~2-3 minutes with NVENC
- **CPU encoding:** ~15-20 minutes
- **NVENC is 5-10x faster!**

### Optimize Redis
```bash
# Increase memory limit
redis-cli CONFIG SET maxmemory 512mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Monitor GPU Usage
```powershell
# Check GPU usage during encoding
nvidia-smi -l 1
```

---

## Complete Startup Sequence

### Quick Start (Copy & Paste)

**PowerShell Script:**
```powershell
# Terminal 1: Start Redis
Start-Service Memurai

# Terminal 2: Start Backend
cd D:\MERN\Movia
npm run dev

# Terminal 3: Start HLS Worker
cd D:\MERN\Movia
node backend/hlsWorker.js

# Terminal 4: Start Frontend
cd D:\MERN\Movia\client
npm start
```

### Or Use PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start all services
cd D:\MERN\Movia
pm2 start backend/server.js --name backend
pm2 start backend/hlsWorker.js --name hls-worker

# Start frontend separately
cd client
npm start

# View logs
pm2 logs

# Check status
pm2 status
```

---

## Video Processing Flow

```
1. User uploads video
   ↓
2. Video saved to database (isPublished: false)
   ↓
3. Video added to Redis queue
   ↓
4. HLS Worker picks up job
   ↓
5. FFmpeg generates HLS variants (360p, 480p, 720p, 1080p)
   ↓
6. Upload variants to B2 storage
   ↓
7. Update database (processingStatus: 'completed', isPublished: true)
   ↓
8. Video appears on homepage
```

---

## Expected Processing Times

| Video Length | Resolution | Processing Time (NVENC) | Processing Time (CPU) |
|-------------|-----------|------------------------|---------------------|
| 5 min | 1080p | ~1-2 min | ~8-10 min |
| 10 min | 1080p | ~2-3 min | ~15-20 min |
| 30 min | 1080p | ~5-8 min | ~45-60 min |
| 1 hour | 1080p | ~10-15 min | ~1.5-2 hours |

**Note:** Times vary based on:
- GPU model (RTX 3060 vs RTX 4090)
- Video complexity (high motion = slower)
- CPU model (if using software encoding)
- Disk speed (SSD vs HDD)

---

## Testing Checklist

- [ ] Redis running (`memurai-cli ping` → PONG)
- [ ] Backend started (port 5000)
- [ ] HLS worker running (listening for jobs)
- [ ] Frontend started (localhost:3000)
- [ ] FFmpeg with NVENC (`ffmpeg -encoders | findstr nvenc`)
- [ ] MongoDB connected
- [ ] Email configured (optional but recommended)
- [ ] Upload video test
- [ ] Processing completes successfully
- [ ] Video appears on homepage
- [ ] Playback works with quality selection

---

## Summary

**Services Running:**
1. **Redis** (port 6379) - Job queue
2. **Backend** (port 5000) - API server
3. **HLS Worker** - Video processing
4. **Frontend** (port 3000) - React app

**Video Processing:**
- Upload → Queue → Process (NVENC) → Upload to B2 → Publish

**Video Visibility:**
- Hidden until `isPublished: true`
- Only appears after processing completes
- Admins can see all videos

---

**Last Updated:** December 26, 2025
**Status:** ✅ Ready for localhost video processing with GPU acceleration
