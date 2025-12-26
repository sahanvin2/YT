const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Video = require('../models/Video');
const { uploadFilePath, deleteFile } = require('../utils/b2');

/**
 * Helper to derive B2 key from video URL
 */
function deriveKeyFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const parts = url.split('/').filter(Boolean);
  return parts.slice(-2).join('/');
}

/**
 * @desc Migrate local /uploads videos to B2
 * @route POST /api/admin/migrate-videos
 * @access Private/Admin
 */
exports.migrateLocalVideos = async (req, res) => {
  try {
    const localPrefix = '/uploads/';
    const baseUploadsDir = path.join(__dirname, '../uploads');
    const candidates = await Video.find({ videoUrl: { $regex: '^/uploads/' } });
    const results = [];

    for (const video of candidates) {
      const rel = video.videoUrl.replace(localPrefix, '');
      const localPath = path.join(baseUploadsDir, rel);

      if (!fs.existsSync(localPath)) {
        results.push({ id: video._id, skipped: true, reason: 'file missing' });
        continue;
      }

      const ts = Date.now();
      const key = `videos/${video.user}/${ts}_${path.basename(localPath)}`;

      try {
        const newUrl = await uploadFilePath(localPath, key);
        video.videoUrl = newUrl;
        await video.save();

        // Cleanup local file
        fs.unlinkSync(localPath);

        results.push({ id: video._id, migrated: true, newUrl });
      } catch (err) {
        console.error(`Migration failed for video ${video._id}:`, err);
        results.push({ id: video._id, error: err.message });
      }
    }

    res.json({ success: true, total: candidates.length, results });
  } catch (err) {
    console.error('Migration error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc Get admin stats
 * @route GET /api/admin/stats
 * @access Private/Admin
 */
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVideos = await Video.countDocuments();
    const totalViewsAgg = await Video.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalVideos,
        totalViews: totalViewsAgg[0]?.total || 0
      }
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc List all users with pagination
 * @route GET /api/admin/users
 * @access Private/Admin
 */
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000; // Increased for admin panel

    const users = await User.find()
      .select('-password')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit);

    // Get video count for each user
    const usersWithCount = await Promise.all(
      users.map(async (user) => {
        const videoCount = await Video.countDocuments({ user: user._id });
        return {
          ...user.toObject(),
          videoCount
        };
      })
    );

    const totalUsers = await User.countDocuments();

    res.json({
      success: true,
      count: usersWithCount.length,
      total: totalUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      data: usersWithCount
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc List all videos with pagination
 * @route GET /api/admin/videos
 * @access Private/Admin
 */
exports.getAllVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const videos = await Video.find()
      .populate('user', 'username email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit);

    const totalVideos = await Video.countDocuments();

    res.json({
      success: true,
      count: videos.length,
      total: totalVideos,
      currentPage: page,
      totalPages: Math.ceil(totalVideos / limit),
      data: videos
    });
  } catch (err) {
    console.error('Get videos error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc Delete a single video (DB + B2)
 * @route DELETE /api/admin/videos/:id
 * @access Private/Admin
 */
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

    // Delete main video from B2
    const mainKey = deriveKeyFromUrl(video.videoUrl);
    if (mainKey) await deleteFile(mainKey);

    // Delete thumbnail from B2
    if (video.thumbnailUrl) {
      const thumbKey = deriveKeyFromUrl(video.thumbnailUrl);
      if (thumbKey) await deleteFile(thumbKey);
    }

    // Delete any variant/source videos
    const variantList = Array.isArray(video.sources) ? video.sources : [];
    for (const variant of variantList) {
      const key = deriveKeyFromUrl(variant.url || variant.videoUrl || variant.sourceUrl);
      if (key) await deleteFile(key);
    }

    await video.deleteOne();

    res.json({ success: true, data: {} });
  } catch (err) {
    console.error('Delete video error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc Delete a user + all their videos (DB + B2)
 * @route DELETE /api/admin/users/:id
 * @access Private/Admin
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Delete all user's videos
    const videos = await Video.find({ user: user._id });
    for (const video of videos) {
      const mainKey = deriveKeyFromUrl(video.videoUrl);
      if (mainKey) await deleteFile(mainKey);

      if (video.thumbnailUrl) {
        const thumbKey = deriveKeyFromUrl(video.thumbnailUrl);
        if (thumbKey) await deleteFile(thumbKey);
      }

      const variantList = Array.isArray(video.sources) ? video.sources : [];
      for (const variant of variantList) {
        const key = deriveKeyFromUrl(variant.url || variant.videoUrl || variant.sourceUrl);
        if (key) await deleteFile(key);
      }

      await video.deleteOne();
    }

    await user.deleteOne();

    res.json({ success: true, data: {} });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
