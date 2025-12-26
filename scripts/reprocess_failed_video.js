// Re-process the failed video
require('dotenv').config();
const mongoose = require('mongoose');
const { addToHLSQueue } = require('../backend/utils/hlsQueue');
const Video = require('../backend/models/Video');

const videoId = '694d39d589a6494c17ccfd09';

mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Update video status back to queued
    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'queued',
      processingError: null
    });
    
    console.log(`✅ Video ${videoId} status reset to queued`);
    console.log('Note: Upload the video again through the frontend to re-process');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
