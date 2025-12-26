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
const User = require('../models/User');

const router = express.Router();

// Middleware to check for master admin
const isMasterAdmin = (req, res, next) => {
  if (req.user.email === 'snawarathne60@gmail.com') {
    req.isMasterAdmin = true;
  }
  next();
};

// Protect all routes and require admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/verify', (req, res) => {
  res.json({ success: true, isAdmin: true, userId: req.user._id });
});

// Promote user to admin (any admin can do this)
router.put('/users/:id/promote', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin' && user.isUploadAdmin) {
      return res.status(400).json({
        success: false,
        message: 'User is already an admin'
      });
    }

    user.role = 'admin';
    user.isUploadAdmin = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User promoted to admin successfully',
      data: user
    });
  } catch (error) {
    console.error('Promote user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Demote admin to user (only master admin)
router.put('/users/:id/demote', isMasterAdmin, async (req, res) => {
  try {
    if (!req.isMasterAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only master admin can demote admins'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.email === 'snawarathne60@gmail.com') {
      return res.status(403).json({
        success: false,
        message: 'Cannot demote master admin'
      });
    }

    if (user.role !== 'admin' && !user.isUploadAdmin) {
      return res.status(400).json({
        success: false,
        message: 'User is not an admin'
      });
    }

    user.role = 'user';
    user.isUploadAdmin = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Admin demoted to user successfully',
      data: user
    });
  } catch (error) {
    console.error('Demote admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.post('/migrate-local-videos', migrateLocalVideos);
router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/videos', getAllVideos);
router.delete('/users/:id', deleteUser);
router.delete('/videos/:id', deleteVideo);

module.exports = router;
