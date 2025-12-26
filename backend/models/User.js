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
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpire: {
    type: Date,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpire: {
    type: Date,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isUploadAdmin: {
    type: Boolean,
    default: false // Only admins who can upload videos locally
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
      enum: ['auto', '144', '240', '360', '480', '720', '1080', '1440', '2160']
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
    },
    notifications: {
      newVideos: {
        type: Boolean,
        default: true
      },
      comments: {
        type: Boolean,
        default: true
      },
      likes: {
        type: Boolean,
        default: true
      },
      followers: {
        type: Boolean,
        default: true
      }
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

// Generate email verification token
UserSchema.methods.getEmailVerificationToken = function () {
  const crypto = require('crypto');
  
  // Generate token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to field
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  // Set expire (24 hours)
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
  
  return verificationToken;
};

// Generate password reset token
UserSchema.methods.getPasswordResetToken = function () {
  const crypto = require('crypto');
  
  // Generate token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to field
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expire (1 hour)
  this.passwordResetExpire = Date.now() + 60 * 60 * 1000;
  
  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
