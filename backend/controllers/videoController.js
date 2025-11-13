const Video = require('../models/Video');
const User = require('../models/User');
const path = require('path');

// @desc    Get all videos
// @route   GET /api/videos
// @access  Public
exports.getVideos = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, category, sort = '-createdAt' } = req.query;
    
    const query = { visibility: 'public' };
    if (category && category !== 'all') {
      query.category = category;
    }

    const videos = await Video.find(query)
      .populate('user', 'username avatar channelName')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Video.countDocuments(query);

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

// @desc    Get single video
// @route   GET /api/videos/:id
// @access  Public
exports.getVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('user', 'username avatar channelName subscribers')
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'username avatar' },
        options: { sort: { createdAt: -1 } }
      });

    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload video
// @route   POST /api/videos
// @access  Private
exports.uploadVideo = async (req, res, next) => {
  try {
    const { title, description, category, tags, visibility } = req.body;

    if (!req.files || !req.files.video) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please upload a video file' 
      });
    }

    const videoFile = req.files.video;
    const thumbnailFile = req.files.thumbnail;

    // Check file size (max 500MB for video)
    if (videoFile.size > 500000000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Video file size should be less than 500MB' 
      });
    }

    // Create custom filename
    videoFile.name = `video_${Date.now()}${path.parse(videoFile.name).ext}`;
    const videoPath = `${process.env.FILE_UPLOAD_PATH}/${videoFile.name}`;

    let thumbnailPath = '';
    if (thumbnailFile) {
      thumbnailFile.name = `thumb_${Date.now()}${path.parse(thumbnailFile.name).ext}`;
      thumbnailPath = `${process.env.FILE_UPLOAD_PATH}/${thumbnailFile.name}`;
      await thumbnailFile.mv(thumbnailPath);
    }

    // Move file to upload directory
    await videoFile.mv(videoPath);

    const video = await Video.create({
      title,
      description,
      videoUrl: `/uploads/${videoFile.name}`,
      thumbnailUrl: thumbnailPath ? `/uploads/${thumbnailFile.name}` : undefined,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      visibility: visibility || 'public',
      user: req.user.id
    });

    // Add video to user's videos array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { videos: video._id }
    });

    res.status(201).json({
      success: true,
      data: video
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update video
// @route   PUT /api/videos/:id
// @access  Private
exports.updateVideo = async (req, res, next) => {
  try {
    let video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }

    // Make sure user is video owner
    if (video.user.toString() !== req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to update this video' 
      });
    }

    if (req.body.tags && typeof req.body.tags === 'string') {
      req.body.tags = req.body.tags.split(',').map(tag => tag.trim());
    }

    video = await Video.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete video
// @route   DELETE /api/videos/:id
// @access  Private
exports.deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }

    // Make sure user is video owner
    if (video.user.toString() !== req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to delete this video' 
      });
    }

    await video.deleteOne();

    // Remove video from user's videos array
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { videos: video._id }
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Like/Unlike video
// @route   PUT /api/videos/:id/like
// @access  Private
exports.likeVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }

    const alreadyLiked = video.likes.includes(req.user.id);

    if (alreadyLiked) {
      // Unlike
      video.likes = video.likes.filter(id => id.toString() !== req.user.id);
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { likedVideos: video._id }
      });
    } else {
      // Like
      video.likes.push(req.user.id);
      // Remove from dislikes if exists
      video.dislikes = video.dislikes.filter(id => id.toString() !== req.user.id);
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { likedVideos: video._id }
      });
    }

    await video.save();

    res.status(200).json({
      success: true,
      data: {
        likes: video.likes.length,
        dislikes: video.dislikes.length,
        isLiked: !alreadyLiked
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Dislike video
// @route   PUT /api/videos/:id/dislike
// @access  Private
exports.dislikeVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }

    const alreadyDisliked = video.dislikes.includes(req.user.id);

    if (alreadyDisliked) {
      // Remove dislike
      video.dislikes = video.dislikes.filter(id => id.toString() !== req.user.id);
    } else {
      // Dislike
      video.dislikes.push(req.user.id);
      // Remove from likes if exists
      video.likes = video.likes.filter(id => id.toString() !== req.user.id);
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { likedVideos: video._id }
      });
    }

    await video.save();

    res.status(200).json({
      success: true,
      data: {
        likes: video.likes.length,
        dislikes: video.dislikes.length,
        isDisliked: !alreadyDisliked
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Increment view count
// @route   PUT /api/videos/:id/view
// @access  Public
exports.addView = async (req, res, next) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: { views: video.views }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search videos
// @route   GET /api/videos/search
// @access  Public
exports.searchVideos = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;

    if (!q) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a search query' 
      });
    }

    const videos = await Video.find({
      $text: { $search: q },
      visibility: 'public'
    })
      .populate('user', 'username avatar channelName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Video.countDocuments({
      $text: { $search: q },
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

// @desc    Get trending videos
// @route   GET /api/videos/trending
// @access  Public
exports.getTrendingVideos = async (req, res, next) => {
  try {
    const { limit = 12 } = req.query;

    const videos = await Video.find({ visibility: 'public' })
      .populate('user', 'username avatar channelName')
      .sort({ views: -1, likes: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: videos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
