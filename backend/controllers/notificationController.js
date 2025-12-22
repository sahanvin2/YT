const Notification = require('../models/Notification');
const User = require('../models/User');

// Get user notifications
exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ userId: req.user._id })
      .populate('creatorId', 'username avatarUrl')
      .populate('videoId', 'title thumbnailUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ userId: req.user._id });
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user._id, 
      read: false 
    });

    res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.user._id, 
      read: false 
    });
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Error fetching unread count' });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
};

// Create notification (helper function for internal use)
exports.createNotification = async (userId, type, data) => {
  try {
    const notification = new Notification({
      userId,
      type,
      title: data.title,
      message: data.message,
      creatorId: data.creatorId,
      videoId: data.videoId,
      thumbnailUrl: data.thumbnailUrl
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Notify followers of new video
exports.notifyFollowersNewVideo = async (creatorId, videoData) => {
  try {
    // Find all followers of this creator
    const creator = await User.findById(creatorId).select('followers username');
    
    if (!creator || !creator.followers || creator.followers.length === 0) {
      return;
    }

    // Create notifications for each follower
    const notifications = creator.followers.map(followerId => ({
      userId: followerId,
      type: 'new_video',
      title: 'New Video',
      message: `${creator.username} uploaded a new video: ${videoData.title}`,
      creatorId: creatorId,
      videoId: videoData._id,
      thumbnailUrl: videoData.thumbnailUrl
    }));

    await Notification.insertMany(notifications);
    console.log(`Created ${notifications.length} notifications for new video`);
  } catch (error) {
    console.error('Error notifying followers:', error);
  }
};
