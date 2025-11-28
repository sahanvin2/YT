const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  migrateLocalVideos,
  getStats,
  getAllUsers,
  getAllVideos,
  deleteUser,
  deleteVideo
} = require('../controllers/adminController');

const router = express.Router();

// Protect all routes and require admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/verify', (req, res) => {
  res.json({ success: true, isAdmin: true, userId: req.user._id });
});

router.post('/migrate-local-videos', migrateLocalVideos);
router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/videos', getAllVideos);
router.delete('/users/:id', deleteUser);
router.delete('/videos/:id', deleteVideo);

module.exports = router;
