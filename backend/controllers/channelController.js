const Channel = require('../models/Channel');
const User = require('../models/User');
const Video = require('../models/Video');

// @desc    Create a new channel
// @route   POST /api/channels
// @access  Private
exports.createChannel = async (req, res, next) => {
  try {
    // Check if user already has 3 channels
    const existingChannels = await Channel.countDocuments({ user: req.user.id, isActive: true });
    if (existingChannels >= 3) {
      return res.status(400).json({
        success: false,
        message: 'You can only create up to 3 channels'
      });
    }

    const channel = await Channel.create({
      user: req.user.id,
      channelName: req.body.channelName,
      channelDescription: req.body.channelDescription || '',
      avatar: req.body.avatar || req.user.avatar || '',
      channelBanner: req.body.channelBanner || ''
    });

    res.status(201).json({
      success: true,
      data: channel
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's channels
// @route   GET /api/channels/my-channels
// @access  Private
exports.getMyChannels = async (req, res, next) => {
  try {
    const channels = await Channel.find({ user: req.user.id, isActive: true })
      .populate('videos')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: channels
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get channel by ID
// @route   GET /api/channels/:id
// @access  Public
exports.getChannel = async (req, res, next) => {
  try {
    const channel = await Channel.findById(req.params.id)
      .populate('user', 'username name email')
      .populate('subscribers', 'username avatar channelName')
      .populate('videos');

    if (!channel || !channel.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    // Calculate total views
    const videos = await Video.find({ channel: channel._id });
    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);
    channel.totalViews = totalViews;

    res.status(200).json({
      success: true,
      data: channel
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update channel
// @route   PUT /api/channels/:id
// @access  Private
exports.updateChannel = async (req, res, next) => {
  try {
    const channel = await Channel.findById(req.params.id);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    // Check if user owns the channel
    if (channel.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this channel'
      });
    }

    const fieldsToUpdate = {
      channelDescription: req.body.channelDescription,
      avatar: req.body.avatar,
      channelBanner: req.body.channelBanner,
      country: req.body.country,
      language: req.body.language,
      socialLinks: req.body.socialLinks,
      contactInfo: req.body.contactInfo
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    // Channel name cannot be changed
    delete fieldsToUpdate.channelName;

    const updatedChannel = await Channel.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedChannel
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete channel
// @route   DELETE /api/channels/:id
// @access  Private
exports.deleteChannel = async (req, res, next) => {
  try {
    const channel = await Channel.findById(req.params.id);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    // Check if user owns the channel
    if (channel.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this channel'
      });
    }

    // Soft delete - set isActive to false
    channel.isActive = false;
    await channel.save();

    res.status(200).json({
      success: true,
      message: 'Channel deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

