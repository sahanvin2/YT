const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');

// Get notifications (protected)
router.get('/', protect, getNotifications);

// Get unread count (protected)
router.get('/unread-count', protect, getUnreadCount);

// Mark notification as read (protected)
router.patch('/:notificationId/read', protect, markAsRead);

// Mark all as read (protected)
router.patch('/mark-all-read', protect, markAllAsRead);

// Delete notification (protected)
router.delete('/:notificationId', protect, deleteNotification);

module.exports = router;
