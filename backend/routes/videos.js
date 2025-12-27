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
  streamVideo,
  getDownloadUrl,
  downloadVideoProxy
} = require('../controllers/videoController');
const { protect, optionalAuth, requireUploadAdmin } = require('../middleware/auth');

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


router.get('/search', searchVideos);
router.get('/search/suggestions', getSearchSuggestions);
router.get('/trending', getTrendingVideos);
router.get('/creators', getTopCreators);
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
