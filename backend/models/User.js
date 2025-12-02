const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  username: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  channelName: {
    type: String,
    trim: true,
    default: function () {
      return this.name || '';
    }
  },
  channelDescription: {
    type: String,
    trim: true,
    default: ''
  },
  videos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  subscribers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  subscribedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  watchHistory: [
    {
      video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
      watchedAt: { type: Date, default: Date.now }
    }
  ],
  likedVideos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  savedVideos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  playlists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist'
  }],
  avatar: {
    type: String,
    default: ''
  },
  channelBanner: {
    type: String,
    default: ''
  },
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
  settings: {
    defaultPlaybackQuality: {
      type: String,
      default: 'auto',
      enum: ['auto', '144', '240', '360', '480', '720', '1080', '1440']
    },
    defaultDownloadQuality: {
      type: String,
      default: 'highest',
      enum: ['highest', '1080', '720', '480', '360', '240', '144']
    },
    downloadOverWifiOnly: {
      type: Boolean,
      default: false
    },
    autoplay: {
      type: Boolean,
      default: true
    },
    subtitles: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Match password method
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
