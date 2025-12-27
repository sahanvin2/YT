const AdminMessage = require('../models/AdminMessage');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

/**
 * Send a message from one admin to another
 * @route POST /api/admin/messages
 */
exports.sendAdminMessage = async (req, res) => {
  try {
    const { toUserId, subject, message } = req.body;
    const fromUserId = req.user._id;

    // Validate input
    if (!toUserId || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: toUserId, subject, message'
      });
    }

    // Check if sender is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can send admin messages'
      });
    }

    // Check if recipient exists and is admin
    const recipient = await User.findById(toUserId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    if (recipient.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Can only send messages to other admins'
      });
    }

    // Create message
    const adminMessage = await AdminMessage.create({
      from: fromUserId,
      to: toUserId,
      subject,
      message
    });

    // Populate sender info
    await adminMessage.populate('from', 'username email avatar');
    await adminMessage.populate('to', 'username email');

    // Send email notification via SMTP
    try {
      const emailSubject = `[ADMIN MESSAGE] ${subject}`;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🔒 Private Admin Message</h1>
          </div>
          
          <div style="background: #f7f7f7; padding: 30px; border-left: 4px solid #667eea;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              <strong>From:</strong> ${adminMessage.from.username} (${adminMessage.from.email})
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #667eea; margin-top: 0;">${subject}</h2>
              <p style="color: #555; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
            
            <p style="margin-top: 30px; color: #888; font-size: 14px;">
              <strong>⚠️ This is a private admin-only message.</strong><br>
              Please do not share this content with non-admin users.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/messages" 
                 style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                📬 View Message in Dashboard
              </a>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">This email was sent to admin users only. It is confidential and private.</p>
            <p style="margin: 10px 0 0 0; color: #888;">XCLUB Admin System - ${new Date().getFullYear()}</p>
          </div>
        </div>
      `;

      await sendEmail(recipient.email, emailSubject, emailBody);
      adminMessage.emailSent = true;
      await adminMessage.save();

    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Admin message sent successfully',
      data: adminMessage
    });

  } catch (error) {
    console.error('Send admin message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send admin message',
      error: error.message
    });
  }
};

/**
 * Get messages for the current admin
 * @route GET /api/admin/messages
 */
exports.getAdminMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type = 'inbox', page = 1, limit = 20 } = req.query;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access admin messages'
      });
    }

    let query = {};
    
    if (type === 'inbox') {
      query = {
        to: userId,
        deletedBy: { $ne: userId }
      };
    } else if (type === 'sent') {
      query = {
        from: userId,
        deletedBy: { $ne: userId }
      };
    } else if (type === 'unread') {
      query = {
        to: userId,
        isRead: false,
        deletedBy: { $ne: userId }
      };
    }

    const skip = (page - 1) * limit;

    const messages = await AdminMessage.find(query)
      .populate('from', 'username email avatar')
      .populate('to', 'username email avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await AdminMessage.countDocuments(query);
    const unreadCount = await AdminMessage.countDocuments({
      to: userId,
      isRead: false,
      deletedBy: { $ne: userId }
    });

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        unreadCount
      }
    });

  } catch (error) {
    console.error('Get admin messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin messages',
      error: error.message
    });
  }
};

/**
 * Get a single message by ID
 * @route GET /api/admin/messages/:id
 */
exports.getAdminMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access admin messages'
      });
    }

    const message = await AdminMessage.findById(id)
      .populate('from', 'username email avatar')
      .populate('to', 'username email avatar');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user can view this message
    if (!message.canView(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this message'
      });
    }

    // Mark as read if recipient is viewing
    if (message.to._id.toString() === userId.toString() && !message.isRead) {
      await message.markAsRead();
    }

    res.json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error('Get admin message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin message',
      error: error.message
    });
  }
};

/**
 * Delete a message for the current user
 * @route DELETE /api/admin/messages/:id
 */
exports.deleteAdminMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete admin messages'
      });
    }

    const message = await AdminMessage.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user can delete this message
    if (!message.canView(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this message'
      });
    }

    // Soft delete for this user
    await message.deleteForUser(userId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete admin message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete admin message',
      error: error.message
    });
  }
};

/**
 * Get list of all admins
 * @route GET /api/admin/list
 */
exports.getAdminList = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access admin list'
      });
    }

    const admins = await User.find({ role: 'admin' })
      .select('username email avatar createdAt')
      .sort({ username: 1 });

    res.json({
      success: true,
      data: admins
    });

  } catch (error) {
    console.error('Get admin list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin list',
      error: error.message
    });
  }
};

/**
 * Mark message as read
 * @route PATCH /api/admin/messages/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await AdminMessage.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only recipient can mark as read
    if (message.to.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the recipient can mark this message as read'
      });
    }

    await message.markAsRead();

    res.json({
      success: true,
      message: 'Message marked as read',
      data: message
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
      error: error.message
    });
  }
};
