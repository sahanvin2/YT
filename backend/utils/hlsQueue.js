const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Check if Redis is enabled
const REDIS_ENABLED = String(process.env.REDIS_ENABLED || 'false').toLowerCase() === 'true';

let connection = null;
let hlsQueue = null;

if (REDIS_ENABLED) {
  // Redis connection for queue
  connection = new IORedis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  connection.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
  });

  connection.on('connect', () => {
    console.log('✅ Connected to Redis for HLS queue');
  });

  // Create HLS processing queue
  hlsQueue = new Queue('hls-processing', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: {
        age: 3600 // Remove completed jobs after 1 hour
      },
      removeOnFail: {
        age: 86400 // Remove failed jobs after 24 hours
      }
    }
  });
} else {
  console.log('⚠️  Redis disabled - HLS queue not available (HLS-only mode)');
}

/**
 * Add video to HLS processing queue
 * @param {string} videoId - Video document ID
 * @param {string} localFilePath - Path to uploaded video file on local system
 * @param {string} userId - User ID who uploaded the video
 */
async function addToHLSQueue(videoId, localFilePath, userId) {
  if (!REDIS_ENABLED || !hlsQueue) {
    console.log('⚠️  Redis disabled - Processing video directly without queue');
    // Process video directly without queue for local development
    try {
      const { processVideoToHLS } = require('./hlsProcessor');
      const Video = require('../models/Video');
      
      // Update status to processing
      await Video.findByIdAndUpdate(videoId, {
        processingStatus: 'processing',
        processingError: null
      });
      
      console.log(`🎬 Starting direct HLS processing for video ${videoId}`);
      
      // Process video with progress callback
      const onProgress = (quality, percent) => {
        console.log(`   ${quality}: ${percent.toFixed(1)}%`);
      };
      
      const result = await processVideoToHLS(localFilePath, videoId, userId, onProgress);
      
      // Update video in database
      const proxyUrl = `/api/hls/${userId}/${videoId}/master.m3u8`;
      await Video.findByIdAndUpdate(videoId, {
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
      });
      
      console.log(`✅ Video ${videoId} processed successfully (direct mode)`);
      return `direct_${videoId}`;
    } catch (error) {
      console.error(`❌ Direct processing failed for video ${videoId}:`, error);
      
      // Update video with error
      const Video = require('../models/Video');
      await Video.findByIdAndUpdate(videoId, {
        processingStatus: 'failed',
        processingError: error.message
      }).catch(() => {});
      
      throw error;
    }
  }
  
  try {
    const job = await hlsQueue.add('process-video', {
      videoId,
      localFilePath,
      userId,
      addedAt: new Date().toISOString()
    }, {
      jobId: `hls_${videoId}_${Date.now()}`,
      priority: 1 // Higher priority for newer uploads
    });

    console.log(`📋 Added video ${videoId} to HLS processing queue (Job: ${job.id})`);
    return job.id;
  } catch (error) {
    console.error(`❌ Failed to add video ${videoId} to HLS queue:`, error);
    throw error;
  }
}

/**
 * Get queue status
 */
async function getQueueStatus() {
  if (!REDIS_ENABLED || !hlsQueue) {
    return { waiting: 0, active: 0, completed: 0, failed: 0, total: 0, disabled: true };
  }
  
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      hlsQueue.getWaitingCount(),
      hlsQueue.getActiveCount(),
      hlsQueue.getCompletedCount(),
      hlsQueue.getFailedCount()
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      total: waiting + active + completed + failed
    };
  } catch (error) {
    console.error('Failed to get queue status:', error);
    return null;
  }
}

/**
 * Get job status
 */
async function getJobStatus(jobId) {
  if (!REDIS_ENABLED || !hlsQueue) {
    return null;
  }
  
  try {
    const job = await hlsQueue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    const progress = job.progress || 0;

    return {
      id: job.id,
      state,
      progress,
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason
    };
  } catch (error) {
    console.error(`Failed to get job ${jobId} status:`, error);
    return null;
  }
}

module.exports = {
  hlsQueue,
  addToHLSQueue,
  getQueueStatus,
  getJobStatus
};
