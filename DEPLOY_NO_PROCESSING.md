# 🚀 Deploy Video Processing Removal to EC2

## Problem
EC2 instance is getting 40% CPU usage because videos are being processed for multiple quality formats. This makes the site unresponsive.

## Solution
All video processing has been removed. Videos now upload **directly to B2** with **zero processing**.

## What Changed

✅ **Removed:**
- HLS video processing
- Multiple quality variant generation
- FFmpeg video encoding
- Auto-thumbnail generation (CPU-intensive)
- Video duration/resolution probing (CPU-intensive)
- All video processing queues

✅ **Now:**
- Direct upload to B2 storage
- Videos ready immediately
- No CPU usage for processing
- No encoding overhead

## Deployment Steps

### Option 1: Using the Script (Recommended)

```bash
# SSH into EC2
ssh -i movia.pem ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com

# Run deployment script
cd ~/YT
chmod +x deploy-no-processing.sh
./deploy-no-processing.sh
```

### Option 2: Manual Steps

```bash
# 1. SSH into EC2
ssh -i movia.pem ubuntu@ec2-3-238-106-222.compute-1.amazonaws.com

# 2. Navigate to app directory
cd ~/YT

# 3. Pull latest code
git pull origin main

# 4. Install dependencies
npm install

# 5. Stop any HLS workers (if running)
pm2 stop hls-worker 2>/dev/null
pm2 delete hls-worker 2>/dev/null

# 6. Restart backend
pm2 restart backend

# 7. Check status
pm2 status
pm2 logs backend --lines 20
```

## Verification

After deployment, verify:

1. **Check PM2 status:**
   ```bash
   pm2 status
   ```
   Should show only `backend` running (no `hls-worker`)

2. **Check backend logs:**
   ```bash
   pm2 logs backend --lines 20
   ```
   Should show: "Server running" with no processing errors

3. **Test upload:**
   - Upload a video through the site
   - Video should be ready immediately
   - No "processing" status
   - Check CPU usage: `top` or `htop`
   - CPU should stay low during upload

4. **Check for processing errors:**
   ```bash
   pm2 logs backend | grep -i "processing\|hls\|queue"
   ```
   Should show no processing-related errors

## If EC2 is Unresponsive

If the EC2 instance is currently unresponsive due to video processing:

1. **Wait a few minutes** for current processing to complete
2. **Or restart the instance** from AWS Console:
   - Go to EC2 Dashboard
   - Select instance
   - Actions → Instance State → Reboot
3. **Then deploy** using the steps above

## Expected Results

✅ **Before:** Videos processed → High CPU → Site slow/unresponsive  
✅ **After:** Videos upload directly → Low CPU → Site fast and responsive

✅ **CPU Usage:** Should drop from 40%+ to <5% during uploads  
✅ **Upload Speed:** Faster (no processing delay)  
✅ **Site Responsiveness:** Much better (no CPU blocking)

---

**All code changes are on GitHub and ready to deploy!** 🎉

