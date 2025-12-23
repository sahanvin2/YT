const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Configure ffmpeg paths
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
if (ffprobePath) {
  ffmpeg.setFfprobePath(ffprobePath);
}

// Redis connection (local on worker)
const connection = new IORedis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null
});

connection.on('connect', () => {
  console.log('✅ Worker connected to local Redis');
});

// B2 Client
const s3Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com',
  region: 'us-east-005',
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY_ID,
    secretAccessKey: process.env.B2_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.B2_BUCKET || 'movia-prod';
const CDN_BASE = process.env.CDN_BASE || 'https://Xclub.b-cdn.net';

// Video quality presets
const QUALITY_PRESETS = {
  '144': { width: 256, height: 144, bitrate: '200k', audioBitrate: '64k' },
  '240': { width: 426, height: 240, bitrate: '400k', audioBitrate: '64k' },
  '360': { width: 640, height: 360, bitrate: '800k', audioBitrate: '96k' },
  '480': { width: 854, height: 480, bitrate: '1200k', audioBitrate: '128k' },
  '720': { width: 1280, height: 720, bitrate: '2500k', audioBitrate: '128k' }
};

/**
 * Upload file to B2 and return CDN URL
 */
async function uploadToB2(filePath, key) {
  const fileContent = fs.readFileSync(filePath);
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileContent,
    ContentType: 'video/mp4'
  });

  await s3Client.send(command);
  return `${CDN_BASE}/${key}`;
}

/**
 * Transcode video to specific quality
 */
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
        '-preset fast',
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
        console.error(`[${jobId}] ${quality}p transcode error:`, err.message);
        reject(err);
      })
      .save(outputPath);
  });
}

/**
 * Process video job
 */
async function processVideo(job) {
  const { videoId, videoUrl, userId } = job.data;
  const jobId = job.id;
  
  console.log(`\n🎬 [${jobId}] Starting video processing for ${videoId}`);
  console.log(`📹 Video URL: ${videoUrl}`);
  
  const tmpDir = path.join(__dirname, '../../tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const sourceFile = path.join(tmpDir, `source_${jobId}.mp4`);
  const variants = [];

  try {
    // Download source video
    console.log(`[${jobId}] Downloading source video...`);
    const response = await axios.get(videoUrl, { 
      responseType: 'stream',
      timeout: 300000 // 5 minutes
    });
    
    const writer = fs.createWriteStream(sourceFile);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    console.log(`[${jobId}] ✓ Download complete`);

    // Update job progress
    await job.updateProgress(10);

    // Process each quality
    const qualities = ['144', '240', '360', '480', '720'];
    const progressStep = 90 / qualities.length;
    
    for (let i = 0; i < qualities.length; i++) {
      const quality = qualities[i];
      const outputFile = path.join(tmpDir, `variant_${jobId}_${quality}p.mp4`);
      
      console.log(`[${jobId}] Processing ${quality}p...`);
      await transcodeVideo(sourceFile, outputFile, quality, jobId);
      
      // Upload to B2
      console.log(`[${jobId}] Uploading ${quality}p to B2...`);
      const variantKey = `videos/${userId}/variants/${videoId}_${quality}p.mp4`;
      const variantUrl = await uploadToB2(outputFile, variantKey);
      
      variants.push({
        quality: `${quality}p`,
        url: variantUrl,
        size: fs.statSync(outputFile).size
      });
      
      // Cleanup variant file
      fs.unlinkSync(outputFile);
      
      // Update progress
      await job.updateProgress(10 + ((i + 1) * progressStep));
      console.log(`[${jobId}] ✓ ${quality}p complete`);
    }

    // Cleanup source file
    fs.unlinkSync(sourceFile);

    console.log(`[${jobId}] ✅ All variants processed successfully`);
    
    return {
      videoId,
      variants,
      completedAt: new Date()
    };

  } catch (error) {
    console.error(`[${jobId}] ❌ Error:`, error.message);
    
    // Cleanup on error
    try {
      if (fs.existsSync(sourceFile)) fs.unlinkSync(sourceFile);
    } catch (e) {}
    
    throw error;
  }
}

// Create worker
const worker = new Worker('video-processing', processVideo, {
  connection,
  concurrency: 2, // Process 2 videos simultaneously
  limiter: {
    max: 5,
    duration: 60000 // Max 5 jobs per minute
  }
});

worker.on('ready', () => {
  console.log('🎬 Video processing worker is ready');
  console.log(`💻 CPU cores: ${os.cpus().length}`);
  console.log(`📦 Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`);
});

worker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed:`, result.videoId);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  process.exit(0);
});

console.log('🚀 Starting video processing worker...');
