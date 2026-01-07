const express = require('express');
const {
  getVideos,
  getVideo,
  uploadVideo,
  updateVideo,
  deleteVideo,
  likeVideo,
  dislikeVideo,
  addView,
  searchVideos,
  getSearchSuggestions,
  getTrendingVideos,
  getTopCreators,
  createVideoFromUrl,
  uploadHlsFolder,
  uploadHlsComplete,
  streamVideo,
  getDownloadUrl,
  downloadVideoProxy
} = require('../controllers/videoController');
const { protect, optionalAuth, requireUploadAdmin } = require('../middleware/auth');
const SiteSettings = require('../models/SiteSettings');
const Video = require('../models/Video');

const router = express.Router();

// Comment routes
const commentRouter = require('./comments');
router.use('/:videoId/comments', commentRouter);

router.route('/')
  .get(getVideos)
  .post(protect, requireUploadAdmin, uploadVideo);

// Create a video from an already uploaded R2 URL (via presigned PUT)
router.post('/create', protect, requireUploadAdmin, createVideoFromUrl);

// Upload pre-processed HLS folder (skip processing queue)
router.post('/upload-hls-folder', protect, requireUploadAdmin, uploadHlsFolder);

// Upload HLS folder with files (new user-friendly version)
router.post('/upload-hls-complete', protect, requireUploadAdmin, uploadHlsComplete);


router.get('/search', searchVideos);
router.get('/search/suggestions', getSearchSuggestions);
router.get('/trending', getTrendingVideos);
router.get('/creators', getTopCreators);

// Get banner video (public - for homepage)
router.get('/banner', async (req, res) => {
  try {
    // First check if admin has set a specific banner video
    const bannerVideoId = await SiteSettings.getSetting('banner_video');
    
    if (bannerVideoId) {
      const video = await Video.findById(bannerVideoId)
        .populate('user', 'username avatar channelName subscriberCount')
        .select('title description thumbnailUrl views likes duration createdAt category');
      
      if (video) {
        return res.status(200).json({
          success: true,
          data: video,
          source: 'admin_selected'
        });
      }
    }
    
    // Fallback to most viewed/trending video
    const trendingVideo = await Video.findOne({ status: 'ready' })
      .sort({ views: -1, createdAt: -1 })
      .populate('user', 'username avatar channelName subscriberCount')
      .select('title description thumbnailUrl views likes duration createdAt category');
    
    res.status(200).json({
      success: true,
      data: trendingVideo,
      source: 'trending'
    });
  } catch (error) {
    console.error('Get banner video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get banner video'
    });
  }
});
router.get('/:id/stream', streamVideo);
router.get('/:id/download', getDownloadUrl);
router.get('/:id/download-file', downloadVideoProxy);


router.route('/:id')
  .get(optionalAuth, getVideo)
  .put(protect, requireUploadAdmin, updateVideo)
  .delete(protect, requireUploadAdmin, deleteVideo);

router.put('/:id/like', protect, likeVideo);
router.put('/:id/dislike', protect, dislikeVideo);
router.put('/:id/view', addView);

module.exports = router;
