const Playlist = require('../models/Playlist');
const Video = require('../models/Video');
const User = require('../models/User');

// @desc    Create playlist
// @route   POST /api/playlists
// @access  Private
exports.createPlaylist = async (req, res, next) => {
  try {
    const { name, description, isPublic } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Playlist name is required'
      });
    }

    const playlist = await Playlist.create({
      name: name.trim(),
      description: description?.trim() || '',
      user: req.user.id,
      isPublic: isPublic !== undefined ? isPublic : true
    });

    // Add playlist to user's playlists
    await User.findByIdAndUpdate(req.user.id, {
      $push: { playlists: playlist._id }
    });

    res.status(201).json({
      success: true,
      data: playlist
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's playlists
// @route   GET /api/playlists
// @access  Private
exports.getPlaylists = async (req, res, next) => {
  try {
    const playlists = await Playlist.find({ user: req.user.id })
      .populate('videos', 'title thumbnailUrl duration views')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: playlists
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single playlist
// @route   GET /api/playlists/:id
// @access  Public (if public) or Private (if own)
exports.getPlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('user', 'username avatar channelName')
      .populate({
        path: 'videos',
        populate: { path: 'user', select: 'username avatar channelName' }
      });

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check if user can access this playlist
    if (!playlist.isPublic && playlist.user._id.toString() !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: playlist
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update playlist
// @route   PUT /api/playlists/:id
// @access  Private
exports.updatePlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check if user owns the playlist
    if (playlist.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this playlist'
      });
    }

    const { name, description, isPublic } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('videos', 'title thumbnailUrl duration views');

    res.status(200).json({
      success: true,
      data: updatedPlaylist
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete playlist
// @route   DELETE /api/playlists/:id
// @access  Private
exports.deletePlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check if user owns the playlist
    if (playlist.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this playlist'
      });
    }

    await Playlist.findByIdAndDelete(req.params.id);

    // Remove playlist from user's playlists
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { playlists: playlist._id }
    });

    res.status(200).json({
      success: true,
      message: 'Playlist deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add video to playlist
// @route   POST /api/playlists/:id/videos/:videoId
// @access  Private
exports.addVideoToPlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check if user owns the playlist
    if (playlist.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this playlist'
      });
    }

    // Check if video exists
    const video = await Video.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if video is already in playlist
    if (playlist.videos.some(id => id.toString() === req.params.videoId.toString())) {
      return res.status(400).json({
        success: false,
        message: 'Video already in playlist'
      });
    }

    playlist.videos.push(req.params.videoId);
    await playlist.save();

    const updatedPlaylist = await Playlist.findById(req.params.id)
      .populate('videos', 'title thumbnailUrl duration views');

    res.status(200).json({
      success: true,
      data: updatedPlaylist
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove video from playlist
// @route   DELETE /api/playlists/:id/videos/:videoId
// @access  Private
exports.removeVideoFromPlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check if user owns the playlist
    if (playlist.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this playlist'
      });
    }

    playlist.videos = playlist.videos.filter(
      videoId => videoId.toString() !== req.params.videoId
    );
    await playlist.save();

    const updatedPlaylist = await Playlist.findById(req.params.id)
      .populate('videos', 'title thumbnailUrl duration views');

    res.status(200).json({
      success: true,
      data: updatedPlaylist
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

