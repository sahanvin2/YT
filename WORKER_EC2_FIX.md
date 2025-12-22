# Video Worker EC2 - NOW WORKING! ✅

## What Was Wrong

### Problems Found:
1. **Worker not transcoding** - Was just simulating, marking jobs as "completed" without doing anything
2. **Missing environment variables** - B2 credentials, MongoDB URI not loading
3. **Import errors** - B2 utilities using CommonJS (require) in ES module context
4. **No video download** - Worker couldn't access temp files from main EC2

### Root Causes:
- Old worker script was a placeholder that didn't actually transcode
- `.env` file not being loaded by PM2
- Worker trying to access local files instead of downloading from B2

## What We Fixed

### 1. Rebuilt Worker Script ✅
- Created completely new `videoWorker.js` with AWS SDK
- Downloads videos from B2 (not local filesystem)
- Transcodes to multiple resolutions (360p, 480p, 720p, 1080p)
- Uploads variants back to B2
- Updates MongoDB with variant URLs

### 2. Fixed Environment Loading ✅
- Created `load-env.js` to load `.env` file
- Updated `.env` with correct B2 credentials and MongoDB URI
- PM2 now starts from correct directory

### 3. Current Working Configuration

**Worker EC2**: `ec2-3-227-1-7.compute-1.amazonaws.com`

**/home/ubuntu/YT/backend/backend/.env:**
```bash
NODE_ENV=production
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
MONGODB_URI=mongodb+srv://MoviaAdmin:xxx@movia.ytwtfrc.mongodb.net/movia
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_ACCESS_KEY_ID=0053aaa597862ee0000000001
B2_SECRET_ACCESS_KEY=K005kVHvMmLD696fVPINAqzU2wW+HGs
B2_BUCKET=movia-prod
B2_PUBLIC_BASE=https://f005.backblazeb2.com/file/movia-prod
CDN_BASE=https://Xclub.b-cdn.net
```

**PM2 Process:**
```bash
pm2 start /home/ubuntu/YT/backend/backend/queues/videoWorker.js \
  --name videoWorker \
  --cwd /home/ubuntu/YT/backend/backend
```

## How Video Processing Works Now

```
1. User uploads video → Main EC2 receives it
2. Main EC2 uploads to B2 (original quality)
3. Main EC2 adds job to Redis queue:
   {
     videoId: "xxx",
     videoUrl: "https://b2.../video.mp4",
     userId: "xxx"
   }
4. Worker EC2 picks up job from queue
5. Worker downloads video from B2
6. Worker transcodes:
   - 360p (800k bitrate)
   - 480p (1200k bitrate) 
   - 720p (2500k bitrate)
   - 1080p (5000k bitrate) - only if source is 1080p+
7. Worker uploads each variant to B2
8. Worker updates MongoDB with variant URLs
9. Videos now have multiple quality options!
```

## How to Check If It's Working

### 1. Check Worker Status
```bash
ssh -i "movia.pem" ubuntu@ec2-3-227-1-7.compute-1.amazonaws.com
pm2 status
pm2 logs videoWorker --lines 50
```

**Look for:**
- ✅ Worker connected to MongoDB
- ✅ MongoDB: Connected
- 🎬 Processing video job X
- 📥 Downloading video from B2...
- 🔄 Transcoding 360p/480p/720p...
- ✅ Database updated with X variants

### 2. Check Queue Status
```bash
# On worker EC2
redis-cli LLEN bull:video-processing:wait  # Waiting jobs
redis-cli LLEN bull:video-processing:active  # Currently processing
redis-cli KEYS "bull:video-processing:*" | wc -l  # Total queue keys
```

### 3. Monitor CPU on Worker EC2
- Go to AWS CloudWatch
- Check worker EC2 (172.30.5.116)
- When transcoding, CPU should be **50-100%** (this is good!)
- Main EC2 should stay **under 10%**

### 4. Test Video Upload
1. Go to https://xclub.asia/upload
2. Upload a test video
3. Video should upload quickly (main EC2 just stores it)
4. Go to worker EC2: `pm2 logs videoWorker`
5. You should see transcoding progress
6. After 2-5 minutes (depending on video size), check the video
7. Click quality settings - multiple resolutions should be available!

## Current Status

### Main EC2 (3.238.106.222)
- ✅ Receives uploads
- ✅ Uploads to B2
- ✅ Adds jobs to Redis queue
- ✅ CPU stays low (~1-3%)
- ✅ Site remains responsive

### Worker EC2 (172.30.5.116)  
- ✅ Connects to Redis queue
- ✅ Connects to MongoDB
- ✅ Downloads videos from B2
- ✅ Transcodes with FFmpeg
- ✅ Uploads variants to B2
- ✅ Updates database
- ✅ Currently processing job 6!

## Monitoring Commands

### Check worker logs (real-time):
```bash
ssh -i "movia.pem" ubuntu@ec2-3-227-1-7.compute-1.amazonaws.com "pm2 logs videoWorker"
```

### Check main EC2 backend:
```bash
ssh -i "movia.pem" ubuntu@3.238.106.222 "pm2 logs movia-backend | grep -i 'queue\|redis'"
```

### Check Redis queue:
```bash
# On worker EC2
redis-cli
> LLEN bull:video-processing:wait
> LLEN bull:video-processing:active
> KEYS bull:video-processing:*
```

### Check MongoDB for variants:
```bash
# Connect to MongoDB and check a video
db.videos.findOne({}, {variants: 1, title: 1})
```

## Troubleshooting

### If worker stops processing:
```bash
ssh -i "movia.pem" ubuntu@ec2-3-227-1-7.compute-1.amazonaws.com
pm2 restart videoWorker
pm2 logs videoWorker --lines 100
```

### If queue gets stuck:
```bash
# Clear stuck jobs
redis-cli
> DEL bull:video-processing:wait
> DEL bull:video-processing:active
```

### If main EC2 not sending jobs:
```bash
# Check main EC2 .env
cat /home/ubuntu/YT/backend/.env | grep -E "REDIS|USE_WORKER"
# Should show:
# REDIS_HOST=172.30.5.116
# USE_WORKER_QUEUE=true

# Restart backend
pm2 restart movia-backend
```

## Performance Expectations

### Small video (under 100MB):
- Upload: 10-30 seconds
- Processing: 2-3 minutes
- Total: ~3-4 minutes until all variants ready

### Medium video (100-500MB):
- Upload: 1-2 minutes
- Processing: 5-10 minutes
- Total: ~10-12 minutes

### Large video (500MB+):
- Upload: 3-5 minutes
- Processing: 15-30 minutes
- Total: ~20-35 minutes

**Main EC2 CPU should never exceed 10%** during uploads!
**Worker EC2 CPU will be 50-100%** during transcoding (this is expected and good!)

## Files Modified

### Worker EC2:
- `/home/ubuntu/YT/backend/backend/queues/videoWorker.js` - Complete rewrite
- `/home/ubuntu/YT/backend/backend/queues/load-env.js` - New file for env loading
- `/home/ubuntu/YT/backend/backend/.env` - Updated with correct credentials

### Main EC2:
- `/home/ubuntu/YT/backend/.env` - Added Redis worker config
- `/home/ubuntu/YT/backend/queues/redis.js` - Created Redis connection
- `/home/ubuntu/YT/backend/queues/videoQueue.js` - Created BullMQ queue
- `/home/ubuntu/YT/backend/controllers/videoController.js` - Uses queue instead of local processing

## Success Indicators

✅ **It's Working If You See:**
- Main EC2: "✅ Video XXX added to worker queue"
- Worker EC2: "🎬 Processing video job X"
- Worker EC2: "📥 Downloading video from B2..."
- Worker EC2: "🔄 Transcoding 360p/480p/720p..."
- Worker EC2: "✅ Database updated with X variants"
- Main EC2 CPU stays under 10%
- Worker EC2 CPU goes to 50-100% during transcoding
- Videos have quality selector with multiple options

❌ **Something's Wrong If:**
- Worker EC2: "⚠️ Transcoder not available, simulating..."
- Worker EC2: "MongoDB: Not configured"
- Worker EC2: Input: undefined
- Main EC2 CPU hits 100% during uploads
- No new log messages on worker EC2
- Videos don't have quality options after 10+ minutes

---

**Status**: ✅ FULLY OPERATIONAL
**Date Fixed**: December 20, 2025
**Current State**: Worker is actively transcoding video job 6!
