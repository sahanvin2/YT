const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: ['banner_video', 'featured_videos', 'site_name', 'site_description', 'maintenance_mode']
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

// Static method to get a setting
siteSettingsSchema.statics.getSetting = async function(key) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : null;
};

// Static method to set a setting
siteSettingsSchema.statics.setSetting = async function(key, value, userId, description = '') {
  return await this.findOneAndUpdate(
    { key },
    { 
      key, 
      value, 
      updatedBy: userId,
      description 
    },
    { 
      upsert: true, 
      new: true 
    }
  );
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);

