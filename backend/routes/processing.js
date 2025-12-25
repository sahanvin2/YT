const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getProcessingStatus, getVideosByStatus } = require('../controllers/processingController');

// Get processing status for a specific video
router.get('/:id/status', getProcessingStatus);

// Get all videos by status (admin/debugging)
router.get('/status/:status', protect, getVideosByStatus);

module.exports = router;
