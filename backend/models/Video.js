const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema({
  quality: String,  // '144', '240', '360', '480', '720', '1080', '1440'
  url: String,
  size: Number,
  filePath: String  // B2 storage path
});

const SubtitleSchema = new mongoose.Schema({
  language: { type: String, required: true }, // 'en', 'es', 'fr', etc.
  label: { type: String, required: true }, // 'English', 'Spanish', 'French', etc.
  url: { type: String, required: true }, // URL to .vtt or .srt file
  isDefault: { type: Boolean, default: false }
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
  
  // Hierarchical Category System
  mainCategory: { 
    type: String, 
    enum: ['movies', 'series', 'documentaries', 'animation'],
    required: true,
    default: 'movies'
  },
  primaryGenre: { 
    type: String, 
    required: true,
    default: 'action'
  },
  secondaryGenres: [{ 
    type: String,
    validate: {
      validator: function(v) {
        return v.length <= 2; // Max 2 secondary genres
      },
      message: 'Maximum 2 secondary genres allowed'
    }
  }],
  subCategory: { type: String, default: null }, // Optional level 3
  
  // Legacy field for backwards compatibility (deprecated)
  category: { type: String, default: 'Other' },
  
  tags: [String],
  variants: [VariantSchema],
  subtitles: [SubtitleSchema], // Subtitle tracks
  hlsUrl: String,
  originalName: String,
  checksum: String,
  storageProvider: { type: String, default: 'b2' },

  visibility: { 
    type: String, 
    enum: ['public', 'private', 'unlisted'], 
    default: 'public'
  },

  cutStart: { type: Number, default: 0 },
  cutEnd: { type: Number, default: null },

  // Video processing status
  processingStatus: {
    type: String,
    enum: ['queued', 'processing', 'completed', 'failed', 'pending'],
    default: 'pending'
  },
  processingError: { type: String, default: null },
  processingCompleted: { type: Date, default: null },
  
  // Video visibility - only show when processing is complete
  isPublished: {
    type: Boolean,
    default: false
  },

  createdAt: { type: Date, default: Date.now },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],

});

// Index for search
VideoSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Video', VideoSchema);
