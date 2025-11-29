const express = require('express');
const {
  getUserProfile,
  updateProfile,
  uploadAvatar,
  toggleSubscribe,
  getUserVideos,
  getSubscriptions,
  getWatchHistory,
  addToHistory,
  getLikedVideos,
  getSubscriptionVideos
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/subscriptions', protect, getSubscriptions);
router.get('/subscriptions/videos', protect, getSubscriptionVideos);
router.get('/history', protect, getWatchHistory);
router.get('/liked', protect, getLikedVideos);
router.post('/history/:videoId', protect, addToHistory);

router.route('/:id')
  .get(getUserProfile)
  .put(protect, updateProfile);

router.post('/:id/avatar', protect, uploadAvatar);
router.put('/:id/subscribe', protect, toggleSubscribe);
router.get('/:id/videos', getUserVideos);

module.exports = router;
