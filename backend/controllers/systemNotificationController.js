const SystemNotification = require('../models/SystemNotification');
const User = require('../models/User');

// @desc    Send system notification (Master Admin only)
// @route   POST /api/system-notifications
// @access  Private/Master Admin
exports.sendNotification = async (req, res) => {
  try {
    const { title, message, type, recipients, selectedUserIds, priority, expiresAt, link, icon } = req.body;

    // Verify master admin (you can add this field to User model or hardcode the master admin ID)
    const masterAdminId = process.env.ADMIN_USER_ID;
    if (req.user.id !== masterAdminId) {
      return res.status(403).json({
        success: false,
        message: 'Only master admin can send system notifications'
      });
    }

    // Validate recipients
    if (!['all_users', 'all_admins', 'selected_users', 'selected_admins'].includes(recipients)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipients type'
      });
    }

    // If selected users/admins, validate the IDs
    let selectedUsers = [];
    if (recipients === 'selected_users' || recipients === 'selected_admins') {
      if (!selectedUserIds || selectedUserIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please select at least one user'
        });
      }

      // Verify users exist
      const users = await User.find({ _id: { $in: selectedUserIds } });
      if (users.length !== selectedUserIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some selected users do not exist'
        });
      }

      // If selected_admins, verify they are admins
      if (recipients === 'selected_admins') {
        const nonAdmins = users.filter(u => u.role !== 'admin');
        if (nonAdmins.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'All selected users must be admins'
          });
        }
      }

      selectedUsers = selectedUserIds;
    }

    // Create notification
    const notification = await SystemNotification.create({
      title,
      message,
      type: type || 'info',
      sender: req.user.id,
      recipients,
      selectedUsers,
      priority: priority || 'normal',
      expiresAt: expiresAt || null,
      link: link || '',
      icon: icon || 'bell'
    });

    // Populate sender info
    await notification.populate('sender', 'name email username');

    // Count recipients
    let recipientCount = 0;
    if (recipients === 'all_users') {
      recipientCount = await User.countDocuments();
    } else if (recipients === 'all_admins') {
      recipientCount = await User.countDocuments({ role: 'admin' });
    } else {
      recipientCount = selectedUsers.length;
    }

    res.status(201).json({
      success: true,
      data: notification,
      recipientCount,
      message: `Notification sent to ${recipientCount} user(s)`
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

// @desc    Get user's notifications
// @route   GET /api/system-notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Find notifications for this user
    const query = {
      $or: [
        { recipients: 'all_users' },
        { recipients: 'all_admins', $and: [{ /* Will be filled based on user role */ }] },
        { recipients: 'selected_users', selectedUsers: req.user.id },
        { recipients: 'selected_admins', selectedUsers: req.user.id }
      ],
      deletedBy: { $ne: req.user.id },
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    };

    // Adjust query for admin users
    if (req.user.role === 'admin') {
      // Admin can see all_admins notifications
    } else {
      // Non-admin cannot see all_admins notifications
      query.$or = query.$or.filter(cond => 
        !cond.recipients || cond.recipients !== 'all_admins'
      );
    }

    const notifications = await SystemNotification.find(query)
      .populate('sender', 'name email username avatar')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Mark if read by this user
    const notificationsWithReadStatus = notifications.map(notif => {
      const isRead = notif.readBy.some(r => r.user.equals(req.user.id));
      return {
        ...notif.toObject(),
        isRead
      };
    });

    const total = await SystemNotification.countDocuments(query);

    res.json({
      success: true,
      data: notificationsWithReadStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// @desc    Get unread notification count
// @route   GET /api/system-notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const query = {
      $or: [
        { recipients: 'all_users' },
        { recipients: 'selected_users', selectedUsers: req.user.id }
      ],
      deletedBy: { $ne: req.user.id },
      'readBy.user': { $ne: req.user.id },
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    };

    // Add admin notifications if user is admin
    if (req.user.role === 'admin') {
      query.$or.push(
        { recipients: 'all_admins' },
        { recipients: 'selected_admins', selectedUsers: req.user.id }
      );
    }

    const count = await SystemNotification.countDocuments(query);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/system-notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await SystemNotification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user can view this notification
    if (!notification.canView(req.user.id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await notification.markAsRead(req.user.id);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as read',
      error: error.message
    });
  }
};

// @desc    Delete notification for user
// @route   DELETE /api/system-notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await SystemNotification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.deleteForUser(req.user.id);

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// @desc    Get all users (for selection in notification form)
// @route   GET /api/system-notifications/users
// @access  Private/Master Admin
exports.getUsers = async (req, res) => {
  try {
    // Verify master admin
    const masterAdminId = process.env.ADMIN_USER_ID;
    if (req.user.id !== masterAdminId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const type = req.query.type; // 'all', 'admins', 'users'
    let query = {};

    if (type === 'admins') {
      query.role = 'admin';
    } else if (type === 'users') {
      query.role = 'user';
    }

    const users = await User.find(query)
      .select('name email username avatar role')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};
