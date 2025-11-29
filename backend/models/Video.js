const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema({
  quality: String,  // '144', '240', '360', '480', '720', '1080', '1440'
  url: String,
  size: Number,
  filePath: String  // B2 storage path
});

const VideoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 2000 },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String, default: '' },
  duration: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, default: 'Other' },
  tags: [String],
  variants: [VariantSchema],
  hlsUrl: String,
  originalName: String,
  checksum: String,
  storageProvider: { type: String, default: 'b2' },

  visibility: { 
    type: String, 
    enum: ['public', 'private', 'unlisted'], 
    default: 'public'
  },

  createdAt: { type: Date, default: Date.now },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],

});

// Index for search
VideoSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Video', VideoSchema);
