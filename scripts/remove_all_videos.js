const mongoose = require('mongoose');
const Video = require('../backend/models/Video');
const View = require('../backend/models/View');
const Comment = require('../backend/models/Comment');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const removeAllVideos = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MongoDB URI not found in environment variables');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Remove all videos
    const videoResult = await Video.deleteMany({});
    console.log(`✅ Removed ${videoResult.deletedCount} videos`);

    // Remove all views
    const viewResult = await View.deleteMany({});
    console.log(`✅ Removed ${viewResult.deletedCount} views`);

    // Remove all comments
    const commentResult = await Comment.deleteMany({});
    console.log(`✅ Removed ${commentResult.deletedCount} comments`);

    console.log('\n🎉 All videos, views, and comments have been removed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

removeAllVideos();
