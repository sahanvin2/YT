# ✅ HLS System - Pre-Flight Checklist

Before starting your HLS video processing system, verify all requirements are met.

---

## 📋 System Requirements

### Hardware
- [ ] NVIDIA RTX 2050 GPU (or compatible NVIDIA GPU)
- [ ] At least 8GB RAM
- [ ] At least 50GB free disk space (for temporary processing)
- [ ] Stable internet connection (for B2 uploads)

### Software
- [ ] Windows 10/11
- [ ] Node.js installed (v14 or higher)
- [ ] NVIDIA drivers updated (latest version)
- [ ] MongoDB installed and running
- [ ] Redis installed
- [ ] PowerShell available

---

## 🔧 Installation Checklist

### Step 1: Install Redis
```powershell
choco install redis-64
```
- [ ] Redis installed
- [ ] Redis starts with: `redis-server`
- [ ] Redis responds to: `redis-cli ping` → PONG

### Step 2: Verify GPU
```powershell
nvidia-smi
```
- [ ] GPU shows: NVIDIA GeForce RTX 2050
- [ ] Driver version displayed
- [ ] No errors shown

### Step 3: Install Dependencies
```powershell
npm install
```
- [ ] All packages installed successfully
- [ ] No error messages
- [ ] `node_modules/` folder created

### Step 4: Configure Environment
Edit `.env` file:
- [ ] `REDIS_HOST=127.0.0.1` set
- [ ] `REDIS_PORT=6379` set
- [ ] `MONGODB_URI` set
- [ ] `B2_ACCESS_KEY_ID` set
- [ ] `B2_SECRET_ACCESS_KEY` set
- [ ] `B2_BUCKET` set
- [ ] `CDN_BASE` set

---

## 🚀 Startup Checklist

### Terminal 1: Redis
```powershell
redis-server
```
- [ ] Redis starts without errors
- [ ] Shows "Ready to accept connections"
- [ ] Port 6379 is listening

### Terminal 2: MongoDB
```powershell
# If not running as service
mongod
```
- [ ] MongoDB starts successfully
- [ ] Shows "Waiting for connections"
- [ ] Port 27017 is listening

### Terminal 3: HLS Worker
```powershell
npm run hls-worker
```
- [ ] Worker starts successfully
- [ ] Shows "🚀 HLS WORKER STARTED"
- [ ] Shows GPU: "NVIDIA GeForce RTX 2050"
- [ ] Shows "✨ Status: Ready for processing"
- [ ] Connected to Redis
- [ ] Connected to MongoDB

### Terminal 4: Main Server
```powershell
npm start
```
- [ ] Server starts on port 5000 (or configured port)
- [ ] Shows "✅ Connected to MongoDB"
- [ ] Shows "🌐 Bunny CDN configured"
- [ ] No error messages

---

## 🧪 Testing Checklist

### Test 1: Upload Video
- [ ] Navigate to upload page
- [ ] Select a small test video (1-2 minutes)
- [ ] Add title and description
- [ ] Click upload
- [ ] Upload succeeds
- [ ] Response shows `processingStatus: "queued"`

### Test 2: Worker Processing
Check worker terminal:
- [ ] Shows "🎬 Starting HLS processing"
- [ ] Shows video ID
- [ ] Shows video info (resolution, duration)
- [ ] Shows encoding qualities
- [ ] Shows progress for each quality
- [ ] Shows "✅ HLS processing completed"

### Test 3: Check Status
```powershell
# Get video ID from upload response
curl http://localhost:5000/api/processing/{videoId}/status
```
- [ ] Status returns successfully
- [ ] Shows `status: "completed"`
- [ ] Shows `hlsUrl` with master.m3u8
- [ ] Shows `isReady: true`

### Test 4: Verify Storage
Check B2 bucket:
- [ ] Folder created: `videos/{userId}/{videoId}/`
- [ ] File exists: `master.m3u8`
- [ ] Folders exist: `hls_1080p/`, `hls_720p/`, etc.
- [ ] Segment files exist: `segment_000.ts`, etc.

### Test 5: Test Playback
Update frontend with HLS player:
- [ ] HLS.js installed
- [ ] Video player component updated
- [ ] Load video in browser
- [ ] Video plays successfully
- [ ] Quality switching works
- [ ] No buffering issues

---

## 🔍 Monitoring Checklist

### Redis Queue
```powershell
redis-cli
> LLEN bullmq:hls-processing:wait
> LLEN bullmq:hls-processing:active
```
- [ ] Can connect to Redis CLI
- [ ] Queue commands work
- [ ] Numbers make sense (0 or positive)

### GPU Usage
```powershell
nvidia-smi -l 1
```
- [ ] GPU usage shows 85-95% during processing
- [ ] Temperature is reasonable (<80°C)
- [ ] No errors displayed

### Disk Space
```powershell
# Check tmp directory
Get-ChildItem -Path "tmp/uploads" -Recurse | Measure-Object -Property Length -Sum
```
- [ ] Temp directory exists
- [ ] Files are being cleaned up after processing
- [ ] Disk space is not growing indefinitely

---

## 🎨 Frontend Integration Checklist

### Install Dependencies
```bash
cd client
npm install hls.js
```
- [ ] HLS.js installed in package.json
- [ ] No installation errors

### Update Video Player
- [ ] Import HLS.js in player component
- [ ] Check for HLS support
- [ ] Load HLS source
- [ ] Attach to video element
- [ ] Handle errors
- [ ] Cleanup on unmount

### Test in Browser
- [ ] Video player loads
- [ ] HLS video plays
- [ ] Quality selector appears (if implemented)
- [ ] Seeking works
- [ ] No console errors

---

## 📊 Performance Checklist

### Processing Speed
For a 10-minute 1080p video:
- [ ] Processing completes in ~5 minutes or less
- [ ] GPU utilization is high (85-95%)
- [ ] No crashes or errors
- [ ] All qualities generated

### Storage Efficiency
- [ ] HLS files are smaller than original
- [ ] Original file is deleted after processing
- [ ] No MP4 files remain in storage
- [ ] Only HLS segments (.ts) and playlists (.m3u8)

### Streaming Quality
- [ ] No buffering during playback
- [ ] Smooth quality transitions
- [ ] Fast seek/skip performance
- [ ] Works on mobile devices

---

## 🚨 Troubleshooting Checklist

If something doesn't work:

### Worker Issues
- [ ] Check Redis is running: `redis-cli ping`
- [ ] Check MongoDB is running: `mongosh --eval "db.version()"`
- [ ] Check .env file has correct values
- [ ] Check GPU is detected: `nvidia-smi`
- [ ] Restart worker: `Ctrl+C` → `npm run hls-worker`

### Processing Fails
- [ ] Check worker logs for error message
- [ ] Check disk space: `Get-PSDrive C`
- [ ] Check B2 credentials in .env
- [ ] Check video file is not corrupted
- [ ] Try with smaller test video

### Playback Issues
- [ ] Check HLS.js is installed
- [ ] Check browser console for errors
- [ ] Check CDN_BASE is set correctly
- [ ] Test master.m3u8 URL directly
- [ ] Check CORS settings

---

## ✅ Final Verification

### System Health
- [ ] All services running (Redis, MongoDB, Worker, Server)
- [ ] No error messages in any terminal
- [ ] GPU temperature is normal
- [ ] Disk space is adequate

### Functionality
- [ ] Can upload videos
- [ ] Videos are processed successfully
- [ ] HLS files are uploaded to B2
- [ ] Videos can be streamed
- [ ] Processing status API works

### Performance
- [ ] Processing is 2-3x realtime
- [ ] GPU utilization is high
- [ ] No buffering during playback
- [ ] Quality switching works

---

## 🎉 Ready for Production

If all items are checked, your HLS system is ready!

### Recommended Next Steps:
1. Set Redis as Windows service (auto-start)
2. Set MongoDB as Windows service (auto-start)
3. Create startup script for HLS worker
4. Set up monitoring/alerting
5. Test with various video formats
6. Test with longer videos (30-60 minutes)
7. Monitor GPU temperature over extended periods
8. Set up automated cleanup task (weekly)

---

## 📞 Support Resources

- **Setup Guide**: `HLS_SETUP_GUIDE.md`
- **Migration Guide**: `MIGRATION_TO_HLS.md`
- **Quick Reference**: `HLS_QUICK_REFERENCE.md`
- **Implementation Summary**: `HLS_IMPLEMENTATION_SUMMARY.md`
- **This Checklist**: `HLS_CHECKLIST.md`

---

**Date Completed**: _____________

**Tested By**: _____________

**Notes**: _____________________________________________

---

**System Status**: 
- [ ] ✅ All checks passed - Ready for production
- [ ] ⚠️ Minor issues - Needs attention
- [ ] ❌ Critical issues - Not ready
