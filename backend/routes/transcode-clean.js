const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { handleCallback, getAllWorkersStatus, retryFailedVideos } = require('../utils/videoQueue');

// Callback from worker EC2 after video processing
router.post('/callback', handleCallback);

// Get status of all workers (admin only)
router.get('/workers', protect, async (req, res) => {
  try {
    const workersStatus = await getAllWorkersStatus();
    res.json({
      success: true,
      workers: workersStatus,
      totalWorkers: workersStatus.length,
      healthyWorkers: workersStatus.filter(w => w.healthy).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Retry failed videos (admin only)
router.post('/retry', protect, async (req, res) => {
  try {
    await retryFailedVideos();
    res.json({
      success: true,
      message: 'Retry process initiated for failed videos'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
