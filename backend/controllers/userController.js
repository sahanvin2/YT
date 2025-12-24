const User = require('../models/User');
const Video = require('../models/Video');
const Playlist = require('../models/Playlist');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const { uploadFilePath, deleteFile } = require('../utils/b2');

// Helper function to extract R2 key from URL
function r2KeyFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const keyIndex = pathParts.findIndex(part => part === 'videos' || part === 'avatars' || part === 'banners' || part === 'thumbnails');
    if (keyIndex !== -1) {
      return pathParts.slice(keyIndex).join('/');
    }
    return null;
  } catch {
    return null;
  }
}

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('videos')
      .populate('subscribers', 'username avatar name')
      .populate('subscribedTo', 'username avatar channelName name');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Calculate total views from all videos
    const Video = require('../models/Video');
    const videos = await Video.find({ user: user._id });
    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);
    
    // Update user's totalViews if not set or different
    if (user.totalViews !== totalViews) {
      user.totalViews = totalViews;
      await user.save();
    }

    // Ensure username exists (fallback to name for backward compatibility)
    if (!user.username && user.name) {
      user.username = user.name;
    }
    
    // Ensure channelName exists (fallback to name or username)
    if (!user.channelName) {
      user.channelName = user.username || user.name || 'User';
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    // Make sure user is updating their own profile
    if (req.params.id.toString() !== req.user.id.toString()) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to update this profile' 
      });
    }

    const fieldsToUpdate = {
      email: req.body.email,
      channelDescription: req.body.channelDescription,
      avatar: req.body.avatar,
      country: req.body.country,
      language: req.body.language,
      socialLinks: req.body.socialLinks,
      contactInfo: req.body.contactInfo,
      settings: req.body.settings
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );
    
    // Username and channelName cannot be changed
    delete fieldsToUpdate.username;
    delete fieldsToUpdate.channelName;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload avatar image
// @route   POST /api/users/:id/avatar
// @access  Private
exports.uploadAvatar = async (req, res, next) => {
  try {
    // Make sure user is updating their own profile
    if (req.params.id.toString() !== req.user.id.toString()) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to update this profile' 
      });
    }

    if (!req.files || !req.files.avatar) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please upload an avatar image' 
      });
    }

    const avatarFile = req.files.avatar;
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (avatarFile.size > maxSizeBytes) {
      return res.status(400).json({
        success: false,
        message: 'Avatar file size must be less than 5MB'
      });
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(avatarFile.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Only JPEG, PNG, GIF, and WebP images are allowed'
      });
    }

    // Get current user to delete old avatar if exists
    const currentUser = await User.findById(req.params.id);
    const oldAvatarUrl = currentUser.avatar;

    // Use temp directory for staging before B2 upload
    const tmpDir = path.join(__dirname, '../../tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    
    const ts = Date.now();
    const avatarExt = path.parse(avatarFile.name).ext || '.jpg';
    const tmpAvatarPath = path.join(tmpDir, `avatar_${req.user.id}_${ts}${avatarExt}`);
    await avatarFile.mv(tmpAvatarPath);

    // Upload to B2
    const avatarKey = `avatars/${req.user.id}/${ts}_${path.basename(tmpAvatarPath)}`;
    const avatarCT = mime.lookup(tmpAvatarPath) || 'image/jpeg';
    const avatarUrl = await uploadFilePath(tmpAvatarPath, avatarKey, avatarCT);

    // Cleanup temp file
    fs.unlink(tmpAvatarPath, () => {});

    // Delete old avatar from B2 if it's a custom upload (starts with B2 URL)
    if (oldAvatarUrl && oldAvatarUrl.includes('backblazeb2.com')) {
      try {
        // Extract key from URL
        const urlParts = oldAvatarUrl.split('/');
        const keyIndex = urlParts.findIndex(part => part === 'avatars');
        if (keyIndex !== -1) {
          const key = urlParts.slice(keyIndex).join('/');
          await deleteFile(key);
        }
      } catch (err) {
        console.error('Error deleting old avatar:', err);
        // Continue even if deletion fails
      }
    }

    // Update user avatar
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: {
        avatar: avatarUrl,
        user: user
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Subscribe/Unsubscribe to user
// @route   PUT /api/users/:id/subscribe
// @access  Private
exports.toggleSubscribe = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot subscribe to yourself' 
      });
    }

    const channelUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!channelUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const isSubscribed = currentUser.subscribedTo.includes(req.params.id);

    if (isSubscribed) {
      // Unsubscribe
      currentUser.subscribedTo = currentUser.subscribedTo.filter(
        id => id.toString() !== req.params.id
      );
      channelUser.subscribers = channelUser.subscribers.filter(
        id => id.toString() !== req.user.id
      );
    } else {
      // Subscribe
      currentUser.subscribedTo.push(req.params.id);
      channelUser.subscribers.push(req.user.id);
    }

    await currentUser.save();
    await channelUser.save();

    res.status(200).json({
      success: true,
      data: {
        isSubscribed: !isSubscribed,
        subscriberCount: channelUser.subscribers.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's videos
// @route   GET /api/users/:id/videos
// @access  Public
exports.getUserVideos = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const userId = req.params.id;
    const requestingUserId = req.user?.id;

    // If user is viewing their own channel, show all videos (public and private)
    // Otherwise, only show public videos
    const query = { user: userId };
    const isOwnChannel = requestingUserId && requestingUserId.toString() === userId.toString();
    
    if (!isOwnChannel) {
      query.visibility = 'public';
    }

    // Debug logging
    console.log(`📹 getUserVideos - userId: ${userId}, requestingUserId: ${requestingUserId}, isOwnChannel: ${isOwnChannel}, limit: ${limit}`);

    const videos = await Video.find(query)
      .populate('user', 'username avatar channelName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Video.countDocuments(query);

    // Convert URLs to CDN URLs
    const { cdnUrlFrom } = require('../utils/cdn');
    const videosWithCDN = videos.map(video => {
      const videoObj = video.toObject();
      const original = videoObj.filePath || videoObj.url || videoObj.path || videoObj.videoUrl;
      videoObj.cdnUrl = cdnUrlFrom(original);
      videoObj.videoUrl = videoObj.cdnUrl;
      if (videoObj.thumbnailUrl) {
        videoObj.thumbnailUrl = cdnUrlFrom(videoObj.thumbnailUrl);
      }
      if (videoObj.variants && Array.isArray(videoObj.variants)) {
        videoObj.variants = videoObj.variants.map(variant => ({
          ...variant,
          url: cdnUrlFrom(variant.url || variant.videoUrl || variant.sourceUrl),
          cdnUrl: cdnUrlFrom(variant.url || variant.videoUrl || variant.sourceUrl)
        }));
      }
      return videoObj;
    });

    res.status(200).json({
      success: true,
      data: videosWithCDN,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get subscribed channels
// @route   GET /api/users/subscriptions
// @access  Private
exports.getSubscriptions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('subscribedTo', 'username avatar channelName subscribers');

    res.status(200).json({
      success: true,
      data: user.subscribedTo
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get videos from subscribed channels
// @route   GET /api/users/subscriptions/videos
// @access  Private
exports.getSubscriptionVideos = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('subscribedTo');
    const { page = 1, limit = 12 } = req.query;
    const videos = await Video.find({
      user: { $in: user.subscribedTo },
      visibility: 'public'
    })
      .populate('user', 'username avatar channelName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Video.countDocuments({
      user: { $in: user.subscribedTo },
      visibility: 'public'
    });

    res.status(200).json({
      success: true,
      data: videos,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get watch history
// @route   GET /api/users/history
// @access  Private
exports.getWatchHistory = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'watchHistory.video',
        populate: { path: 'user', select: 'username avatar channelName' }
      });

    const history = user.watchHistory
      .filter(item => item.video) // Filter out deleted videos
      .sort((a, b) => b.watchedAt - a.watchedAt);

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add to watch history
// @route   POST /api/users/history/:videoId
// @access  Private
exports.addToHistory = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Remove video if already in history
    user.watchHistory = user.watchHistory.filter(
      item => item.video.toString() !== req.params.videoId
    );

    // Add to beginning of history
    user.watchHistory.unshift({
      video: req.params.videoId,
      watchedAt: Date.now()
    });

    // Keep only last 100 videos
    if (user.watchHistory.length > 100) {
      user.watchHistory = user.watchHistory.slice(0, 100);
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get liked videos for current user
// @route   GET /api/users/liked
// @access  Private
exports.getLikedVideos = async (req, res, next) => {
  try {
    // Find videos where the current user is in the likes array
    const videos = await Video.find({ 
      likes: { $in: [req.user.id] },
      visibility: 'public'
    })
      .populate('user', 'username avatar channelName name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: videos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save/Unsave video for current user
// @route   POST /api/users/saved/:videoId
// @access  Private
exports.saveVideo = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const videoId = req.params.videoId;

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Toggle save status
    const isSaved = user.savedVideos.includes(videoId);
    
    if (isSaved) {
      // Remove from saved
      user.savedVideos = user.savedVideos.filter(
        id => id.toString() !== videoId
      );
    } else {
      // Add to saved
      user.savedVideos.push(videoId);
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        saved: !isSaved,
        savedVideos: user.savedVideos
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get saved videos for current user
// @route   GET /api/users/saved
// @access  Private
exports.getSavedVideos = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'savedVideos',
        populate: { path: 'user', select: 'username avatar channelName' }
      });

    const videos = user.savedVideos || [];
    
    res.status(200).json({
      success: true,
      data: videos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload channel banner image
// @route   POST /api/users/:id/banner
// @access  Private
exports.uploadBanner = async (req, res, next) => {
  try {
    // Make sure user is updating their own profile
    if (req.params.id.toString() !== req.user.id.toString()) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to update this profile' 
      });
    }

    if (!req.files || !req.files.banner) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please upload a banner image' 
      });
    }

    const bannerFile = req.files.banner;
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (bannerFile.size > maxSizeBytes) {
      return res.status(400).json({
        success: false,
        message: 'Banner file size must be less than 10MB'
      });
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(bannerFile.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Only JPEG, PNG, GIF, and WebP images are allowed'
      });
    }

    // Get current user to delete old banner if exists
    const currentUser = await User.findById(req.params.id);
    const oldBannerUrl = currentUser.channelBanner;

    // Use temp directory for staging before B2 upload
    const tmpDir = path.join(__dirname, '../../tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    
    const ts = Date.now();
    const bannerExt = path.parse(bannerFile.name).ext || '.jpg';
    const tmpBannerPath = path.join(tmpDir, `banner_${req.user.id}_${ts}${bannerExt}`);
    await bannerFile.mv(tmpBannerPath);

    // Upload to B2
    const bannerKey = `banners/${req.user.id}/${ts}_${path.basename(tmpBannerPath)}`;
    const bannerCT = mime.lookup(tmpBannerPath) || 'image/jpeg';
    const bannerUrl = await uploadFilePath(tmpBannerPath, bannerKey, bannerCT);

    // Clean up temp file
    fs.unlink(tmpBannerPath, () => {});

    // Delete old banner from B2 if exists
    if (oldBannerUrl && oldBannerUrl.includes('backblazeb2.com')) {
      try {
        const key = r2KeyFromUrl(oldBannerUrl);
        if (key) {
          await deleteFile(key);
        }
      } catch (err) {
        console.error('Error deleting old banner:', err);
        // Don't fail the request if old banner deletion fails
      }
    }

    // Update user with new banner URL
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { channelBanner: bannerUrl },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: {
        channelBanner: bannerUrl,
        user: updatedUser
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user settings
// @route   PUT /api/users/:id/settings
// @access  Private
exports.updateSettings = async (req, res, next) => {
  try {
    // Make sure user is updating their own settings
    if (req.params.id.toString() !== req.user.id.toString()) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to update this profile' 
      });
    }

    const { settings } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { settings: settings || {} },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
