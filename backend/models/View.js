const mongoose = require('mongoose');

const ViewSchema = new mongoose.Schema({
  video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ip: { type: String },
  createdAt: { type: Date, default: Date.now }
});

ViewSchema.index({ video: 1, createdAt: -1 });

module.exports = mongoose.model('View', ViewSchema);