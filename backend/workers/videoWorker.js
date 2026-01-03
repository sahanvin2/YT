/**
 * Video Processing Worker for DigitalOcean Droplet
 * 
 * This worker:
 * 1. Connects to Redis on EC2
 * 2. Picks up video processing jobs
 * 3. Downloads video from B2
 * 4. Processes to HLS format
 * 5. Uploads HLS files back to B2
 * 6. Updates database on EC2
 */

require('dotenv').config();
const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const mongoose = require('mongoose');
const { processVideoToHLS } = require('../utils/hlsProcessor');
const Video = require('../models/Video');
const path = require('path');
const fs = require('fs');
const { extractKeyFromUrl } = require('../utils/cdn');

// Redis connection to EC2
const connection = new IORedis({
  // Local-first defaults: run Redis locally for RTX 2050 processing on your PC.
  // Override with REDIS_HOST/REDIS_PORT when you intentionally connect to a remote Redis.
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

connection.on('connect', () => {
  console.log('✅ HLS Worker connected to Redis');
  console.log(`   Host: ${process.env.REDIS_HOST || '127.0.0.1'}`);
  console.log(`   Port: ${process.env.REDIS_PORT || 6379}`);
});

connection.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Worker connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

/**
 * Process HLS video job
 */
async function processHLSJob(job) {
  const { videoId, videoUrl, userId } = job.data;
  const jobId = job.id;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎬 Starting HLS processing`);
  console.log(`📹 Video ID: ${videoId}`);
  console.log(`👤 User ID: ${userId}`);
  console.log(`📁 Source: ${videoUrl || 'B2 URL'}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Update video status to processing
    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'processing',
      processingError: null
    });

    await job.updateProgress(5);

    // Download video from B2/CDN if videoUrl is provided
    let sourceFilePath = null;
    if (videoUrl && typeof videoUrl === 'string') {
      console.log(`📥 Downloading source video: ${videoUrl}`);
      const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
      
      // Extract object key from URL (supports B2 public URLs and Bunny CDN URLs)
      const key = extractKeyFromUrl(videoUrl);
      if (!key) {
        throw new Error(`Could not extract storage key from URL: ${videoUrl}`);
      }
      
      // Download from B2
      const tmpDir = path.join(__dirname, '../../tmp/worker-downloads');
      fs.mkdirSync(tmpDir, { recursive: true });

      const ext = path.extname(key) || '.mp4';
      sourceFilePath = path.join(tmpDir, `video_${videoId}_${Date.now()}${ext}`);
      
      const s3 = new S3Client({
        region: 'auto',
        endpoint: process.env.B2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.B2_ACCESS_KEY_ID,
          secretAccessKey: process.env.B2_SECRET_ACCESS_KEY,
        },
      });
      
      const downloadStream = (await s3.send(new GetObjectCommand({
        Bucket: process.env.B2_BUCKET,
        Key: key,
      }))).Body;
      
      const writeStream = fs.createWriteStream(sourceFilePath);
      await new Promise((resolve, reject) => {
        downloadStream.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
      
      console.log(`✅ Downloaded video to: ${sourceFilePath}`);
      await job.updateProgress(10);
    } else {
      throw new Error(`No valid B2 URL provided: ${videoUrl}`);
    }
    
    // Verify file exists
    if (!sourceFilePath || !require('fs').existsSync(sourceFilePath)) {
      throw new Error(`Source file not found: ${sourceFilePath}`);
    }

    // Progress callback
    const onProgress = (quality, percent) => {
      const totalProgress = 10 + Math.round(percent * 0.80); // 10-90%
      job.updateProgress(totalProgress).catch(() => {});
    };

    // Process video to HLS
    console.log(`🎬 Processing video to HLS...`);
    console.log(`🖥️  Encoder: ${process.env.VIDEO_ENCODER || 'h264_nvenc'} (set VIDEO_ENCODER=libx264 for CPU)`);
    if (process.env.FFMPEG_PATH || process.env.FFMPEG_BINARY) {
      console.log(`🔧 Using custom ffmpeg: ${process.env.FFMPEG_PATH || process.env.FFMPEG_BINARY}`);
    }
    const result = await processVideoToHLS(
      sourceFilePath,
      videoId,
      userId,
      onProgress
    );

    await job.updateProgress(90);

    // Update video document with HLS URL
    console.log(`📝 Updating database for video ${videoId}...`);
    
    const proxyUrl = `/api/hls/${userId}/${videoId}/master.m3u8`;
    
    try {
      const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
          hlsUrl: proxyUrl,
          videoUrl: proxyUrl,
          cdnUrl: proxyUrl,
          duration: result.duration,
          processingStatus: 'completed',
          processingCompleted: new Date(),
          processingError: null,
          hlsEnabled: true,
          isPublished: true,
          variants: result.variants.map(v => {
            const qualityNum = parseInt(String(v.quality).replace(/[^0-9]/g, ''), 10);
            const variantPlaylist = `/api/hls/${userId}/${videoId}/hls_${v.quality}/playlist.m3u8`;
            return {
              quality: Number.isFinite(qualityNum) ? qualityNum : v.quality,
              url: variantPlaylist,
              resolution: v.resolution
            };
          })
        },
        { new: true }
      );
      
      if (!updatedVideo) {
        throw new Error(`Video ${videoId} not found after update`);
      }
      
      console.log(`✅ Database updated successfully`);
      
    } catch (dbError) {
      console.error(`❌ Database update failed:`, dbError);
      throw new Error(`Failed to update database: ${dbError.message}`);
    }

    await job.updateProgress(95);

    // Delete downloaded file to save space
    try {
      if (sourceFilePath && require('fs').existsSync(sourceFilePath)) {
        require('fs').unlinkSync(sourceFilePath);
        console.log(`🗑️  Deleted temporary file: ${sourceFilePath}`);
      }
    } catch (deleteError) {
      console.warn(`⚠️  Could not delete temporary file:`, deleteError.message);
    }

    await job.updateProgress(100);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ HLS PROCESSING COMPLETED`);
    console.log(`📹 Video ID: ${videoId}`);
    console.log(`🌐 HLS URL: ${result.hlsUrl}`);
    console.log(`⏱️  Duration: ${result.duration}s`);
    console.log(`📊 Qualities: ${result.qualities.join(', ')}`);
    console.log(`${'='.repeat(60)}\n`);

    return {
      success: true,
      videoId,
      hlsUrl: result.hlsUrl,
      qualities: result.qualities,
      duration: result.duration,
      completedAt: new Date()
    };

  } catch (error) {
    console.error(`\n❌ HLS PROCESSING FAILED`);
    console.error(`📹 Video ID: ${videoId}`);
    console.error(`❌ Error: ${error.message}`);
    console.error(`${'-'.repeat(60)}\n`);

    // Update video status to failed
    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'failed',
      processingError: error.message
    });

    // Cleanup on error
    try {
      if (sourceFilePath && require('fs').existsSync(sourceFilePath)) {
        require('fs').unlinkSync(sourceFilePath);
      }
    } catch (e) {
      // Ignore cleanup errors
    }

    throw error;
  }
}

// Create worker with concurrency
const worker = new Worker('hls-processing', processHLSJob, {
  connection,
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '1', 10) || 1, // 1 is safer for a single RTX 2050
  limiter: {
    max: parseInt(process.env.WORKER_RATE_MAX || '5', 10) || 5,
    duration: parseInt(process.env.WORKER_RATE_WINDOW_MS || '60000', 10) || 60000
  }
});

// Worker event handlers
worker.on('ready', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 HLS WORKER STARTED');
  console.log('='.repeat(60));
  console.log(`🔗 Connected to Redis: ${process.env.REDIS_HOST || '127.0.0.1'}`);
  console.log(`🔄 Concurrency: ${parseInt(process.env.WORKER_CONCURRENCY || '1', 10) || 1}`);
  console.log(`✨ Status: Ready for processing`);
  console.log('='.repeat(60) + '\n');
});

worker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed - Video: ${result.videoId}`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

worker.on('progress', (job, progress) => {
  if (progress % 20 === 0) {
    console.log(`⏳ Job ${job.id}: ${progress}% complete`);
  }
});

worker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n⚠️  Received SIGTERM, shutting down gracefully...');
  await worker.close();
  await connection.quit();
  await mongoose.connection.close();
  console.log('👋 HLS Worker shut down successfully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⚠️  Received SIGINT, shutting down gracefully...');
  await worker.close();
  await connection.quit();
  await mongoose.connection.close();
  console.log('👋 HLS Worker shut down successfully');
  process.exit(0);
});

// Keep process alive
console.log('🎬 HLS Worker initializing...');

