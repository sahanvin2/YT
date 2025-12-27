const mongoose = require('mongoose');

const AdminMessageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  emailSent: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
AdminMessageSchema.index({ from: 1, to: 1, createdAt: -1 });
AdminMessageSchema.index({ to: 1, isRead: 1 });

// Virtual for checking if user can see this message
AdminMessageSchema.methods.canView = function(userId) {
  return (this.from.toString() === userId.toString() || 
          this.to.toString() === userId.toString()) &&
         !this.deletedBy.includes(userId);
};

// Mark as read
AdminMessageSchema.methods.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
};

// Soft delete for a specific user
AdminMessageSchema.methods.deleteForUser = async function(userId) {
  if (!this.deletedBy.includes(userId)) {
    this.deletedBy.push(userId);
    await this.save();
  }
};

module.exports = mongoose.model('AdminMessage', AdminMessageSchema);
