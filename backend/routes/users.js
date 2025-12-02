const express = require('express');
const {
  getUserProfile,
  updateProfile,
  uploadAvatar,
  uploadBanner,
  toggleSubscribe,
  getUserVideos,
  getSubscriptions,
  getWatchHistory,
  addToHistory,
  getLikedVideos,
  getSubscriptionVideos,
  saveVideo,
  getSavedVideos,
  updateSettings
} = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/subscriptions', protect, getSubscriptions);
router.get('/subscriptions/videos', protect, getSubscriptionVideos);
router.get('/history', protect, getWatchHistory);
router.get('/liked', protect, getLikedVideos);
router.get('/saved', protect, getSavedVideos);
router.post('/history/:videoId', protect, addToHistory);
router.post('/saved/:videoId', protect, saveVideo);

router.route('/:id')
  .get(getUserProfile)
  .put(protect, updateProfile);

router.post('/:id/avatar', protect, uploadAvatar);
router.post('/:id/banner', protect, uploadBanner);
router.put('/:id/settings', protect, updateSettings);
router.put('/:id/subscribe', protect, toggleSubscribe);
router.get('/:id/videos', optionalAuth, getUserVideos);

module.exports = router;
