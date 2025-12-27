const mongoose = require('mongoose');

const SystemNotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error', 'announcement'],
    default: 'info'
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipients: {
    type: String,
    enum: ['all_users', 'all_admins', 'selected_users', 'selected_admins'],
    required: true
  },
  selectedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  expiresAt: {
    type: Date,
    default: null // null = never expires
  },
  link: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'bell'
  },
  deletedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
SystemNotificationSchema.index({ recipients: 1, createdAt: -1 });
SystemNotificationSchema.index({ 'selectedUsers': 1 });
SystemNotificationSchema.index({ sender: 1 });
SystemNotificationSchema.index({ expiresAt: 1 });

// Method to check if user can view this notification
SystemNotificationSchema.methods.canView = function(userId, userRole) {
  if (this.deletedBy.includes(userId)) {
    return false;
  }
  
  if (this.expiresAt && this.expiresAt < new Date()) {
    return false;
  }
  
  if (this.recipients === 'all_users') {
    return true;
  }
  
  if (this.recipients === 'all_admins' && userRole === 'admin') {
    return true;
  }
  
  if (this.recipients === 'selected_users' || this.recipients === 'selected_admins') {
    return this.selectedUsers.some(id => id.equals(userId));
  }
  
  return false;
};

// Method to mark as read
SystemNotificationSchema.methods.markAsRead = function(userId) {
  const alreadyRead = this.readBy.some(r => r.user.equals(userId));
  if (!alreadyRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
  }
  return this.save();
};

// Method to soft delete for user
SystemNotificationSchema.methods.deleteForUser = function(userId) {
  if (!this.deletedBy.includes(userId)) {
    this.deletedBy.push(userId);
  }
  return this.save();
};

module.exports = mongoose.model('SystemNotification', SystemNotificationSchema);
