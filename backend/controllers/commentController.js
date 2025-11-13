const Comment = require('../models/Comment');
const Video = require('../models/Video');

// @desc    Get comments for a video
// @route   GET /api/videos/:videoId/comments
// @access  Public
exports.getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ video: req.params.videoId })
      .populate('user', 'username avatar')
      .populate('replies.user', 'username avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add comment to video
// @route   POST /api/videos/:videoId/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;

    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }

    const comment = await Comment.create({
      text,
      user: req.user.id,
      video: req.params.videoId
    });

    // Add comment to video's comments array
    video.comments.push(comment._id);
    await video.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'username avatar');

    res.status(201).json({
      success: true,
      data: populatedComment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Comment not found' 
      });
    }

    // Make sure user is comment owner
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to delete this comment' 
      });
    }

    // Remove comment from video's comments array
    await Video.findByIdAndUpdate(comment.video, {
      $pull: { comments: comment._id }
    });

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Like comment
// @route   PUT /api/comments/:id/like
// @access  Private
exports.likeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Comment not found' 
      });
    }

    const alreadyLiked = comment.likes.includes(req.user.id);

    if (alreadyLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== req.user.id);
    } else {
      comment.likes.push(req.user.id);
    }

    await comment.save();

    res.status(200).json({
      success: true,
      data: {
        likes: comment.likes.length,
        isLiked: !alreadyLiked
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add reply to comment
// @route   POST /api/comments/:id/reply
// @access  Private
exports.addReply = async (req, res, next) => {
  try {
    const { text } = req.body;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Comment not found' 
      });
    }

    comment.replies.push({
      text,
      user: req.user.id
    });

    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate('user', 'username avatar')
      .populate('replies.user', 'username avatar');

    res.status(201).json({
      success: true,
      data: updatedComment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
