#!/bin/bash
# Video Worker EC2 Setup Script
# Run this on your worker EC2 instance (3.227.1.7)

echo "🔧 Setting up Video Worker EC2..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install FFmpeg
echo "📦 Installing FFmpeg..."
sudo apt install -y ffmpeg

# Verify installations
echo "✅ Installed versions:"
node --version
npm --version
ffmpeg -version | head -1

# Create worker directory
echo "📁 Creating worker directory..."
mkdir -p /home/ubuntu/worker
cd /home/ubuntu/worker

# Initialize npm
echo "📦 Initializing npm project..."
cat > package.json << 'EOF'
{
  "name": "video-worker",
  "version": "1.0.0",
  "description": "Video transcoding worker",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "fluent-ffmpeg": "^2.1.2",
    "ffmpeg-static": "^5.2.0",
    "ffprobe-static": "^3.1.0"
  }
}
EOF

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create server.js
echo "📝 Creating worker server..."
cat > server.js << 'EOFSERVER'
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const fs = require('fs');
const path = require('path');
const os = require('os');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const MAIN_SERVER = process.env.MAIN_SERVER || 'http://3.238.106.222:5000';
const jobs = new Map();

// Health check
app.get('/health', (req, res) => {
  const cpus = os.cpus();
  const totalCpu = cpus.reduce((acc, cpu) => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b);
    const idle = cpu.times.idle;
    return acc + ((total - idle) / total);
  }, 0);
  
  const avgCpu = Math.round((totalCpu / cpus.length) * 100);
  
  res.json({ 
    status: 'healthy', 
    jobs: jobs.size,
    cpu: avgCpu,
    memory: Math.round((1 - (os.freemem() / os.totalmem())) * 100),
    uptime: os.uptime()
  });
});

// Receive transcode job
app.post('/api/transcode', async (req, res) => {
  try {
    const { videoId, videoPath, userId } = req.body;
    
    if (!videoId || !videoPath) {
      return res.status(400).json({ error: 'videoId and videoPath required' });
    }

    const jobId = `job-${Date.now()}-${videoId}`;
    jobs.set(jobId, { status: 'pending', videoId, startTime: new Date() });

    console.log(`\n🎬 New job: ${jobId}`);
    console.log(`   Video: ${videoId}`);

    res.json({ success: true, jobId, status: 'queued' });

    // Process asynchronously
    processVideo(jobId, videoId, videoPath).catch(err => {
      console.error(`❌ Job failed:`, err.message);
      jobs.set(jobId, { status: 'failed', error: err.message });
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function processVideo(jobId, videoId, videoPath) {
  try {
    console.log(`⚙️  Processing ${jobId}...`);
    jobs.set(jobId, { status: 'processing', videoId, startTime: new Date() });

    // Download video
    const localPath = await downloadVideo(videoPath, videoId);
    
    // Get metadata
    const metadata = await getVideoMetadata(localPath);
    console.log(`📊 ${metadata.width}x${metadata.height}, ${Math.round(metadata.duration)}s`);

    const height = metadata.height;
    const qualities = ['360', '480'];
    if (height >= 720) qualities.push('720');
    if (height >= 1080) qualities.push('1080');
    
    console.log(`🎯 Qualities: ${qualities.join(', ')}`);

    const variants = [];

    // Transcode each quality
    for (const quality of qualities) {
      try {
        console.log(`🔄 ${quality}p...`);
        const variant = await transcodeQuality(localPath, quality, videoId);
        variants.push(variant);
        console.log(`✅ ${quality}p done`);
      } catch (err) {
        console.error(`❌ ${quality}p failed:`, err.message);
      }
    }

    // Clean up
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);

    // Send callback
    const workerIp = await getPublicIp();
    await axios.post(`${MAIN_SERVER}/api/transcode/callback`, {
      videoId,
      status: 'completed',
      variants,
      workerIp
    });

    const duration = Math.round((new Date() - jobs.get(jobId).startTime) / 1000);
    jobs.set(jobId, { status: 'completed', videoId, variants, duration: `${duration}s` });
    
    console.log(`✅ Completed in ${duration}s\n`);

  } catch (error) {
    console.error(`❌ Error:`, error.message);
    
    try {
      const workerIp = await getPublicIp();
      await axios.post(`${MAIN_SERVER}/api/transcode/callback`, {
        videoId,
        status: 'failed',
        error: error.message,
        workerIp
      });
    } catch (e) {
      console.error('Callback failed:', e.message);
    }

    jobs.set(jobId, { status: 'failed', error: error.message });
  }
}

async function downloadVideo(videoPath, videoId) {
  if (fs.existsSync(videoPath)) return videoPath;

  const localPath = `/tmp/${videoId}_original.mp4`;
  console.log(`📥 Downloading...`);
  
  const response = await axios({
    method: 'GET',
    url: videoPath,
    responseType: 'stream'
  });

  const writer = fs.createWriteStream(localPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      console.log(`✅ Downloaded`);
      resolve(localPath);
    });
    writer.on('error', reject);
  });
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
    '360': { width: 640, height: 360, bitrate: '800k', audioBitrate: '96k' },
    '480': { width: 854, height: 480, bitrate: '1200k', audioBitrate: '128k' },
    '720': { width: 1280, height: 720, bitrate: '2500k', audioBitrate: '128k' },
    '1080': { width: 1920, height: 1080, bitrate: '5000k', audioBitrate: '192k' }
  };

  const preset = presets[quality];
  const outputPath = `/tmp/${videoId}_${quality}p.mp4`;

  return new Promise((resolve, reject) => {
    let lastPercent = 0;
    
    ffmpeg(videoPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .size(`${preset.width}x${preset.height}`)
      .videoBitrate(preset.bitrate)
      .audioBitrate(preset.audioBitrate)
      .format('mp4')
      .outputOptions([
        '-preset medium',
        '-crf 23',
        '-movflags +faststart',
        '-pix_fmt yuv420p'
      ])
      .on('progress', (progress) => {
        if (progress.percent) {
          const percent = Math.round(progress.percent);
          if (percent > lastPercent + 10) {
            console.log(`   ${percent}%`);
            lastPercent = percent;
          }
        }
      })
      .on('end', () => {
        const size = fs.statSync(outputPath).size;
        resolve({ 
          quality, 
          url: outputPath, 
          size: Math.round(size / 1024 / 1024)
        });
        
        setTimeout(() => {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }, 60000);
      })
      .on('error', reject)
      .save(outputPath);
  });
}

async function getPublicIp() {
  try {
    const response = await axios.get('http://169.254.169.254/latest/meta-data/public-ipv4');
    return response.data;
  } catch {
    return 'unknown';
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Video Worker running on port ${PORT}`);
  console.log(`   Main server: ${MAIN_SERVER}\n`);
});
EOFSERVER

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Create PM2 config
echo "📝 Creating PM2 config..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'video-worker',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '3G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      MAIN_SERVER: 'http://3.238.106.222:5000'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start worker
echo "🚀 Starting worker..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo ""
echo "✅ Worker setup complete!"
echo ""
echo "🔍 Check status:"
echo "   pm2 status"
echo "   pm2 logs video-worker"
echo ""
echo "🧪 Test health:"
echo "   curl localhost:3001/health"
echo ""
