const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const { sendEmail, sendBroadcastEmail, checkEmailHealth } = require('../utils/emailService');

/**
 * @route   GET /api/admin/email/health
 * @desc    Check email service health
 * @access  Admin only
 */
router.get('/health', protect, authorize('admin'), async (req, res) => {
  try {
    const health = await checkEmailHealth();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check email health',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/email/send
 * @desc    Send email to a single user
 * @access  Admin only
 */
router.post('/send', protect, authorize('admin'), async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, message'
      });
    }

    // Find user by email or ID
    let recipient;
    if (to.includes('@')) {
      recipient = await User.findOne({ email: to });
    } else {
      recipient = await User.findById(to);
    }

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #FF6B35 0%, #6C5CE7 100%);
            border-radius: 10px;
            padding: 40px;
            color: white;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 30px;
          }
          .content {
            background: white;
            color: #333;
            padding: 30px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .message {
            white-space: pre-wrap;
            line-height: 1.8;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            margin-top: 20px;
            opacity: 0.8;
          }
          .admin-badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 12px;
            margin-bottom: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🎬 Xclub</div>
          
          <div class="content">
            <span class="admin-badge">📢 From: ${req.user.username}</span>
            <h2>${subject}</h2>
            <p>Hi ${recipient.username},</p>
            <div class="message">${message}</div>
            <br>
            <p>Best regards,<br>The Xclub Team</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Xclub. All rights reserved.</p>
            <p>You're receiving this because you're a member of Xclub.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail(recipient.email, `[Xclub] ${subject}`, htmlBody);

    if (result.success) {
      res.json({
        success: true,
        message: `Email sent successfully to ${recipient.email}`,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: result.error || result.message
      });
    }
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/email/broadcast
 * @desc    Send email to multiple users
 * @access  Admin only
 */
router.post('/broadcast', protect, authorize('admin'), async (req, res) => {
  try {
    const { recipients, subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: subject, message'
      });
    }

    let users = [];

    // Handle different recipient options
    if (recipients === 'all') {
      users = await User.find({ isVerified: true }, 'email username');
    } else if (recipients === 'admins') {
      users = await User.find({ role: 'admin' }, 'email username');
    } else if (recipients === 'verified') {
      users = await User.find({ isVerified: true }, 'email username');
    } else if (Array.isArray(recipients)) {
      users = await User.find({ _id: { $in: recipients } }, 'email username');
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipients. Use "all", "admins", "verified", or array of user IDs'
      });
    }

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No recipients found'
      });
    }

    const recipientList = users.map(u => ({ email: u.email, name: u.username }));
    const result = await sendBroadcastEmail(recipientList, subject, message, req.user.username);

    res.json({
      success: true,
      message: `Broadcast complete: ${result.sent} sent, ${result.failed} failed`,
      data: {
        totalRecipients: users.length,
        sent: result.sent,
        failed: result.failed,
        errors: result.errors
      }
    });
  } catch (error) {
    console.error('Broadcast email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send broadcast email',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/email/users
 * @desc    Get list of users for email selection
 * @access  Admin only
 */
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('username email avatar role isVerified')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
});

module.exports = router;

