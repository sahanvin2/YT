const Video = require('../models/Video');

/**
 * Get video processing status
 * @route GET /api/videos/:id/status
 */
exports.getProcessingStatus = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .select('title processingStatus processingError processingCompleted hlsUrl createdAt');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Calculate processing time if completed
    let processingTime = null;
    if (video.processingCompleted && video.createdAt) {
      processingTime = Math.round((video.processingCompleted - video.createdAt) / 1000); // seconds
    }

    res.json({
      success: true,
      data: {
        videoId: video._id,
        title: video.title,
        status: video.processingStatus,
        error: video.processingError,
        hlsUrl: video.hlsUrl,
        isReady: video.processingStatus === 'completed' && video.hlsUrl,
        processingTime,
        uploadedAt: video.createdAt,
        completedAt: video.processingCompleted
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all videos by processing status
 * @route GET /api/videos/status/:status
 */
exports.getVideosByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const allowedStatuses = ['queued', 'processing', 'completed', 'failed', 'pending'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}`
      });
    }

    const videos = await Video.find({ processingStatus: status })
      .populate('user', 'username channelName')
      .select('title processingStatus processingError hlsUrl createdAt processingCompleted')
      .sort('-createdAt')
      .limit(50);

    res.json({
      success: true,
      count: videos.length,
      data: videos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getProcessingStatus: exports.getProcessingStatus,
  getVideosByStatus: exports.getVideosByStatus
};
