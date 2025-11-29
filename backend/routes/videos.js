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
  createVideoFromUrl,
  streamVideo,
  getDownloadUrl
} = require('../controllers/videoController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Comment routes
const commentRouter = require('./comments');
router.use('/:videoId/comments', commentRouter);

router.route('/')
  .get(getVideos)
  .post(protect, uploadVideo);

// Create a video from an already uploaded R2 URL (via presigned PUT)
router.post('/create', protect, createVideoFromUrl);


router.get('/search', searchVideos);
router.get('/search/suggestions', getSearchSuggestions);
router.get('/trending', getTrendingVideos);
router.get('/:id/stream', streamVideo);
router.get('/:id/download', getDownloadUrl);


router.route('/:id')
  .get(getVideo)
  .put(protect, updateVideo)
  .delete(protect, deleteVideo);

router.put('/:id/like', protect, likeVideo);
router.put('/:id/dislike', protect, dislikeVideo);
router.put('/:id/view', addView);

module.exports = router;
