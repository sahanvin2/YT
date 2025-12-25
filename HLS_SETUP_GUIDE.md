# HLS Video Processing System - Local GPU Setup

This system processes videos locally using your NVIDIA RTX 2050 GPU, converting them to HLS format for optimal streaming.

## 🎯 Features

- **GPU Acceleration**: NVIDIA NVENC hardware encoding
- **HLS Streaming**: Adaptive bitrate streaming, no buffering
- **Multi-Quality**: Automatically generates 144p, 240p, 360p, 480p, 720p, 1080p
- **Download Prevention**: HLS segments are harder to download than MP4
- **Storage Efficient**: Only HLS files stored (no MP4 duplicates)
- **Local Processing**: No EC2 crashes, faster processing

## 🚀 Quick Start

### 1. Install Redis (Required for queue management)

**Windows:**
```powershell
# Using Chocolatey
choco install redis-64

# Or download from: https://github.com/tporadowski/redis/releases
```

**Start Redis:**
```powershell
redis-server
```

### 2. Install FFmpeg with NVIDIA Support (Optional but recommended)

If you want maximum GPU acceleration, install FFmpeg with CUDA support:
- Download from: https://www.gyan.dev/ffmpeg/builds/
- Get the "full_build" version
- Extract and add to PATH

### 3. Start the HLS Worker

```powershell
# In the project root directory
npm run hls-worker
```

You should see:
```
🚀 HLS WORKER STARTED
🖥️  GPU: NVIDIA RTX 2050
🔧 Codec: H.264 (NVENC) - 8-bit
📦 Format: HLS (HTTP Live Streaming)
✨ Status: Ready for processing
```

### 4. Start the Main Server

```powershell
# In another terminal
npm start
```

## 📁 Upload Flow

1. **User uploads video** → Any format accepted (.mp4, .mkv, .mov, .avi, .webm, etc.)
2. **File saved temporarily** → `tmp/uploads/` directory
3. **Added to queue** → Redis queue for processing
4. **GPU processes video** → NVENC encodes to multiple HLS qualities
5. **Upload to B2** → HLS segments and playlists uploaded
6. **Original deleted** → Saves disk space
7. **Ready to stream** → HLS master playlist available

## 📊 Storage Structure

```
videos/
 └── {userId}/
     └── {videoId}/
         ├── master.m3u8           (Master playlist)
         ├── hls_1080p/
         │   ├── playlist.m3u8
         │   ├── segment_000.ts
         │   ├── segment_001.ts
         │   └── ...
         ├── hls_720p/
         ├── hls_480p/
         ├── hls_360p/
         ├── hls_240p/
         └── hls_144p/
```

## 🎬 Video Player Support

Your frontend video player needs HLS support:

### React (Video.js with HLS)
```bash
npm install video.js videojs-contrib-hls
```

```jsx
import videojs from 'video.js';
import 'videojs-contrib-hls';

const player = videojs('my-video', {
  sources: [{
    src: video.hlsUrl, // master.m3u8 URL
    type: 'application/x-mpegURL'
  }]
});
```

### HTML5 with HLS.js
```html
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<video id="video" controls></video>
<script>
  const video = document.getElementById('video');
  const hls = new Hls();
  hls.loadSource('{master.m3u8 URL}');
  hls.attachMedia(video);
</script>
```

## 🔧 Configuration

Edit `backend/.env`:

```env
# Redis (required)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# B2 Storage (already configured)
B2_ACCESS_KEY_ID=your_key
B2_SECRET_ACCESS_KEY=your_secret
B2_BUCKET=movia-prod
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
CDN_BASE=https://Xclub.b-cdn.net
```

## 🎮 GPU Settings

The HLS processor is optimized for RTX 2050:
- **Codec**: H.264 (NVENC)
- **Color**: 8-bit (yuv420p)
- **Preset**: p4 (medium quality/speed)
- **Bitrate**: Variable (VBR)
- **Concurrency**: 1 video at a time

To adjust concurrency (if your GPU can handle more):
Edit `backend/hlsWorker.js`:
```javascript
const worker = new Worker('hls-processing', processHLSJob, {
  connection,
  concurrency: 2, // Change to 2 for parallel processing
  ...
});
```

## 📈 Monitoring

### Check Queue Status
```powershell
redis-cli
> LLEN bullmq:hls-processing:wait
> LLEN bullmq:hls-processing:active
> LLEN bullmq:hls-processing:completed
```

### Worker Logs
The worker shows detailed progress:
```
🎬 Starting HLS processing for video 67abc123...
📹 Video info: 1920x1080, 180s
🎯 Encoding qualities: 1080p, 720p, 480p, 360p, 240p, 144p
🎬 Processing 1080p variant with GPU acceleration...
   1080p: 10% complete
   1080p: 20% complete
✅ 1080p variant completed
```

## 🛠️ Troubleshooting

### GPU not detected
- Install latest NVIDIA drivers
- Check CUDA is installed: `nvidia-smi`
- FFmpeg falls back to CPU encoding if GPU unavailable

### Redis connection failed
- Ensure Redis is running: `redis-cli ping`
- Should return: `PONG`

### Processing stuck
- Check worker logs
- Restart worker: `npm run hls-worker`
- Check GPU usage: `nvidia-smi`

### Out of disk space
- Original files are deleted after processing
- HLS files are ~60% smaller than MP4
- Old temp files in `tmp/` can be deleted

## 🎨 Quality Settings

Edit `backend/utils/hlsProcessor.js` to adjust bitrates:

```javascript
const HLS_PRESETS = {
  '1080p': {
    bitrate: '5000k',    // Increase for better quality
    maxBitrate: '5350k',
    ...
  },
  ...
};
```

## 🔒 Security Benefits

HLS provides better security than MP4:
- ✅ Segments are small chunks (6 seconds each)
- ✅ No single downloadable file
- ✅ Harder to reconstruct full video
- ✅ Can add encryption (future enhancement)

## 🚦 Performance

RTX 2050 encoding speeds (approximate):
- 1080p video: ~2-3x realtime (30min video → 10-15min processing)
- 720p video: ~4-5x realtime
- Multiple qualities: ~1.5-2x realtime total

CPU encoding would be: ~0.5-1x realtime (much slower!)

## 📝 Next Steps

1. Update your video player to support HLS
2. Test with a small video upload
3. Monitor GPU usage during processing
4. Adjust quality settings if needed
5. Consider adding encryption for premium content

## 💡 Tips

- Process videos during off-hours for faster uploads
- Use shorter segment duration (4s) for lower latency
- Use longer segments (10s) for better compression
- Monitor GPU temperature with `nvidia-smi`
- Keep driver updated for best performance

---

**Need help?** Check the worker logs for detailed error messages.
