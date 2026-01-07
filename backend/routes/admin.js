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
const Video = require('../models/Video');
const SiteSettings = require('../models/SiteSettings');

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

// ==================
// Site Settings Routes
// ==================

// Get all site settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await SiteSettings.find().populate('updatedBy', 'username email');
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings'
    });
  }
});

// Get specific setting
router.get('/settings/:key', async (req, res) => {
  try {
    const value = await SiteSettings.getSetting(req.params.key);
    res.status(200).json({
      success: true,
      data: value
    });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get setting'
    });
  }
});

// Set banner video (master admin only)
router.put('/settings/banner-video', isMasterAdmin, async (req, res) => {
  try {
    if (!req.isMasterAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only master admin can change banner video'
      });
    }

    const { videoId } = req.body;

    // Verify video exists
    const video = await Video.findById(videoId).populate('user', 'username avatar channelName');
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    const setting = await SiteSettings.setSetting(
      'banner_video',
      videoId,
      req.user._id,
      'Featured banner video on homepage'
    );

    res.status(200).json({
      success: true,
      message: 'Banner video updated successfully',
      data: {
        setting,
        video
      }
    });
  } catch (error) {
    console.error('Set banner video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set banner video'
    });
  }
});

// Clear banner video
router.delete('/settings/banner-video', isMasterAdmin, async (req, res) => {
  try {
    if (!req.isMasterAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only master admin can clear banner video'
      });
    }

    await SiteSettings.findOneAndDelete({ key: 'banner_video' });

    res.status(200).json({
      success: true,
      message: 'Banner video cleared - will use trending video'
    });
  } catch (error) {
    console.error('Clear banner video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear banner video'
    });
  }
});

// Set maintenance mode
router.put('/settings/maintenance', isMasterAdmin, async (req, res) => {
  try {
    if (!req.isMasterAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only master admin can change maintenance mode'
      });
    }

    const { enabled, message } = req.body;

    const setting = await SiteSettings.setSetting(
      'maintenance_mode',
      { enabled: !!enabled, message: message || 'We are currently performing maintenance.' },
      req.user._id,
      'Site maintenance mode toggle'
    );

    res.status(200).json({
      success: true,
      message: enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled',
      data: setting
    });
  } catch (error) {
    console.error('Set maintenance mode error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set maintenance mode'
    });
  }
});

module.exports = router;
