const axios = require('axios');
const Video = require('../models/Video');

// Multiple Worker EC2 Configuration
// Add all your worker IPs here (comma-separated in .env)
const WORKER_IPS = (process.env.WORKER_IPS || '').split(',').filter(ip => ip.trim());
const WORKERS_ENABLED = process.env.WORKERS_ENABLED === 'true';
const CALLBACK_URL = process.env.API_URL ? `${process.env.API_URL}/api/transcode/callback` : null;

// Worker health tracking
const workerHealth = new Map();
let currentWorkerIndex = 0;

/**
 * Check if a worker is healthy
 */
async function checkWorkerHealth(workerIp) {
  try {
    const response = await axios.get(`http://${workerIp}:3001/health`, { 
      timeout: 3000 
    });
    
    const isHealthy = response.status === 200;
    workerHealth.set(workerIp, {
      healthy: isHealthy,
      lastCheck: new Date(),
      jobs: response.data.jobs || 0,
      cpu: response.data.cpu || 0
    });
    
    return isHealthy;
  } catch (error) {
    workerHealth.set(workerIp, {
      healthy: false,
      lastCheck: new Date(),
      error: error.message
    });
    return false;
  }
}

/**
 * Get the best available worker (least busy)
 */
async function getBestWorker() {
  if (!WORKERS_ENABLED || WORKER_IPS.length === 0) {
    return null;
  }

  // Check health of all workers in parallel
  await Promise.all(
    WORKER_IPS.map(ip => checkWorkerHealth(ip))
  );

  // Find healthy workers
  const healthyWorkers = WORKER_IPS.filter(ip => {
    const health = workerHealth.get(ip);
    return health && health.healthy;
  });

  if (healthyWorkers.length === 0) {
    console.log('⚠️  No healthy workers available!');
    return null;
  }

  // Sort by least busy (fewest jobs)
  healthyWorkers.sort((a, b) => {
    const healthA = workerHealth.get(a);
    const healthB = workerHealth.get(b);
    return (healthA.jobs || 0) - (healthB.jobs || 0);
  });

  const selectedWorker = healthyWorkers[0];
  const health = workerHealth.get(selectedWorker);
  
  console.log(`✅ Selected worker: ${selectedWorker} (${health.jobs} jobs, ${health.cpu}% CPU)`);
  
  return selectedWorker;
}

/**
 * Add video to processing queue
 * Distributes to available workers using load balancing
 */
async function addToQueue(videoId, videoPath, userId) {
  try {
    console.log(`\n📹 Processing video ${videoId}`);
    
    if (!WORKERS_ENABLED) {
      console.log('⚠️  Workers disabled - skipping transcoding');
      await Video.findByIdAndUpdate(videoId, {
        processingStatus: 'pending',
        processingError: 'Workers disabled'
      });
      return { success: false, message: 'Workers disabled' };
    }

    if (WORKER_IPS.length === 0) {
      console.log('⚠️  No workers configured');
      await Video.findByIdAndUpdate(videoId, {
        processingStatus: 'pending',
        processingError: 'No workers configured'
      });
      return { success: false, message: 'No workers configured' };
    }

    // Get best available worker
    const workerIp = await getBestWorker();
    
    if (!workerIp) {
      console.log('❌ All workers are offline or busy');
      await Video.findByIdAndUpdate(videoId, {
        processingStatus: 'pending',
        processingError: 'All workers offline'
      });
      return { success: false, message: 'All workers offline' };
    }

    // Send job to selected worker
    console.log(`🚀 Sending to worker: http://${workerIp}:3001`);
    
    const response = await axios.post(`http://${workerIp}:3001/api/transcode`, {
      videoId: videoId.toString(),
      videoPath,
      userId: userId.toString(),
      callbackUrl: CALLBACK_URL
    }, {
      timeout: 5000
    });

    console.log(`✅ Video ${videoId} queued on ${workerIp}`);
    
    // Update video status
    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'queued',
      assignedWorker: workerIp,
      queuedAt: new Date()
    });

    return { 
      success: true, 
      jobId: response.data.jobId,
      worker: workerIp
    };

  } catch (error) {
    console.error('❌ Error queuing video:', error.message);
    
    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'pending',
      processingError: error.message
    });

    return { 
      success: false, 
      error: error.message
    };
  }
}

/**
 * Get status of all workers
 */
async function getAllWorkersStatus() {
  if (WORKER_IPS.length === 0) {
    return [];
  }

  await Promise.all(
    WORKER_IPS.map(ip => checkWorkerHealth(ip))
  );

  return WORKER_IPS.map(ip => {
    const health = workerHealth.get(ip) || {};
    return {
      ip,
      healthy: health.healthy || false,
      jobs: health.jobs || 0,
      cpu: health.cpu || 0,
      lastCheck: health.lastCheck,
      error: health.error
    };
  });
}

/**
 * Handle transcoding callback from worker
 */
async function handleCallback(videoId, status, variants, error, workerIp) {
  try {
    const updateData = {
      processingStatus: status,
      processingCompleted: new Date()
    };

    if (status === 'completed' && variants) {
      updateData.variants = variants;
    }

    if (error) {
      updateData.processingError = error;
    }

    await Video.findByIdAndUpdate(videoId, updateData);
    console.log(`✅ Video ${videoId} ${status} by worker ${workerIp || 'unknown'}`);

  } catch (err) {
    console.error('Error handling callback:', err);
  }
}

/**
 * Retry failed videos
 */
async function retryFailedVideos() {
  try {
    const failedVideos = await Video.find({
      processingStatus: 'pending',
      createdAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) }
    }).limit(10);

    if (failedVideos.length > 0) {
      console.log(`🔄 Retrying ${failedVideos.length} failed videos...`);
    }

    for (const video of failedVideos) {
      await addToQueue(video._id, video.videoUrl, video.user);
    }

  } catch (error) {
    console.error('Error retrying failed videos:', error);
  }
}

module.exports = {
  addToQueue,
  getAllWorkersStatus,
  handleCallback,
  retryFailedVideos,
  checkWorkerHealth
};
