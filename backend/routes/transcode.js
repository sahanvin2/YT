const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { handleCallback, getAllWorkersStatus, retryFailedVideos } = require('../utils/videoQueue');

// Worker callback endpoint (called by workers when job completes)
router.post('/callback', async (req, res) => {
  try {
    const { videoId, status, variants, error, workerIp } = req.body;
    await handleCallback(videoId, status, variants, error, workerIp);
    res.json({ success: true });
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all workers status (admin only)
router.get('/workers', protect, async (req, res) => {
  try {
    const workers = await getAllWorkersStatus();
    res.json({ 
      success: true, 
      workers,
      totalWorkers: workers.length,
      healthyWorkers: workers.filter(w => w.healthy).length
    });
  } catch (error) {
    console.error('Error getting workers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Retry failed videos (admin only)
router.post('/retry', protect, async (req, res) => {
  try {
    await retryFailedVideos();
    res.json({ success: true, message: 'Retry process started' });
  } catch (error) {
    console.error('Error retrying:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
