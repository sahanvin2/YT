const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Redis connection to Worker EC2
const connection = new IORedis({
  host: '172.30.5.116', // Worker EC2 private IP
  port: 6379,
  maxRetriesPerRequest: null
});

connection.on('connect', () => {
  console.log('✅ Connected to Redis on Worker EC2');
});

connection.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

// Create video processing queue
const videoQueue = new Queue('video-processing', { connection });

/**
 * Add video to processing queue
 */
async function addToQueue(videoId, videoUrl, userId) {
  try {
    console.log(`📹 Adding video ${videoId} to queue...`);
    
    const job = await videoQueue.add('process-video', {
      videoId: videoId.toString(),
      videoUrl,
      userId: userId.toString(),
      timestamp: Date.now()
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: true,
      removeOnFail: false
    });
    
    console.log(`✅ Video ${videoId} queued with job ID: ${job.id}`);
    
    return { 
      success: true, 
      jobId: job.id,
      queuedAt: new Date()
    };
  } catch (error) {
    console.error('❌ Error queuing video:', error.message);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Get queue stats
 */
async function getQueueStats() {
  try {
    const waiting = await videoQueue.getWaitingCount();
    const active = await videoQueue.getActiveCount();
    const completed = await videoQueue.getCompletedCount();
    const failed = await videoQueue.getFailedCount();
    
    return {
      waiting,
      active,
      completed,
      failed,
      total: waiting + active
    };
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return null;
  }
}

module.exports = { addToQueue, getQueueStats, videoQueue };
