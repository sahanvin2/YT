const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Configure ffmpeg paths
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
if (ffprobePath) {
  ffmpeg.setFfprobePath(ffprobePath);
}

const app = express();
app.use(express.json());

// Track active jobs
let activeJobs = new Map();

// Video quality presets
const QUALITY_PRESETS = {
  '144': { width: 256, height: 144, bitrate: '200k', audioBitrate: '64k' },
  '240': { width: 426, height: 240, bitrate: '400k', audioBitrate: '64k' },
  '360': { width: 640, height: 360, bitrate: '800k', audioBitrate: '96k' },
  '480': { width: 854, height: 480, bitrate: '1200k', audioBitrate: '128k' },
  '720': { width: 1280, height: 720, bitrate: '2500k', audioBitrate: '128k' }
};

// Health check endpoint
app.get('/health', (req, res) => {
  const cpus = os.cpus();
  const avgLoad = os.loadavg()[0] / cpus.length;
  
  res.json({
    status: 'healthy',
    jobs: activeJobs.size,
    cpu: Math.round(avgLoad * 100),
    memory: Math.round((os.totalmem() - os.freemem()) / os.totalmem() * 100)
  });
});

// Transcode video endpoint
app.post('/transcode', async (req, res) => {
  const { videoId, sourceUrl, quality, callbackUrl, b2Config } = req.body;
  
  if (!videoId || !sourceUrl || !quality || !callbackUrl) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const jobId = `${videoId}_${quality}_${Date.now()}`;
  activeJobs.set(jobId, { videoId, quality, startTime: new Date() });

  // Send immediate acknowledgment
  res.json({ jobId, status: 'started' });

  // Process in background
  try {
    // Download source video
    const tmpDir = path.join(__dirname, 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const sourceFile = path.join(tmpDir, `source_${jobId}.mp4`);
    const outputFile = path.join(tmpDir, `output_${jobId}.mp4`);

    console.log(`[${jobId}] Downloading source from ${sourceUrl}`);
    const response = await axios.get(sourceUrl, { responseType: 'stream' });
    const writer = fs.createWriteStream(sourceFile);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log(`[${jobId}] Starting transcode to ${quality}p`);
    
    // Transcode
    await transcodeVideo(sourceFile, outputFile, quality, jobId);

    // Upload to B2
    console.log(`[${jobId}] Uploading to B2`);
    const { uploadFilePath } = require('./utils/b2');
    const variantKey = `videos/${videoId}/variant_${quality}p.mp4`;
    const uploadedUrl = await uploadFilePath(outputFile, variantKey);

    // Cleanup
    fs.unlinkSync(sourceFile);
    fs.unlinkSync(outputFile);

    // Notify callback
    console.log(`[${jobId}] Notifying callback: ${callbackUrl}`);
    await axios.post(callbackUrl, {
      jobId,
      videoId,
      quality,
      status: 'completed',
      url: uploadedUrl
    });

    activeJobs.delete(jobId);
    console.log(`[${jobId}] ✓ Complete`);

  } catch (error) {
    console.error(`[${jobId}] Error:`, error);
    
    // Notify failure
    try {
      await axios.post(callbackUrl, {
        jobId,
        videoId,
        quality,
        status: 'failed',
        error: error.message
      });
    } catch (e) {
      console.error(`[${jobId}] Failed to notify callback:`, e.message);
    }

    activeJobs.delete(jobId);
  }
});

// Transcode function
function transcodeVideo(inputPath, outputPath, quality, jobId) {
  return new Promise((resolve, reject) => {
    const preset = QUALITY_PRESETS[quality];
    if (!preset) {
      return reject(new Error(`Invalid quality: ${quality}`));
    }

    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .size(`${preset.width}x${preset.height}`)
      .videoBitrate(preset.bitrate)
      .audioBitrate(preset.audioBitrate)
      .format('mp4')
      .outputOptions([
        '-preset fast',  // Faster processing on worker
        '-crf 23',
        '-movflags +faststart',
        '-pix_fmt yuv420p'
      ])
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`[${jobId}] ${quality}p: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log(`[${jobId}] ${quality}p transcode complete`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`[${jobId}] ${quality}p transcode error:`, err);
        reject(err);
      })
      .save(outputPath);
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎬 Worker server running on port ${PORT}`);
  console.log(`💻 CPU cores: ${os.cpus().length}`);
  console.log(`📦 Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`);
});
