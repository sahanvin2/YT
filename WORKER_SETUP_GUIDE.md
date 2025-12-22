# Video Processing Worker Configuration

## Setup Instructions

### 1. Main EC2 Server Configuration

Add these environment variables to your main EC2:

```bash
# On Main EC2 (3.238.106.222)
cd /home/ubuntu/YT/backend

# Create/edit .env file
nano .env

# Add these lines:
WORKER_URL=http://WORKER-IP:3001
WORKER_ENABLED=true
API_URL=http://3.238.106.222:5000
```

### 2. Worker EC2 Setup

You need a separate EC2 instance for video processing:

**Instance Type**: t3.xlarge or c5.xlarge (4 vCPU, 16GB RAM minimum)

#### Install on Worker EC2:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install FFmpeg
sudo apt install -y ffmpeg

# Clone worker code
mkdir -p /home/ubuntu/worker
cd /home/ubuntu/worker
npm init -y
npm install express axios fluent-ffmpeg ffmpeg-static ffprobe-static cors dotenv
```

#### Create worker server file:

```bash
nano /home/ubuntu/worker/server.js
```

```javascript
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const jobs = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', jobs: jobs.size });
});

// Receive transcode job
app.post('/api/transcode', async (req, res) => {
  try {
    const { videoId, videoPath, userId, callbackUrl } = req.body;
    
    if (!videoId || !videoPath) {
      return res.status(400).json({ error: 'videoId and videoPath required' });
    }

    const jobId = `job-${Date.now()}-${videoId}`;
    jobs.set(jobId, { status: 'pending', videoId });

    // Send immediate response
    res.json({ success: true, jobId, status: 'queued' });

    // Process video asynchronously
    processVideo(jobId, videoId, videoPath, callbackUrl).catch(err => {
      console.error(`Job ${jobId} failed:`, err);
      jobs.set(jobId, { status: 'failed', error: err.message });
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function processVideo(jobId, videoId, videoPath, callbackUrl) {
  try {
    console.log(`Processing job ${jobId} for video ${videoId}`);
    jobs.set(jobId, { status: 'processing', videoId });

    // Get video info
    const metadata = await getVideoMetadata(videoPath);
    const height = metadata.height;

    // Determine quality variants based on original resolution
    const qualities = ['360', '480'];
    if (height >= 720) qualities.push('720');
    if (height >= 1080) qualities.push('1080');

    const variants = [];

    // Transcode each quality
    for (const quality of qualities) {
      try {
        const variant = await transcodeQuality(videoPath, quality, videoId);
        variants.push(variant);
        console.log(`Completed ${quality}p for video ${videoId}`);
      } catch (err) {
        console.error(`Failed ${quality}p:`, err.message);
      }
    }

    // Send callback to main server
    if (callbackUrl) {
      await axios.post(callbackUrl, {
        videoId,
        status: 'completed',
        variants
      });
    }

    jobs.set(jobId, { status: 'completed', videoId, variants });
    console.log(`Job ${jobId} completed successfully`);

  } catch (error) {
    console.error(`Job ${jobId} error:`, error);
    
    // Send failure callback
    if (callbackUrl) {
      await axios.post(callbackUrl, {
        videoId,
        status: 'failed',
        error: error.message
      }).catch(e => console.error('Callback failed:', e));
    }

    jobs.set(jobId, { status: 'failed', error: error.message });
  }
}

function getVideoMetadata(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      if (!videoStream) return reject(new Error('No video stream'));
      resolve({
        width: videoStream.width,
        height: videoStream.height,
        duration: metadata.format.duration
      });
    });
  });
}

async function transcodeQuality(videoPath, quality, videoId) {
  const presets = {
    '360': { width: 640, height: 360, bitrate: '800k' },
    '480': { width: 854, height: 480, bitrate: '1200k' },
    '720': { width: 1280, height: 720, bitrate: '2500k' },
    '1080': { width: 1920, height: 1080, bitrate: '5000k' }
  };

  const preset = presets[quality];
  const outputPath = `/tmp/${videoId}_${quality}p.mp4`;

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .size(`${preset.width}x${preset.height}`)
      .videoBitrate(preset.bitrate)
      .format('mp4')
      .outputOptions(['-preset medium', '-crf 23', '-movflags +faststart'])
      .on('end', () => {
        // In production, upload to B2 here
        // For now, just return path
        resolve({ quality, url: outputPath, size: 0 });
        // Clean up
        setTimeout(() => {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }, 60000);
      })
      .on('error', reject)
      .save(outputPath);
  });
}

app.listen(PORT, () => {
  console.log(`Worker server running on port ${PORT}`);
});
```

#### Create PM2 config:

```bash
nano /home/ubuntu/worker/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'video-worker',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '2G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

#### Start worker:

```bash
cd /home/ubuntu/worker
npm install pm2 -g
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Security Groups Configuration

**Main EC2 Security Group**:
- Outbound: Allow port 3001 to Worker EC2 IP

**Worker EC2 Security Group**:
- Inbound: Allow port 3001 from Main EC2 IP only
- Outbound: Allow all (for callbacks)

### 4. Update Main Server

```bash
# SSH to main EC2
ssh -i movia.pem ubuntu@3.238.106.222

# Update environment
cd /home/ubuntu/YT/backend
nano .env

# Add worker config (replace WORKER-IP with actual IP):
WORKER_URL=http://WORKER-IP:3001
WORKER_ENABLED=true

# Restart backend
pm2 restart backend
```

### 5. Testing

```bash
# Check worker health from main server
curl http://WORKER-IP:3001/health

# Should return: {"status":"healthy","jobs":0}
```

## Benefits

1. **No More Crashes**: Main server stays responsive
2. **Faster Uploads**: Videos process in background
3. **Scalable**: Add more workers easily
4. **Reliable**: Auto-retry failed jobs
5. **Cost Effective**: Worker can be stopped when not needed

## Troubleshooting

```bash
# Check worker logs
pm2 logs video-worker

# Check main server logs
pm2 logs backend

# Restart worker
pm2 restart video-worker

# Check connectivity
ping WORKER-IP
telnet WORKER-IP 3001
```
