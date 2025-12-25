const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Redis connection for queue
const connection = new IORedis({
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
const hlsQueue = new Queue('hls-processing', {
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

/**
 * Add video to HLS processing queue
 * @param {string} videoId - Video document ID
 * @param {string} localFilePath - Path to uploaded video file on local system
 * @param {string} userId - User ID who uploaded the video
 */
async function addToHLSQueue(videoId, localFilePath, userId) {
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
