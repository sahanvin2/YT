// Load environment variables FIRST before any other imports
require('dotenv').config();

const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { processVideoToHLS } = require('./utils/hlsProcessor');

// Redis connection
const connection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null
});

connection.on('connect', () => {
  console.log('✅ HLS Worker connected to Redis');
});

connection.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/movia', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ HLS Worker connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

const Video = require('./models/Video');

/**
 * Process HLS video job
 */
async function processHLSJob(job) {
  const { videoId, localFilePath, userId } = job.data;
  const jobId = job.id;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎬 Starting HLS processing`);
  console.log(`📹 Video ID: ${videoId}`);
  console.log(`👤 User ID: ${userId}`);
  console.log(`📁 Source: ${localFilePath}`);
  console.log(`🖥️  GPU: NVIDIA RTX 2050`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Verify file exists
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`Source file not found: ${localFilePath}`);
    }

    // Update video status to processing
    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'processing',
      processingError: null
    });

    await job.updateProgress(5);

    // Progress callback
    const onProgress = (quality, percent) => {
      const totalProgress = 5 + Math.round(percent * 0.85); // 5-90%
      job.updateProgress(totalProgress).catch(() => {});
    };

    // Process video to HLS with GPU acceleration
    const result = await processVideoToHLS(
      localFilePath,
      videoId,
      userId,
      onProgress
    );

    await job.updateProgress(90);

    // Update video document with HLS URL
    console.log(`📝 Updating database for video ${videoId}...`);
    
    // Use same-origin PROXY URL instead of B2/CDN - solves CORS issues and works in prod behind reverse proxy
    const proxyUrl = `/api/hls/${userId}/${videoId}/master.m3u8`;
    
    console.log(`   B2 URL: ${result.hlsUrl}`);
    console.log(`   Proxy URL (CORS-free): ${proxyUrl}`);
    
    try {
      // First, check if video exists in database
      const existingVideo = await Video.findById(videoId);
      
      if (!existingVideo) {
        console.error(`❌ Video ${videoId} not found in database`);
        console.log('   This may happen if:');
        console.log('   1. Video was deleted before processing completed');
        console.log('   2. Video ID is incorrect');
        console.log('   3. Database connection issue');
        console.log(`   Skipping database update but HLS files are uploaded to B2:`);
        console.log(`   ${result.hlsUrl}`);
        
        // Don't throw error - files are already on B2
        // Admin can manually fix this in database
        return result; // Return successfully to avoid reprocessing
      }
      
      const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
          hlsUrl: proxyUrl,
          videoUrl: proxyUrl,
          cdnUrl: proxyUrl, // Frontend checks this first
          duration: result.duration,
          processingStatus: 'completed',
          processingCompleted: new Date(),
          processingError: null,
          hlsEnabled: true,
          isPublished: true, // ✅ FIX: Automatically publish when processing completes
          // Store quality information
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
      console.error(`   Video ID: ${videoId}`);
      console.error(`   User ID: ${userId}`);
      
      // Log more details for debugging
      try {
        const videoCount = await Video.countDocuments();
        console.log(`   Total videos in database: ${videoCount}`);
      } catch (e) {
        console.error(`   Could not count videos:`, e.message);
      }
      
      throw new Error(`Failed to update database: ${dbError.message}`);
    }

    await job.updateProgress(95);

    // Delete original uploaded file to save space
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
        console.log(`🗑️  Deleted original file: ${localFilePath}`);
      }
    } catch (deleteError) {
      console.warn(`⚠️  Could not delete original file:`, deleteError.message);
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
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch (e) {
      // Ignore cleanup errors
    }

    throw error;
  }
}

// Create worker with higher concurrency for parallel processing
// Process 3 videos simultaneously: encode + upload + encode in parallel
// This maximizes GPU utilization and throughput
const worker = new Worker('hls-processing', processHLSJob, {
  connection,
  concurrency: 3, // Process 3 videos simultaneously (maximum throughput)
  limiter: {
    max: 10,
    duration: 60000 // Max 10 jobs per minute
  }
});

// Worker event handlers
worker.on('ready', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 HLS WORKER STARTED');
  console.log('='.repeat(60));
  console.log(`🖥️  GPU: NVIDIA RTX 2050`);
  console.log(`🔧 Codec: H.264 (NVENC) - 8-bit`);
  console.log(`📦 Format: HLS (HTTP Live Streaming)`);
  console.log(`💾 CPU: ${os.cpus()[0].model}`);
  console.log(`🧠 Cores: ${os.cpus().length}`);
  console.log(`💿 RAM: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`);
  console.log(`🔄 Concurrency: 3 videos (maximum parallel processing)`);
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
