# 🎬 HLS Video Processing - Quick Reference

## 🚀 Quick Start Commands

### Start Everything
```powershell
# Terminal 1: Redis
redis-server

# Terminal 2: HLS Worker
npm run hls-worker

# Terminal 3: Main Server
npm start
```

### Or use PowerShell script
```powershell
.\start-hls-worker.ps1
```

## 📊 System Architecture

```
┌─────────────┐
│   Upload    │
│  (Any fmt)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Save Local  │
│ tmp/uploads │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Redis Queue │
│  (BullMQ)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ HLS Worker  │
│  RTX 2050   │
│  (NVENC)    │
└──────┬──────┘
       │
       ├─→ 1080p HLS
       ├─→ 720p HLS
       ├─→ 480p HLS
       ├─→ 360p HLS
       ├─→ 240p HLS
       └─→ 144p HLS
       │
       ▼
┌─────────────┐
│  Upload B2  │
│ (HLS files) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  CDN Serve  │
│ (Streaming) │
└─────────────┘
```

## 🎯 Upload Formats Accepted

✅ .mp4 (H.264, H.265, etc.)  
✅ .mkv (Matroska)  
✅ .mov (QuickTime)  
✅ .avi (Video Interleave)  
✅ .webm (WebM)  
✅ .flv (Flash Video)  
✅ .wmv (Windows Media)  
✅ .m4v (iTunes Video)  

**All formats → HLS output** (universal compatibility)

## 📁 Storage Structure

```
B2 Bucket: movia-prod
└── videos/
    └── {userId}/
        └── {videoId}/
            ├── master.m3u8           ← Master playlist
            ├── hls_1080p/
            │   ├── playlist.m3u8     ← Quality playlist
            │   ├── segment_000.ts    ← 6-second chunks
            │   ├── segment_001.ts
            │   └── ...
            ├── hls_720p/
            ├── hls_480p/
            ├── hls_360p/
            ├── hls_240p/
            └── hls_144p/
```

## 🔧 GPU Encoding Settings

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Codec | h264_nvenc | NVIDIA hardware encoder |
| Preset | p4 | Medium speed/quality balance |
| Tune | hq | High quality optimization |
| Profile | high | H.264 High Profile |
| Pixel Format | yuv420p | 8-bit color (RTX 2050) |
| Rate Control | VBR | Variable bitrate |
| CQ | 23 | Constant quality target |
| GOP Size | 48 | Keyframe every 2 seconds |
| Segment Time | 6s | HLS chunk duration |

## 📊 Quality Presets

| Quality | Resolution | Bitrate | Audio | Use Case |
|---------|------------|---------|-------|----------|
| 1080p | 1920x1080 | 5000k | 192k | Full HD |
| 720p | 1280x720 | 3000k | 128k | HD |
| 480p | 854x480 | 1500k | 128k | SD |
| 360p | 640x360 | 800k | 96k | Mobile |
| 240p | 426x240 | 500k | 64k | Slow connection |
| 144p | 256x144 | 300k | 64k | Ultra-low bandwidth |

## ⏱️ Processing Times (RTX 2050)

| Source | Duration | Processing Time | Speed |
|--------|----------|----------------|-------|
| 1080p | 10 min | ~5 min | 2x realtime |
| 1080p | 30 min | ~12 min | 2.5x realtime |
| 1080p | 60 min | ~22 min | 2.7x realtime |
| 720p | 30 min | ~8 min | 3.7x realtime |

*Times include all quality variants*

## 🔍 Monitoring Commands

### Check Redis Queue
```powershell
redis-cli
> LLEN bullmq:hls-processing:wait
> LLEN bullmq:hls-processing:active
> LLEN bullmq:hls-processing:completed
> LLEN bullmq:hls-processing:failed
```

### Check GPU Usage
```powershell
# One-time check
nvidia-smi

# Real-time monitoring (updates every second)
nvidia-smi -l 1

# Watch encoder usage
nvidia-smi dmon -s u
```

### Check Processing Status
```bash
# Get specific video
GET /api/processing/{videoId}/status

# Get all by status
GET /api/processing/status/queued
GET /api/processing/status/processing
GET /api/processing/status/completed
GET /api/processing/status/failed
```

## 🎮 API Endpoints

### Upload Video
```http
POST /api/uploads/video
Content-Type: multipart/form-data

{
  "video": file,
  "title": string,
  "description": string,
  "mainCategory": string,
  "primaryGenre": string,
  "thumbnail": file (optional)
}

Response: {
  "success": true,
  "data": {
    "processingStatus": "queued"
  }
}
```

### Check Processing Status
```http
GET /api/processing/{videoId}/status

Response: {
  "success": true,
  "data": {
    "status": "completed",
    "hlsUrl": "https://cdn/master.m3u8",
    "isReady": true,
    "processingTime": 420
  }
}
```

### Get Video (Stream)
```http
GET /api/videos/{videoId}

Response: {
  "videoUrl": "https://cdn/master.m3u8",
  "isHLS": true,
  "variants": [...]
}
```

## 🎨 Frontend Integration

### Install HLS.js
```bash
npm install hls.js
```

### Basic Player
```jsx
import Hls from 'hls.js';

const VideoPlayer = ({ video }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(video.hlsUrl);
      hls.attachMedia(videoRef.current);
    }
  }, [video]);

  return <video ref={videoRef} controls />;
};
```

## 🚨 Troubleshooting

### Worker not processing
```powershell
# Check Redis
redis-cli ping
→ Should return: PONG

# Check worker is running
# Should see: "✨ Status: Ready for processing"

# Restart worker
Ctrl+C
npm run hls-worker
```

### GPU not detected
```powershell
# Check NVIDIA driver
nvidia-smi
→ Should show RTX 2050

# Update driver if needed
# Visit: nvidia.com/drivers
```

### Upload fails
- Check disk space: `tmp/uploads/` directory
- Check file size: Max 5GB
- Check Redis connection
- Check MongoDB connection

### Playback fails
- Verify CDN_BASE in .env
- Check HLS.js is installed
- Open browser console for errors
- Test master.m3u8 URL directly

## 💾 Storage Savings

### Before (MP4)
```
1 hour 1080p video:
- Original: 2.5GB
- 720p variant: 1GB
- 480p variant: 500MB
- 360p variant: 250MB
Total: 4.25GB
```

### After (HLS)
```
1 hour 1080p video:
- HLS 1080p: 900MB
- HLS 720p: 450MB
- HLS 480p: 250MB
- HLS 360p: 125MB
- HLS 240p: 80MB
- HLS 144p: 50MB
Total: 1.85GB
Savings: 56%
```

## 🔄 Process Flow

1. **Upload** → File saved to `tmp/uploads/`
2. **Queue** → Added to Redis queue
3. **Worker picks** → Starts GPU processing
4. **Analyze** → Determines optimal qualities
5. **Encode** → NVENC processes each quality
6. **Upload** → HLS files to B2
7. **Update DB** → hlsUrl, status = completed
8. **Cleanup** → Delete original file
9. **Ready** → Video streamable

## 📈 Performance Metrics

| Metric | Value |
|--------|-------|
| GPU Utilization | 85-95% during encode |
| CPU Usage | 15-25% |
| RAM Usage | ~2GB per video |
| Disk I/O | ~200 MB/s write |
| Network Upload | ~50 Mbps to B2 |
| Concurrent Jobs | 1 (optimal for RTX 2050) |

## 🎯 Best Practices

✅ Keep Redis running 24/7 (Windows service)  
✅ Monitor `tmp/uploads/` directory size  
✅ Run `npm run cleanup` weekly  
✅ Process during off-hours for faster turnaround  
✅ Monitor GPU temperature with `nvidia-smi`  
✅ Keep NVIDIA drivers updated  
✅ Use CDN for serving (lower bandwidth costs)  
✅ Test upload with small video first  

## 🛡️ Security Benefits

| Feature | MP4 | HLS |
|---------|-----|-----|
| Direct download | Easy | Difficult |
| Right-click save | Yes | Segments only |
| Browser plugins | Works | Limited |
| Reconstruction | N/A | Time-consuming |
| DRM support | Limited | Native |

## 📝 Useful Scripts

```powershell
# Cleanup temp files
npm run cleanup

# Check database
npm run db:check

# Start everything
concurrently "redis-server" "npm run hls-worker" "npm start"
```

## 🔗 Quick Links

- [Full Setup Guide](HLS_SETUP_GUIDE.md)
- [Migration Guide](MIGRATION_TO_HLS.md)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [HLS.js Documentation](https://github.com/video-dev/hls.js)
- [BullMQ Documentation](https://docs.bullmq.io/)

---

**Questions?** Check the worker logs for detailed error messages or review the migration guide.
