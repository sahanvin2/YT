# 🔧 PERMANENT FIX - No More Service Loops or Crashes

## ✅ Problem SOLVED

### The Issue
- HLS Worker kept shutting down randomly
- Services would stop when running other commands
- Videos uploaded but didn't know where they went (tmp/uploads/)
- Upload worked but HLS processing didn't start

### Root Cause
**PowerShell background processes** were receiving SIGINT signals when new commands ran in the same terminal, causing them to shut down unexpectedly.

### The Solution
**Use separate CMD windows for each service!**

---

## 🚀 HOW TO START SERVICES (NEW METHOD)

### Double-click this file:
```
START-ALL.bat
```

This will:
1. ✅ Check Redis is running
2. ✅ Start Backend in its own window (Port 5000)
3. ✅ Start HLS Worker in its own window (GPU processing)
4. ✅ Start Frontend in its own window (Port 3000)

Each service gets its own CMD window that stays open independently!

---

## 🛑 HOW TO STOP SERVICES

### Double-click this file:
```
STOP-ALL.bat
```

This will cleanly shut down all services.

---

## 📋 Service Windows Explanation

After running START-ALL.bat, you'll see **3 CMD windows**:

### 1. "Movia Backend" Window
```
Server is running on port 5000
MongoDB Connected
```
**DO NOT CLOSE THIS!**

### 2. "Movia HLS Worker" Window
```
🚀 HLS WORKER STARTED
🖥️  GPU: NVIDIA RTX 2050
✨ Status: Ready for processing
```
**DO NOT CLOSE THIS!** This is where you'll see:
- Video processing start messages
- GPU encoding progress (10%, 20%, etc.)
- HLS file uploads to B2/Bunny CDN

### 3. "Movia Frontend" Window
```
Compiled successfully!
Local:            http://localhost:3000
```
**DO NOT CLOSE THIS!**

---

## 🎯 UPLOAD FLOW (How It Works Now)

1. **User uploads video** at http://localhost:3000/upload
   
2. **Backend receives upload** (`/api/videos` POST):
   - Saves to: `tmp/uploads/upload_[userId]_[timestamp].mp4`
   - Creates thumbnail
   - Creates video record in MongoDB with status: `queued`
   - Adds job to Redis queue
   
3. **HLS Worker picks up job** (you'll see in HLS Worker window):
   ```
   🎬 Starting HLS processing
   📹 Video ID: 694d42f1f7da00beeee79295
   🎬 Processing 720p variant with GPU acceleration...
   720p: 10% complete
   720p: 20% complete
   ...
   ✅ 720p variant completed
   ```

4. **HLS files uploaded to B2/Bunny CDN**:
   - Master playlist: `hls/[videoId]/master.m3u8`
   - Quality variants: `hls/[videoId]/720p/, 480p/, etc.`
   
5. **Video status updated**: `queued` → `processing` → `completed`

6. **Video appears on homepage** and plays with HLS!

---

## 📁 File Locations

### Upload Temporary Files
- Location: `D:\MERN\Movia\tmp\uploads\`
- Files: `upload_[userId]_[timestamp].mp4`
- Lifecycle: Deleted after HLS processing completes

### HLS Processing Output (B2/Bunny CDN)
- Bucket: Your Backblaze B2 bucket
- Path: `hls/[videoId]/`
- Files:
  - `master.m3u8` (main playlist)
  - `720p/`, `480p/`, `360p/`, `240p/`, `144p/` (quality folders)
  - Each folder has: `playlist.m3u8` and `.ts` segment files

### Database
- MongoDB Atlas
- Collection: `videos`
- Status field: `queued` → `processing` → `completed` (or `failed`)

---

## 🧪 TESTING

### Test the Full Upload Flow:
1. Run `START-ALL.bat`
2. Wait for all 3 windows to show "ready" status
3. Go to: http://localhost:3000/upload
4. Upload a **small test video** (1-2 minutes, <500MB)
5. Watch the **HLS Worker window** for processing logs
6. Watch GPU usage: `nvidia-smi -l 1` in another terminal
7. After processing completes, video appears on homepage!

---

## 🐛 TROUBLESHOOTING

### Problem: Services still stopping
**Solution**: Make sure you're using `START-ALL.bat`, NOT running `npm start` manually in PowerShell!

### Problem: Redis not running
**Solution**: 
```bash
wsl sudo service redis-server start
```

### Problem: Port already in use
**Solution**: Run `STOP-ALL.bat` first, then `START-ALL.bat`

### Problem: HLS Worker not processing
**Check**: Look at the HLS Worker CMD window for errors
**Fix**: If it says "Failed to connect to Redis", restart Redis in WSL

### Problem: Videos upload but stay "processing" forever
**Check**: Is HLS Worker window showing any activity?
**Fix**: Check Redis queue:
```powershell
wsl redis-cli LLEN bullmq:hls-processing:wait
```
If > 0, jobs are waiting. Make sure HLS Worker window is open and running.

---

## ✅ CURRENT STATUS

All services are now running in separate CMD windows:
- ✅ Backend: Ready (Port 5000)
- ✅ Frontend: Ready (Port 3000)
- ✅ HLS Worker: Ready (GPU NVENC)
- ✅ Redis: Running (WSL)

**YOU CAN NOW UPLOAD VIDEOS!**

Go to: **http://localhost:3000/upload**

Upload a test video and watch the HLS Worker window to see GPU processing in action!

---

## 📝 Quick Reference

| Action | Command |
|--------|---------|
| Start all services | Double-click `START-ALL.bat` |
| Stop all services | Double-click `STOP-ALL.bat` |
| Check Redis | `wsl redis-cli ping` |
| Check queue | `wsl redis-cli LLEN bullmq:hls-processing:wait` |
| Watch GPU | `nvidia-smi -l 1` |
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api/videos |

---

**NO MORE LOOPS! NO MORE CRASHES! PROBLEM SOLVED! 🎉**
