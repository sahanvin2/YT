const User = require('../models/User');
const Video = require('../models/Video');

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('videos')
      .populate('subscribers', 'username avatar')
      .populate('subscribedTo', 'username avatar channelName');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
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
    if (req.params.id !== req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to update this profile' 
      });
    }

    const fieldsToUpdate = {
      username: req.body.username,
      email: req.body.email,
      channelName: req.body.channelName,
      channelDescription: req.body.channelDescription,
      avatar: req.body.avatar
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

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

    const videos = await Video.find({ 
      user: req.params.id,
      visibility: 'public'
    })
      .populate('user', 'username avatar channelName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Video.countDocuments({ 
      user: req.params.id,
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
    const user = await User.findById(req.user.id).select('likedVideos');
    const videos = await Video.find({ _id: { $in: user.likedVideos } })
      .populate('user', 'username avatar channelName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: videos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
