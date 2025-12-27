const express = require('express');
const router = express.Router();
const {
  sendAdminMessage,
  getAdminMessages,
  getAdminMessage,
  deleteAdminMessage,
  getAdminList,
  markAsRead
} = require('../controllers/adminMessageController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Admin list
router.get('/admins', getAdminList);

// Message routes
router.post('/messages', sendAdminMessage);
router.get('/messages', getAdminMessages);
router.get('/messages/:id', getAdminMessage);
router.delete('/messages/:id', deleteAdminMessage);
router.patch('/messages/:id/read', markAsRead);

module.exports = router;
