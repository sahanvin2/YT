const express = require('express');
const router = express.Router();
const {
  sendNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  deleteNotification,
  getUsers
} = require('../controllers/systemNotificationController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Send notification (Master Admin only)
router.post('/', sendNotification);

// Get user's notifications
router.get('/', getNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Get users for selection
router.get('/users', getUsers);

// Mark as read
router.patch('/:id/read', markAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

module.exports = router;
