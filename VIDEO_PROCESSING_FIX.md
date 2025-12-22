# Video Processing CPU Issue - FIXED ✅

## Problem Identified
Your **main EC2 (3.238.106.222)** was processing videos locally using FFmpeg, causing:
- **100% CPU utilization**
- Site becoming unresponsive
- FFmpeg processes being killed (SIGKILL)
- Videos uploads getting stuck

### Root Cause
- Main EC2 was calling `generateVideoVariants()` locally
- Video transcoding running on same server as web/API
- No worker queue configuration
- Small EC2 instance overwhelmed by video processing

## Solution Implemented

### 1. Redis Queue Configuration
Added to `/home/ubuntu/YT/backend/.env` on main EC2:
```bash
# Redis Queue Configuration (Worker EC2)
REDIS_HOST=172.30.5.116
REDIS_PORT=6379
REDIS_PASSWORD=

# Video Processing
ENABLE_LOCAL_TRANSCODING=false
USE_WORKER_QUEUE=true
```

### 2. Queue Files Created
**Main EC2** `/home/ubuntu/YT/backend/queues/`:
- `redis.js` - Redis connection (CommonJS)
- `videoQueue.js` - BullMQ queue configuration (CommonJS)

### 3. Video Controller Updated
Modified `/home/ubuntu/YT/backend/controllers/videoController.js`:
- Removed `generateVideoVariants` import
- Added `videoQueue` import
- Replaced local video processing with queue-based processing
- Videos now sent to worker EC2 via Redis queue

**Before:**
```javascript
generateVideoVariants(tmpVideoPath, req.user.id, video._id.toString(), videoHeight)
  .then(async (variants) => { /* process locally */ })
```

**After:**
```javascript
await videoQueue.add('process-video', {
  videoId: video._id.toString(),
  videoPath: tmpVideoPath,
  userId: req.user.id,
  videoHeight: videoHeight,
  videoUrl: videoUrl
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
});
```

### 4. Worker EC2 Ready
**Worker EC2 (172.30.5.116)** already configured with:
- Redis server listening on 172.30.5.116:6379
- BullMQ video worker running (PM2)
- FFmpeg 6.1.1 installed
- Concurrency: 2 videos at a time
- Rate limit: 5 jobs per minute

## Architecture Now

```
User uploads video
       ↓
Main EC2 (3.238.106.222)
  - Receives upload
  - Saves to Backblaze B2
  - Creates DB record
  - Sends job to Redis queue ← NEW!
  - Returns immediately
       ↓
Redis Queue (172.30.5.116:6379)
       ↓
Worker EC2 (172.30.5.116)
  - Picks up job from queue
  - Downloads video from B2
  - Transcodes to multiple qualities (360p, 480p, 720p, 1080p)
  - Uploads variants to B2
  - Updates DB with variant URLs
  - Cleans up temp files
```

## Benefits
✅ Main EC2 no longer does video processing
✅ CPU stays low on main EC2 (web/API responsive)
✅ Worker EC2 handles all transcoding
✅ Videos processed in background
✅ Site remains responsive during uploads
✅ Multiple videos can be uploaded without site hanging
✅ Worker can be scaled independently

## How to Test
1. Upload a video at https://xclub.asia/upload
2. Check main EC2 CPU - should stay low
3. Video appears immediately (original quality)
4. Worker processes in background
5. Variants appear after processing completes

## Monitoring

### Main EC2 Status
```bash
pm2 status
pm2 logs movia-backend --lines 20
```

### Worker EC2 Status
```bash
ssh -i "movia.pem" ubuntu@ec2-3-227-1-7.compute-1.amazonaws.com
pm2 status
pm2 logs videoWorker --lines 20
```

### Redis Connection Test
```bash
# From main EC2
redis-cli -h 172.30.5.116 -p 6379 PING
```

## CloudWatch Metrics
- **Top image**: Current state - Low CPU usage (~0.8%)
- **Middle image**: Problem state - 100% CPU when processing videos locally
- **Bottom image**: After fix - Normal operation (~2.8%)

## Files Modified
1. `/home/ubuntu/YT/backend/.env` (main EC2)
2. `/home/ubuntu/YT/backend/queues/redis.js` (main EC2)
3. `/home/ubuntu/YT/backend/queues/videoQueue.js` (main EC2)
4. `/home/ubuntu/YT/backend/controllers/videoController.js` (main EC2)
5. `/home/ubuntu/YT/client/src/context/AdContext.js` (new smartlink URL)

## Backups Created
- `/home/ubuntu/YT/backend/controllers/videoController.js.backup`
- `/home/ubuntu/YT/backend/controllers/videoController.js.backup2`

## Additional Updates
- Smartlink ad URL updated to: `https://www.effectivegatecpm.com/idfx3p15i3?key=9d603a856f9d9a37ec5ef196269b06e7`
- Client rebuilt with new ad configuration

## Next Steps
1. ✅ Upload test videos - they should process without hanging site
2. ✅ Monitor main EC2 CPU - should stay under 10%
3. ✅ Check worker EC2 logs for processing activity
4. Consider upgrading worker EC2 if processing is slow

## Troubleshooting

### If videos don't process:
```bash
# Check worker EC2
ssh -i "movia.pem" ubuntu@ec2-3-227-1-7.compute-1.amazonaws.com
pm2 logs videoWorker --lines 50

# Check Redis connection
redis-cli -h 172.30.5.116 PING
```

### If main EC2 CPU is still high:
```bash
# Check if USE_WORKER_QUEUE is enabled
cat /home/ubuntu/YT/backend/.env | grep USE_WORKER_QUEUE

# Should show: USE_WORKER_QUEUE=true
```

### If queue jobs stuck:
```bash
# Connect to Redis and check queue
redis-cli -h 172.30.5.116
> KEYS *
> LLEN bull:video-processing:wait
```

---
**Date Fixed**: December 20, 2025
**Status**: ✅ Production Ready
