const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channelName: {
    type: String,
    required: [true, 'Please add a channel name'],
    trim: true,
    maxlength: [50, 'Channel name cannot be more than 50 characters']
  },
  channelDescription: {
    type: String,
    trim: true,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  channelBanner: {
    type: String,
    default: ''
  },
  subscribers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  videos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  country: {
    type: String,
    trim: true,
    default: ''
  },
  language: {
    type: String,
    trim: true,
    default: 'en'
  },
  socialLinks: {
    youtube: { type: String, trim: true, default: '' },
    twitter: { type: String, trim: true, default: '' },
    instagram: { type: String, trim: true, default: '' },
    facebook: { type: String, trim: true, default: '' },
    tiktok: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' }
  },
  contactInfo: {
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' }
  },
  totalViews: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
ChannelSchema.index({ user: 1 });
ChannelSchema.index({ channelName: 1 });

module.exports = mongoose.model('Channel', ChannelSchema);




